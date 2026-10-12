import { z } from "zod";

/** Shared by every admin list endpoint so bad input 422s instead of silently becoming NaN/Invalid Date. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const adminProductQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["DRAFT", "LIVE", "ARCHIVED"]).optional(),
  category: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
});

export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>;

export const adminCustomerQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
});

export type AdminCustomerQuery = z.infer<typeof adminCustomerQuerySchema>;

export const adminOrderQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).optional().default(1),
    status: z
      .enum([
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ])
      .optional(),
    q: z.string().trim().max(120).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "The start date must be before the end date.",
    path: ["from"],
  });

export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
