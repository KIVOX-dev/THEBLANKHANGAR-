import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "@/db";
import { requireAdmin, requireStaff } from "@/middleware/auth";
import { asyncRoute, HttpError } from "@/middleware/errorHandler";
import { getDashboardData } from "@/services/admin";
import { getSettings } from "@/services/settings";
import { storeImage } from "@/storage";

export const adminDashboardRouter = Router();
export const settingsRouter = Router(); // public GET
export const adminSettingsRouter = Router(); // admin PATCH
export const adminUploadsRouter = Router();

adminDashboardRouter.get(
  "/",
  requireStaff,
  asyncRoute(async (_req, res) => {
    const data = await getDashboardData();
    res.json(data);
  }),
);

settingsRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const settings = await getSettings();
    res.json({ settings });
  }),
);

const bannerSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(200).optional().or(z.literal("")),
  cta: z.string().trim().max(40).optional().or(z.literal("")),
  href: z.string().trim().min(1).max(200),
  image: z.string().trim().min(1).max(500),
  sortOrder: z.coerce.number().int().min(0),
  darkBackground: z.boolean(),
});

const settingsSchema = z.object({
  shippingCharge: z.coerce.number().min(0).max(10000),
  freeShippingThreshold: z.coerce.number().min(0).max(1000000),
  taxRatePercent: z.coerce.number().min(0).max(100),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),
  storeEmail: z.string().email(),
  storePhone: z.string().trim().min(3).max(30),
  announcementMessages: z.array(z.string().trim()).transform((arr) => arr.filter(Boolean)),
  heroBanners: z.array(bannerSchema),
});

/** Admin-only: shipping, tax, thresholds, announcement text and hero banners — all live, no redeploy. */
adminSettingsRouter.patch(
  "/",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const input = settingsSchema.parse(req.body);

    const settings = await prisma.settings.upsert({
      where: { singleton: "SETTINGS" },
      create: { singleton: "SETTINGS", ...input },
      update: input,
    });

    res.json({ settings });
  }),
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

adminUploadsRouter.post(
  "/",
  requireStaff,
  upload.single("file"),
  asyncRoute(async (req, res) => {
    if (!req.file) throw new HttpError("No file was uploaded.", 400);

    const stored = await storeImage({
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    });

    res.status(201).json(stored);
  }),
);
