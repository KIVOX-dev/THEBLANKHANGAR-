import { randomUUID } from "node:crypto";
import { prisma } from "@/db";

/** Creates a minimal category → product → variant chain plus a user+address to order against. */
export async function createOrderFixture(opts: { stock?: number } = {}) {
  const unique = randomUUID().slice(0, 8);
  const stock = opts.stock ?? 10;

  const category = await prisma.category.create({
    data: { name: `Test Category ${unique}`, slug: `test-category-${unique}` },
  });

  const product = await prisma.product.create({
    data: {
      title: `Test Product ${unique}`,
      slug: `test-product-${unique}`,
      description: "Fixture product for integration tests.",
      categoryId: category.id,
      basePrice: 1000,
      mrp: 1200,
      images: [],
      status: "LIVE",
      variants: {
        create: {
          size: "M",
          sku: `TEST-${unique}`,
          stock,
        },
      },
    },
    include: { variants: true },
  });

  const user = await prisma.user.create({
    data: {
      name: `Test User ${unique}`,
      email: `test-${unique}@example.com`,
      passwordHash: "not-a-real-hash",
      role: "CUSTOMER",
    },
  });

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      fullName: "Test User",
      line1: "1 Test Street",
      city: "Testville",
      state: "TS",
      pincode: "000000",
      phone: "9000000000",
      isDefault: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: `Test Admin ${unique}`,
      email: `test-admin-${unique}@example.com`,
      passwordHash: "not-a-real-hash",
      role: "ADMIN",
    },
  });

  return { category, product, variant: product.variants[0], user, address, admin };
}

/** Deletes everything an order fixture (and any order created against it) could have touched. */
export async function cleanupOrderFixture(fixture: Awaited<ReturnType<typeof createOrderFixture>>) {
  const orders = await prisma.order.findMany({
    where: { userId: fixture.user.id },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  if (orderIds.length > 0) {
    await prisma.stockLog.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }

  await prisma.stockLog.deleteMany({ where: { variantId: fixture.variant.id } });
  await prisma.address.delete({ where: { id: fixture.address.id } });
  await prisma.user.delete({ where: { id: fixture.user.id } });
  await prisma.user.delete({ where: { id: fixture.admin.id } });
  await prisma.productVariant.deleteMany({ where: { productId: fixture.product.id } });
  await prisma.product.delete({ where: { id: fixture.product.id } });
  await prisma.category.delete({ where: { id: fixture.category.id } });
}
