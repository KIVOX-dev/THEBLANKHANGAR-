import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/db";
import { getSettings } from "@/services/settings";
import { validateCoupon } from "@/services/coupons";
import { getPaymentProvider } from "@/modules/payments/provider";
import { computeTotals } from "@/pricing";
import { generateOrderNumber } from "@/utils";

const TERMINAL_STATUSES: OrderStatus[] = ["DELIVERED", "CANCELLED", "RETURNED"];

/** Sequential happy-path — an order must move through these one step at a time. */
const ORDER_FLOW: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/**
 * Authoritative transition guard — the frontend's own ORDER_FLOW check is a UX nicety,
 * not enforcement. Allows: re-submitting the same status (e.g. to edit a note/tracking
 * number without moving the order), the next sequential step in ORDER_FLOW, cancelling
 * any order that hasn't shipped yet, and returning an order that has been delivered.
 * Anything else (backward moves, skipping steps, moving off a terminal status) is rejected.
 */
export function assertValidTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return;

  if (TERMINAL_STATUSES.includes(current)) {
    throw new OrderError(
      `This order is already ${current.toLowerCase()} and can't be moved again.`,
      409,
    );
  }

  // Cancellation is a pre-delivery escape hatch available from any in-flight status —
  // existing behaviour, preserved as-is.
  if (next === "CANCELLED") return;

  if (next === "RETURNED") {
    if (current !== "DELIVERED") {
      throw new OrderError("Only a delivered order can be marked returned.", 409);
    }
    return;
  }

  const currentIndex = ORDER_FLOW.indexOf(current);
  const nextIndex = ORDER_FLOW.indexOf(next);
  if (nextIndex !== currentIndex + 1) {
    throw new OrderError(
      `Cannot move an order from ${current} to ${next} — orders must progress one step at a time.`,
      409,
    );
  }
}

export type CartLineInput = { variantId: string; quantity: number };

export class OrderError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

/**
 * Re-prices the client cart from the database. The client is never trusted for
 * price or availability — only for which variant and how many.
 */
export async function priceCart(lines: CartLineInput[], couponCode?: string) {
  if (lines.length === 0) throw new OrderError("Your bag is empty.");

  const settings = await getSettings();
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    include: { product: true },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));
  const priced = [];
  const issues: { variantId: string; message: string }[] = [];

  for (const line of lines) {
    const variant = byId.get(line.variantId);

    if (!variant || variant.product.status !== "LIVE") {
      issues.push({ variantId: line.variantId, message: "This item is no longer available." });
      continue;
    }

    if (variant.stock <= 0) {
      issues.push({
        variantId: line.variantId,
        message: `${variant.product.title} (${variant.size}) is out of stock.`,
      });
      continue;
    }

    if (variant.stock < line.quantity) {
      issues.push({
        variantId: line.variantId,
        message: `Only ${variant.stock} left of ${variant.product.title} (${variant.size}).`,
      });
      continue;
    }

    const price = variant.priceOverride ?? variant.product.basePrice;
    priced.push({
      variantId: variant.id,
      quantity: line.quantity,
      price,
      lineTotal: price * line.quantity,
      product: variant.product,
      variant,
    });
  }

  if (issues.length > 0) {
    throw new OrderError("Some items in your bag need attention.", 409, { issues });
  }

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);

  let discount = 0;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    if (result.ok) {
      discount = result.discount;
      appliedCoupon = result.code;
    }
  }

  const totals = computeTotals({
    subtotal,
    discount,
    shippingCharge: settings.shippingCharge,
    freeShippingThreshold: settings.freeShippingThreshold,
    taxRatePercent: settings.taxRatePercent,
  });

  return { lines: priced, totals, appliedCoupon };
}

/**
 * Creates the order, decrements stock and writes the opening status-history and
 * stock-log entries in one transaction, so a failure can't leave stock deducted
 * without an order (or vice versa).
 */
