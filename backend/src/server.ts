import express from "express";
import cors from "cors";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import { env } from "@/config/env";
import { logger } from "@/logger";
import { attachUser } from "@/middleware/auth";
import { usesB2, getB2Object } from "@/storage";
import { errorHandler } from "@/middleware/errorHandler";

import { authRouter } from "@/modules/auth/routes";
import {
  productsRouter,
  categoriesRouter,
  sitemapRouter,
} from "@/modules/products/routes";
import {
  adminProductsRouter,
  adminVariantsRouter,
  adminCategoriesRouter,
} from "@/modules/products/admin.routes";
import { addressesRouter, wishlistRouter, accountRouter } from "@/modules/users/routes";
import { adminCustomersRouter } from "@/modules/users/admin.routes";
import { ordersRouter, couponsRouter } from "@/modules/orders/routes";
import { adminOrdersRouter } from "@/modules/orders/admin.routes";
import {
  adminDashboardRouter,
  settingsRouter,
  adminSettingsRouter,
  adminUploadsRouter,
} from "@/modules/admin/routes";

const app = express();

app.use(
  cors({
    // Not load-bearing for normal use — the browser only ever calls the frontend (BFF proxy
    // pattern). Configured for defense-in-depth and direct backend testing (Postman/curl).
    origin: env.frontendOrigin,
  }),
);
app.use(express.json());

app.use(
  pinoHttp({
    logger,
    // Reuse an inbound correlation id if the caller already set one, otherwise mint one
    // and echo it back so a client-reported issue can be traced through these logs.
    genReqId: (req, res) => {
      const existing = req.headers["x-request-id"];
      const id = typeof existing === "string" ? existing : randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    autoLogging: { ignore: (req) => req.url === "/health" },
  }),
);

// Uploaded/seeded product & banner imagery, served at this server's own origin.
if (usesB2()) {
  // Images live in a private B2 bucket; stream them through the API.
  app.get(/^\/uploads\/(.+)$/, async (req, res, next) => {
    try {
      const key = decodeURIComponent((req.params as Record<string, string>)[0]);
      if (key.includes("..")) return next();
      const obj = await getB2Object(key);
      if (!obj) return next();
      res.setHeader("Content-Type", obj.contentType);
      if (obj.contentLength) res.setHeader("Content-Length", String(obj.contentLength));
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      obj.body.pipe(res);
    } catch (err) {
      next(err);
    }
  });
}
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(attachUser);

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/sitemap", sitemapRouter);
app.use("/api/addresses", addressesRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/account", accountRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/coupons", couponsRouter);

app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/variants", adminVariantsRouter);
app.use("/api/admin/categories", adminCategoriesRouter);
app.use("/api/admin/customers", adminCustomersRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/admin/uploads", adminUploadsRouter);

app.use(errorHandler);

// Vercel runs the exported app itself; only bind a port for local/Docker runs.
if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    logger.info(`Blank Hangar API listening on http://localhost:${env.port}`);
  });
}

export default app;
