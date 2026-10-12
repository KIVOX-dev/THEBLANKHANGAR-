import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db";
import { requireStaff } from "@/middleware/auth";
import { asyncRoute, notFound } from "@/middleware/errorHandler";
import { adminOrderQuerySchema } from "@/validation/adminQuery";
import { updateOrderStatus } from "@/services/orders";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireStaff);

const PAGE_SIZE = 25;

adminOrdersRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const sp = adminOrderQuerySchema.parse(req.query);
    const page = sp.page ?? 1;

    const where: Prisma.OrderWhereInput = {};

    if (sp.status) {
      where.status = sp.status;
    }

    if (sp.q) {
      where.OR = [
        { orderNumber: { contains: sp.q, mode: "insensitive" } },
        { user: { name: { contains: sp.q, mode: "insensitive" } } },
        { user: { email: { contains: sp.q, mode: "insensitive" } } },
      ];
    }

    if (sp.from || sp.to) {
      where.createdAt = {
        ...(sp.from && { gte: new Date(sp.from) }),
        ...(sp.to && { lte: new Date(`${sp.to}T23:59:59`) }),
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { id: true, quantity: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
  }),
);

adminOrdersRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        shippingAddress: true,
        items: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { changedByAdmin: { select: { name: true } } },
        },
      },
    });

    if (!order) throw notFound("Order");
    res.json({ order });
  }),
);

const statusSchema = z
  .object({
    status: z.enum([
      "PLACED",
      "CONFIRMED",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ]),
    note: z.string().trim().max(200).optional(),
    courierName: z.string().trim().max(60).optional(),
    trackingNumber: z.string().trim().max(60).optional(),
  })
  .refine((v) => v.status !== "SHIPPED" || (!!v.courierName && !!v.trackingNumber), {
    message: "Courier name and tracking number are required to mark an order shipped.",
    path: ["trackingNumber"],
  });

adminOrdersRouter.patch(
  "/:id/status",
  asyncRoute(async (req, res) => {
    const staff = req.user!;
    const input = statusSchema.parse(req.body);

    const order = await updateOrderStatus({
      orderId: String(req.params.id),
      status: input.status,
      note: input.note,
      adminId: staff.id,
      courierName: input.courierName,
      trackingNumber: input.trackingNumber,
    });

    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
      },
    });
  }),
);
