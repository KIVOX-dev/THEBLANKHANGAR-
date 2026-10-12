import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "@/middleware/auth";
import { asyncRoute, notFound } from "@/middleware/errorHandler";
import { rateLimit } from "@/middleware/rateLimit";
import { confirmPayment, createOrder, getOrderForUser, listOrdersForUser } from "@/services/orders";
import { validateCoupon } from "@/services/coupons";
import { HttpError } from "@/middleware/errorHandler";

export const ordersRouter = Router();
export const couponsRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const orders = await listOrdersForUser(req.user!.id);
    res.json({ orders });
  }),
);

const createSchema = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1, "Your bag is empty."),
  shippingAddressId: z.string().min(1, "Select a delivery address."),
  couponCode: z.string().trim().max(40).optional(),
});

ordersRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const input = createSchema.parse(req.body);
    const { order, intent } = await createOrder({ userId: req.user!.id, ...input });

    res.status(201).json({
      orderNumber: order.orderNumber,
      total: order.total,
      payment: {
        provider: intent.provider,
        reference: intent.reference,
        ...intent.clientPayload,
      },
    });
  }),
);

/**
 * Full order detail — items, address, pricing breakdown and status history — reused by the
 * confirmation page, account order detail page, and the polling tracking timeline (which only
 * reads a subset of these fields).
 */
ordersRouter.get(
  "/:orderNumber",
  asyncRoute(async (req, res) => {
    const order = await getOrderForUser(String(req.params.orderNumber), req.user!.id);
    if (!order) throw notFound("Order");
    res.set("Cache-Control", "no-store").json({ order });
  }),
);

const paySchema = z.object({
  reference: z.string().optional(),
  signature: z.string().optional(),
});

ordersRouter.post(
  "/:orderNumber/pay",
  rateLimit(10, 60_000),
  asyncRoute(async (req, res) => {
    const body = paySchema.parse(req.body ?? {});

    const order = await confirmPayment({
      orderNumber: String(req.params.orderNumber),
      userId: req.user!.id,
      reference: body.reference,
      signature: body.signature,
    });

    res.json({
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      status: order.status,
    });
  }),
);

const couponSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.coerce.number().min(0),
});

couponsRouter.post(
  "/validate",
  asyncRoute(async (req, res) => {
    const { code, subtotal } = couponSchema.parse(req.body);
    const result = await validateCoupon(code, subtotal);

    if (!result.ok) throw new HttpError(result.reason, 400);

    res.json({
      coupon: { code: result.code, discount: result.discount, description: result.description },
    });
  }),
);
