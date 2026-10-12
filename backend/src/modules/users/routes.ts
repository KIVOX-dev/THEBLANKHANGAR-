import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/db";
import { requireAuth } from "@/middleware/auth";
import { asyncRoute, HttpError, notFound } from "@/middleware/errorHandler";
import { getSettings } from "@/services/settings";
import { toProductCard } from "@/services/catalog";
import { addressSchema } from "@/validation/address";

export const addressesRouter = Router();
export const wishlistRouter = Router();
export const accountRouter = Router();

addressesRouter.use(requireAuth);

addressesRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json({ addresses });
  }),
);

addressesRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const user = req.user!;
    const input = addressSchema.parse(req.body);
    const existingCount = await prisma.address.count({ where: { userId: user.id } });
    const makeDefault = input.isDefault || existingCount === 0;

    if (makeDefault) {
      await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        phone: input.phone,
        isDefault: makeDefault,
      },
    });

    res.status(201).json({ address });
  }),
);

addressesRouter.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const user = req.user!;
    const id = String(req.params.id);
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw notFound("Address");

    const input = addressSchema.parse(req.body);

    if (input.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        fullName: input.fullName,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        phone: input.phone,
        isDefault: input.isDefault ?? existing.isDefault,
      },
    });

    res.json({ address });
  }),
);

addressesRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const user = req.user!;
    const id = String(req.params.id);
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw notFound("Address");

    await prisma.address.delete({ where: { id } });

    // Keep exactly one default address if any remain.
    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    res.json({ deleted: true });
  }),
);

wishlistRouter.use(requireAuth);

wishlistRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user!.id },
      select: { productId: true },
    });
    res.json({ productIds: items.map((i) => i.productId) });
  }),
);

/** Full product-card data for the wishlist page, as opposed to the bare id list above. */
wishlistRouter.get(
  "/products",
  asyncRoute(async (req, res) => {
    const [items, settings] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              basePrice: true,
              mrp: true,
              images: true,
              fit: true,
              type: true,
              status: true,
              variants: { select: { stock: true, color: true, colorHex: true } },
            },
          },
        },
      }),
      getSettings(),
    ]);

    const products = items
      .filter((item) => item.product.status === "LIVE")
      .map((item) => toProductCard(item.product, settings.lowStockThreshold));

    res.json({ products });
  }),
);

const wishlistBodySchema = z.object({ productId: z.string().min(1) });

wishlistRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const user = req.user!;
    const { productId } = wishlistBodySchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new HttpError("Product not found.", 404);

    await prisma.wishlist.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });

    res.json({ saved: true });
  }),
);

wishlistRouter.delete(
  "/",
  asyncRoute(async (req, res) => {
    const user = req.user!;
    const { productId } = wishlistBodySchema.parse(req.body);
    await prisma.wishlist.deleteMany({ where: { userId: user.id, productId } });
    res.json({ saved: false });
  }),
);

/** Bundle for the account overview page: profile + recent orders + saved/wishlist counts. */
accountRouter.get(
  "/overview",
  requireAuth,
  asyncRoute(async (req, res) => {
    const userId = req.user!.id;

    const [profile, orders, addressCount, wishlistCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { items: true },
      }),
      prisma.address.count({ where: { userId } }),
      prisma.wishlist.count({ where: { userId } }),
    ]);

    res.json({ profile, orders, addressCount, wishlistCount });
  }),
);
