import type { Prisma } from "@prisma/client";
import { prisma } from "@/db";
import { getSettings, stockState } from "@/services/settings";
import { HttpError, notFound } from "@/middleware/errorHandler";
import type { ProductInput } from "@/validation/product";
import type { AdminProductQuery } from "@/validation/adminQuery";

const PAGE_SIZE = 25;

export async function listAdminProducts(query: AdminProductQuery) {
  const settings = await getSettings();

  const where: Prisma.ProductWhereInput = {};
  if (query.q) where.title = { contains: query.q, mode: "insensitive" };
  if (query.status) where.status = query.status;
  if (query.category) where.category = { slug: query.category };

  const page = query.page ?? 1;

  const [products, categories, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        variants: { orderBy: { size: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => ({ ...v, state: stockState(v.stock, settings.lowStockThreshold) })),
    })),
    categories,
    lowStockThreshold: settings.lowStockThreshold,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminProductDetail(id: string) {
  const [product, categories, stockLogs] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { size: "asc" } } },
    }),
    prisma.category.findMany({
      where: { comingSoon: false },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.stockLog.findMany({
      where: { variant: { productId: id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        variant: { select: { size: true, sku: true } },
        admin: { select: { name: true } },
      },
    }),
  ]);

  if (!product) throw notFound("Product");

  return {
    product,
    categories,
    stockLogs: stockLogs.map((log) => ({
      id: log.id,
      delta: log.delta,
      stockAfter: log.stockAfter,
      reason: log.reason,
      source: log.source,
      size: log.variant.size,
      sku: log.variant.sku,
      adminName: log.admin?.name ?? null,
      createdAt: log.createdAt,
    })),
  };
}

export async function createAdminProduct(staffId: string, input: ProductInput) {
  const [slugTaken, skuTaken] = await Promise.all([
    prisma.product.findUnique({ where: { slug: input.slug }, select: { id: true } }),
    prisma.productVariant.findFirst({
      where: { sku: { in: input.variants.map((v) => v.sku) } },
      select: { sku: true },
    }),
  ]);

  if (slugTaken) throw new HttpError("A product with this slug already exists.", 409);
  if (skuTaken) throw new HttpError(`SKU "${skuTaken.sku}" is already in use.`, 409);

  return prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        categoryId: input.categoryId,
        fit: input.fit || null,
        type: input.type || null,
        fabric: input.fabric || null,
        careInstructions: input.careInstructions || null,
        basePrice: input.basePrice,
        mrp: input.mrp,
        images: input.images,
        status: input.status,
        isFeatured: input.isFeatured ?? false,
        isNewArrival: input.isNewArrival ?? false,
        isBestseller: input.isBestseller ?? false,
        variants: {
          create: input.variants.map((v) => ({
            size: v.size,
            color: v.color || null,
            colorHex: v.colorHex || null,
            sku: v.sku,
            stock: v.stock,
            priceOverride: v.priceOverride ?? null,
          })),
        },
      },
      include: { variants: true },
    });

    // Opening stock is a movement too — log it so the audit trail starts at creation.
    for (const variant of created.variants) {
      if (variant.stock > 0) {
        await tx.stockLog.create({
          data: {
            variantId: variant.id,
            delta: variant.stock,
            stockAfter: variant.stock,
            reason: "Opening stock at product creation",
            source: "MANUAL",
            adminId: staffId,
          },
        });
      }
    }

    return created;
  });
}

export async function updateAdminProduct(id: string, staffId: string, input: ProductInput) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!existing) throw notFound("Product");

  const slugTaken = await prisma.product.findFirst({
    where: { slug: input.slug, id: { not: id } },
    select: { id: true },
  });
  if (slugTaken) throw new HttpError("Another product already uses this slug.", 409);

  const keptIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
  const removed = existing.variants.filter((v) => !keptIds.includes(v.id));

  // A variant referenced by an order can't be deleted without orphaning history.
  const referenced = removed.length
    ? await prisma.orderItem.findMany({
        where: { productVariantId: { in: removed.map((v) => v.id) } },
        select: { productVariantId: true },
      })
    : [];
  const referencedIds = new Set(referenced.map((r) => r.productVariantId));
  const blocked = removed.filter((v) => referencedIds.has(v.id));

  if (blocked.length > 0) {
    throw new HttpError(
      `Cannot remove size${blocked.length > 1 ? "s" : ""} ${blocked
        .map((v) => v.size)
        .join(", ")} — ${blocked.length > 1 ? "they appear" : "it appears"} on existing orders. Set stock to 0 instead.`,
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        categoryId: input.categoryId,
        fit: input.fit || null,
        type: input.type || null,
        fabric: input.fabric || null,
        careInstructions: input.careInstructions || null,
        basePrice: input.basePrice,
        mrp: input.mrp,
        images: input.images,
        status: input.status,
        isFeatured: input.isFeatured ?? false,
        isNewArrival: input.isNewArrival ?? false,
        isBestseller: input.isBestseller ?? false,
      },
    });

    if (removed.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: removed.map((v) => v.id) } } });
    }

    for (const variant of input.variants) {
      const prior = variant.id ? existing.variants.find((v) => v.id === variant.id) : undefined;

      const data = {
        size: variant.size,
        color: variant.color || null,
        colorHex: variant.colorHex || null,
        sku: variant.sku,
        stock: variant.stock,
        priceOverride: variant.priceOverride ?? null,
      };

      const saved = prior
        ? await tx.productVariant.update({ where: { id: prior.id }, data })
        : await tx.productVariant.create({ data: { ...data, productId: id } });

      const delta = variant.stock - (prior?.stock ?? 0);
      if (delta !== 0) {
        await tx.stockLog.create({
          data: {
            variantId: saved.id,
            delta,
            stockAfter: variant.stock,
            reason: prior ? "Stock edited via product form" : "Opening stock for new size",
            source: "MANUAL",
            adminId: staffId,
          },
        });
      }
    }
  });

  return { id, slug: input.slug };
}

export async function deleteAdminProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { select: { id: true } } },
  });
  if (!product) throw notFound("Product");

  const referenced = await prisma.orderItem.findFirst({
    where: { productVariantId: { in: product.variants.map((v) => v.id) } },
    select: { id: true },
  });

  if (referenced) {
    throw new HttpError(
      "This product appears on existing orders and can't be deleted. Set its status to Archived instead.",
      409,
    );
  }

  await prisma.product.delete({ where: { id } });
}

export async function updateVariantStock(
  id: string,
  staffId: string,
  input: { stock: number; reason?: string },
) {
  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) throw notFound("Variant");

  const delta = input.stock - variant.stock;

  const [updated, settings] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const next = await tx.productVariant.update({ where: { id }, data: { stock: input.stock } });

      if (delta !== 0) {
        await tx.stockLog.create({
          data: {
            variantId: id,
            delta,
            stockAfter: input.stock,
            reason: input.reason ?? "Manual stock edit",
            source: "MANUAL",
            adminId: staffId,
          },
        });
      }

      return next;
    }),
    getSettings(),
  ]);

  return { id: updated.id, stock: updated.stock, state: stockState(updated.stock, settings.lowStockThreshold) };
}

export async function listAdminCategories() {
  return prisma.category.findMany({
    where: { comingSoon: false },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
}
