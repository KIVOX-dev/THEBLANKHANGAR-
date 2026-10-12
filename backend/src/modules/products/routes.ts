import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/db";
import { requireAuth } from "@/middleware/auth";
import { asyncRoute, HttpError, notFound } from "@/middleware/errorHandler";
import { rateLimit } from "@/middleware/rateLimit";
import {
  getNavCategories,
  getProductAvailability,
  getProductDetail,
  searchProducts,
} from "@/services/catalog";
import { getProductReviews } from "@/services/reviews";
import { parseProductQuery } from "@/validation/catalog";

export const productsRouter = Router();
export const categoriesRouter = Router();
export const sitemapRouter = Router();

productsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const query = parseProductQuery(req.query as Record<string, string | string[]>);
    const result = await searchProducts(query, query.category);
    res.json(result);
  }),
);

productsRouter.get(
  "/:slug",
  asyncRoute(async (req, res) => {
    const product = await getProductDetail(String(req.params.slug));
    if (!product) throw notFound("Product");
    res.json({ product });
  }),
);

/** Polled by the PDP so an admin stock edit flips a size to "Out of Stock" without a reload. */
productsRouter.get(
  "/:slug/availability",
  asyncRoute(async (req, res) => {
    const availability = await getProductAvailability(String(req.params.slug));
    if (!availability) throw notFound("Product");
    res.set("Cache-Control", "no-store").json(availability);
  }),
);

const reviewQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(50).optional(),
});

/** `:id` here is the product id, not a slug — reviews are posted/read from the PDP with the id in hand. */
productsRouter.get(
  "/:id/reviews",
  asyncRoute(async (req, res) => {
    const query = reviewQuerySchema.parse(req.query);
    const reviews = await getProductReviews(String(req.params.id), query);
    res.json(reviews);
  }),
);

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().min(10, "Tell us a little more").max(1000),
});

productsRouter.post(
  "/:id/reviews",
  requireAuth,
  rateLimit(5, 60_000),
  asyncRoute(async (req, res) => {
    const user = req.user!;
    const productId = String(req.params.id);
    const input = reviewSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new HttpError("Product not found.", 404);

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId: user.id } },
    });
    if (existing) throw new HttpError("You have already reviewed this product.", 409);

    const created = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body,
      },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json({
      review: {
        id: created.id,
        rating: created.rating,
        title: created.title,
        body: created.body,
        authorName: created.user.name,
        createdAt: created.createdAt.toISOString(),
      },
    });
  }),
);

categoriesRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const categories = await getNavCategories();
    res.json({ categories });
  }),
);

/** Backs generateStaticParams and sitemap.ts — every live product/category slug + updatedAt. */
sitemapRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: "LIVE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { comingSoon: false },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    res.json({ products, categories });
  }),
);