export async function createOrder(input: {
  userId: string;
  lines: CartLineInput[];
  shippingAddressId: string;
  couponCode?: string;
}) {
  const { lines: priced, totals, appliedCoupon } = await priceCart(input.lines, input.couponCode);

  const address = await prisma.address.findFirst({
    where: { id: input.shippingAddressId, userId: input.userId },
  });
  if (!address) throw new OrderError("Select a valid delivery address.", 400);

  const orderNumber = generateOrderNumber();
  const provider = getPaymentProvider();
  const intent = await provider.createIntent({ orderNumber, amount: totals.total });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: "PLACED",
        paymentStatus: "PENDING",
        paymentMethod: intent.provider,
        paymentReference: intent.reference,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        couponCode: appliedCoupon,
        shippingAddressId: address.id,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        items: {
          create: priced.map((line) => ({
            productVariantId: line.variantId,
            quantity: line.quantity,
            priceAtPurchase: line.price,
            productTitle: line.product.title,
            variantSize: line.variant.size,
            variantColor: line.variant.color,
            productImage: line.product.images[0] ?? null,
            productSlug: line.product.slug,
          })),
        },
        statusHistory: {
          create: { status: "PLACED", note: "Order received." },
        },
      },
    });

    // MongoDB transactions serialize every operation on one session, so the guarded
    // decrement + read-back for each line can't be parallelized — but the resulting
    // stock-log writes are independent of each other and are batched into a single
    // createMany below instead of one round trip per line.
    const stockLogEntries: Prisma.StockLogCreateManyInput[] = [];

    for (const line of priced) {
      // Guarded decrement: if someone else took the last unit between pricing and
      // now, this update matches zero rows and the transaction is rolled back.
      const result = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });

      if (result.count === 0) {
        throw new OrderError(
          `${line.product.title} (${line.variant.size}) just sold out.`,
          409,
        );
      }

      const after = await tx.productVariant.findUnique({
        where: { id: line.variantId },
        select: { stock: true },
      });

      stockLogEntries.push({
        variantId: line.variantId,
        delta: -line.quantity,
        stockAfter: after?.stock ?? 0,
        reason: `Order ${orderNumber}`,
        source: "ORDER",
        orderId: created.id,
      });
    }

    await tx.stockLog.createMany({ data: stockLogEntries });

    if (appliedCoupon) {
      await tx.coupon.update({
        where: { code: appliedCoupon },
        data: { usageCount: { increment: 1 } },
      });
    }

    return created;
  });

  return { order, intent };
}

/** Marks an order paid after the provider confirms. Mock provider confirms instantly. */
export async function confirmPayment(input: {
  orderNumber: string;
  userId: string;
  reference?: string;
  signature?: string;
}) {
  const order = await prisma.order.findFirst({
    where: { orderNumber: input.orderNumber, userId: input.userId },
  });
  if (!order) throw new OrderError("Order not found.", 404);
  if (order.paymentStatus === "PAID") return order;

  const provider = getPaymentProvider();
  const verification = await provider.verify({
    orderNumber: order.orderNumber,
    reference: input.reference ?? order.paymentReference ?? "",
    signature: input.signature,
  });

  if (!verification.paid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    throw new OrderError("Payment could not be verified.", 402);
  }

  return prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      paymentReference: verification.reference,
      status: "CONFIRMED",
      statusHistory: {
        create: { status: "CONFIRMED", note: "Payment confirmed." },
      },
    },
  });
}

const ORDER_DETAIL_INCLUDE = {
  items: true,
  shippingAddress: true,
  statusHistory: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

export async function getOrderForUser(orderNumber: string, userId: string) {
  return prisma.order.findFirst({
    where: { orderNumber, userId },
    include: ORDER_DETAIL_INCLUDE,
  });
}

export async function listOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

/**
 * Admin status transition. Writes an OrderStatusHistory row, which is what the
 * customer tracking timeline reads — that's the link that makes admin changes
 * show up for the customer with no extra sync step.
 */
export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
  note?: string;
  adminId: string;
  courierName?: string;
  trackingNumber?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  });
  if (!order) throw new OrderError("Order not found.", 404);

  assertValidTransition(order.status, input.status);

  // Restock only on an actual transition into CANCELLED/RETURNED — re-submitting the
  // same terminal status (e.g. to add a note) must not restock a second time.
  const restocking =
    order.status !== input.status && (input.status === "CANCELLED" || input.status === "RETURNED");

  return prisma.$transaction(async (tx) => {
    if (restocking) {
      // Single-document update() returns the updated record directly, so no follow-up
      // read is needed for stockAfter; the resulting stock-log writes are batched into
      // one createMany rather than one round trip per item.
      const stockLogEntries: Prisma.StockLogCreateManyInput[] = [];

      for (const item of order.items) {
        const updated = await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });

        stockLogEntries.push({
          variantId: item.productVariantId,
          delta: item.quantity,
          stockAfter: updated.stock,
          reason: `Order ${order.orderNumber} ${input.status.toLowerCase()}`,
          source: input.status === "CANCELLED" ? "CANCELLATION" : "RETURN",
          adminId: input.adminId,
          orderId: order.id,
        });
      }

      await tx.stockLog.createMany({ data: stockLogEntries });
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        ...(input.courierName !== undefined && { courierName: input.courierName }),
        ...(input.trackingNumber !== undefined && { trackingNumber: input.trackingNumber }),
        ...(restocking && order.paymentStatus === "PAID" && { paymentStatus: "REFUNDED" }),
        statusHistory: {
          create: {
            status: input.status,
            note: input.note ?? null,
            changedByAdminId: input.adminId,
          },
        },
      },
      include: ORDER_DETAIL_INCLUDE,
    });
  });
}
