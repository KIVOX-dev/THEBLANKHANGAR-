import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/db";
import { confirmPayment, createOrder, OrderError, updateOrderStatus } from "@/services/orders";
import { createOrderFixture, cleanupOrderFixture } from "./fixtures";

type Fixture = Awaited<ReturnType<typeof createOrderFixture>>;

describe("order creation (DB-P2-03 / stock decrement regression)", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await createOrderFixture({ stock: 10 });
  });

  afterEach(async () => {
    await cleanupOrderFixture(fixture);
  });

  it("decrements stock, prices the order server-side, and writes one accurate stock log", async () => {
    const { order } = await createOrder({
      userId: fixture.user.id,
      lines: [{ variantId: fixture.variant.id, quantity: 2 }],
      shippingAddressId: fixture.address.id,
    });

    // basePrice 1000 * 2 = 2000 subtotal; above the default free-shipping threshold (1499)
    // so shipping is waived; 5% tax on 2000 = 100.
    expect(order.subtotal).toBe(2000);
    expect(order.shipping).toBe(0);
    expect(order.tax).toBe(100);
    expect(order.total).toBe(2100);

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: fixture.variant.id } });
    expect(variant.stock).toBe(8);

    const logs = await prisma.stockLog.findMany({ where: { orderId: order.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ delta: -2, stockAfter: 8, source: "ORDER" });
  });

  it("rejects an order that asks for more than is in stock, without touching stock", async () => {
    await expect(
      createOrder({
        userId: fixture.user.id,
        lines: [{ variantId: fixture.variant.id, quantity: 999 }],
        shippingAddressId: fixture.address.id,
      }),
    ).rejects.toBeInstanceOf(OrderError);

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: fixture.variant.id } });
    expect(variant.stock).toBe(10);

    const orderCount = await prisma.order.count({ where: { userId: fixture.user.id } });
    expect(orderCount).toBe(0);
  });

  it("never lets concurrent orders oversell the last unit", async () => {
    await prisma.productVariant.update({ where: { id: fixture.variant.id }, data: { stock: 1 } });

    const attempt = () =>
      createOrder({
        userId: fixture.user.id,
        lines: [{ variantId: fixture.variant.id, quantity: 1 }],
        shippingAddressId: fixture.address.id,
      });

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: fixture.variant.id } });
    expect(variant.stock).toBe(0);

    const logs = await prisma.stockLog.findMany({ where: { variantId: fixture.variant.id } });
    expect(logs).toHaveLength(1);
  });
});

describe("order status transitions (COM-P2-01 / restock regression)", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await createOrderFixture({ stock: 10 });
  });

  afterEach(async () => {
    await cleanupOrderFixture(fixture);
  });

  it("restocks and refunds a paid order on cancellation", async () => {
    const { order: created } = await createOrder({
      userId: fixture.user.id,
      lines: [{ variantId: fixture.variant.id, quantity: 3 }],
      shippingAddressId: fixture.address.id,
    });

    await confirmPayment({ orderNumber: created.orderNumber, userId: fixture.user.id });

    const afterCreate = await prisma.productVariant.findUniqueOrThrow({ where: { id: fixture.variant.id } });
    expect(afterCreate.stock).toBe(7);

    const cancelled = await updateOrderStatus({
      orderId: created.id,
      status: "CANCELLED",
      adminId: fixture.admin.id,
    });

    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.paymentStatus).toBe("REFUNDED");

    const afterCancel = await prisma.productVariant.findUniqueOrThrow({ where: { id: fixture.variant.id } });
    expect(afterCancel.stock).toBe(10);

    const cancellationLog = await prisma.stockLog.findFirst({
      where: { orderId: created.id, source: "CANCELLATION" },
    });
    expect(cancellationLog).toMatchObject({ delta: 3, stockAfter: 10 });
  });

  it("rejects a status update that skips steps in ORDER_FLOW", async () => {
    const { order: created } = await createOrder({
      userId: fixture.user.id,
      lines: [{ variantId: fixture.variant.id, quantity: 1 }],
      shippingAddressId: fixture.address.id,
    });

    await expect(
      updateOrderStatus({ orderId: created.id, status: "DELIVERED", adminId: fixture.admin.id }),
    ).rejects.toBeInstanceOf(OrderError);

    const unchanged = await prisma.order.findUniqueOrThrow({ where: { id: created.id } });
    expect(unchanged.status).toBe("PLACED");

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: fixture.variant.id } });
    expect(variant.stock).toBe(9); // only the original order decrement, no restock from the rejected update
  });

  it("rejects moving an order backward", async () => {
    const { order: created } = await createOrder({
      userId: fixture.user.id,
      lines: [{ variantId: fixture.variant.id, quantity: 1 }],
      shippingAddressId: fixture.address.id,
    });

    await updateOrderStatus({ orderId: created.id, status: "CONFIRMED", adminId: fixture.admin.id });

    await expect(
      updateOrderStatus({ orderId: created.id, status: "PLACED", adminId: fixture.admin.id }),
    ).rejects.toBeInstanceOf(OrderError);
  });

  it("rejects further moves once an order is cancelled", async () => {
    const { order: created } = await createOrder({
      userId: fixture.user.id,
      lines: [{ variantId: fixture.variant.id, quantity: 1 }],
      shippingAddressId: fixture.address.id,
    });

    await updateOrderStatus({ orderId: created.id, status: "CANCELLED", adminId: fixture.admin.id });

    await expect(
      updateOrderStatus({ orderId: created.id, status: "CONFIRMED", adminId: fixture.admin.id }),
    ).rejects.toBeInstanceOf(OrderError);
  });
});
