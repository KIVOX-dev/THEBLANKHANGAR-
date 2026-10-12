/** Mirrors the backend's Prisma enums — duplicated as plain string unions since this project
 * has no Prisma client of its own. */

export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type ProductStatus = "DRAFT" | "LIVE" | "ARCHIVED";
