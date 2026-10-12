import type { Prisma } from "@prisma/client";
import { prisma } from "@/db";
import { getSettings, stockState } from "@/services/settings";
import { toArray, type ProductQuery } from "@/validation/catalog";
import type { NavCategory, ProductCardData, ProductDetailData } from "@/types/catalog";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];

/** Categories that drive the mega menu / mobile nav. Adding a category is a data change only. */
export async function getNavCategories(): Promise<NavCategory[]> {
  return prisma.category.findMany({
    // Categories are created without a parentId, so Mongo stores the field as absent, not
    // explicit null — Prisma's null-equality filter only matches explicit null, so this needs
    // isSet:false to actually match top-level categories.
    where: { parentId: { isSet: false } },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, image: true, comingSoon: true, description: true },
  });
}

const CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  basePrice: true,
  mrp: true,
  images: true,
  fit: true,
  type: true,
  variants: { select: { stock: true, color: true, colorHex: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof CARD_SELECT }>;

export function toProductCard(product: CardRow, lowStockThreshold: number): ProductCardData {
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const colorMap = new Map<string, string>();
  for (const v of product.variants) {
    if (v.color && v.colorHex && !colorMap.has(v.color)) colorMap.set(v.color, v.colorHex);
  }

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    basePrice: product.basePrice,
    mrp: product.mrp,
    images: product.images,
    fit: product.fit,
    type: product.type,
    colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
    totalStock,
    isSoldOut: totalStock <= 0,
    isLowStock: totalStock > 0 && totalStock <= lowStockThreshold,
  };
}

export async function getProductCards(
  where: Prisma.ProductWhereInput = {},
  options: { take?: number; orderBy?: Prisma.ProductOrderByWithRelationInput } = {},
): Promise<ProductCardData[]> {
  const settings = await getSettings();
  const products = await prisma.product.findMany({
    where: { status: "LIVE", ...where },
    orderBy: options.orderBy ?? { createdAt: "desc" },
    take: options.take,
    select: CARD_SELECT,
  });
  return products.map((p) => toProductCard(p, settings.lowStockThreshold));
}

export async function getProductDetail(slug: string): Promise<ProductDetailData | null> {
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true, slug: true } },
        variants: true,
      },
    }),
    getSettings(),
  ]);

  if (!product || product.status !== "LIVE") return null;

  const variants = [...product.variants]
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
    .map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      sku: v.sku,
      stock: v.stock,
      price: v.priceOverride ?? product.basePrice,
      state: stockState(v.stock, settings.lowStockThreshold),
    }));

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    fit: product.fit,
    type: product.type,
    fabric: product.fabric,
    careInstructions: product.careInstructions,
    basePrice: product.basePrice,
    mrp: product.mrp,
    images: product.images,
    category: product.category,
    variants,
  };
}

/**
 * Shared product search used by the collection page and /api/products.
 * Size/colour filters match against variants; fit/type against product attributes.
 */
export async function searchProducts(query: ProductQuery, categorySlug?: string) {
  const settings = await getSettings();

  const sizes = toArray(query.size);
  const colors = toArray(query.color);
  const fits = toArray(query.fit);
  const types = toArray(query.type);

  const where: Prisma.ProductWhereInput = { status: "LIVE" };
  const and: Prisma.ProductWhereInput[] = [];

  if (categorySlug && categorySlug !== "all") {
    where.category = { slug: categorySlug };
  }

  if (query.q) {
    and.push({
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { fit: { contains: query.q, mode: "insensitive" } },
        { type: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }

  if (fits.length) and.push({ fit: { in: fits } });
  if (types.length) and.push({ type: { in: types } });
  if (query.fabric) and.push({ fabric: { contains: query.fabric, mode: "insensitive" } });

  // A size/colour filter should only match products that actually have that variant in stock.
  if (sizes.length) and.push({ variants: { some: { size: { in: sizes }, stock: { gt: 0 } } } });
  if (colors.length) and.push({ variants: { some: { color: { in: colors } } } });

  if (query.minPrice !== undefined) and.push({ basePrice: { gte: query.minPrice } });
  if (query.maxPrice !== undefined) and.push({ basePrice: { lte: query.maxPrice } });

  if (query.isNewArrival === "1") and.push({ isNewArrival: true });
  if (query.isBestseller === "1") and.push({ isBestseller: true });
  if (query.excludeId) and.push({ id: { not: query.excludeId } });

  if (and.length) where.AND = and;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === "price-asc"
      ? { basePrice: "asc" }
      : query.sort === "price-desc"
        ? { basePrice: "desc" }
        : query.sort === "bestsellers"
          ? { isBestseller: "desc" }
          : query.sort === "featured"
            ? { isFeatured: "desc" }
            : { createdAt: "desc" };

  const take = query.take ?? 12;
  const skip = query.skip ?? 0;

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take: take + 1, skip, select: CARD_SELECT }),
    prisma.product.count({ where }),
  ]);

  const hasMore = rows.length > take;
  let products = rows.slice(0, take).map((p) => toProductCard(p, settings.lowStockThreshold));

  // "On sale" depends on the mrp/price relationship, which Prisma can't compare in a filter.
  if (query.sale === "1") products = products.filter((p) => p.mrp > p.basePrice);

  return { products, total, hasMore, skip, take };
}

/** Live variant availability for a product — polled by the PDP so stock edits show up without a refresh. */
export async function getProductAvailability(slug: string) {
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      select: { id: true, status: true, variants: { select: { id: true, stock: true } } },
    }),
    getSettings(),
  ]);

  if (!product || product.status !== "LIVE") return null;

  return {
    variants: product.variants.map((v) => ({
      id: v.id,
      stock: v.stock,
      state: stockState(v.stock, settings.lowStockThreshold),
    })),
  };
}
