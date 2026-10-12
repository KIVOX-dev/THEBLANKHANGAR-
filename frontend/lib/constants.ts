import type { OrderStatus } from "@/types/enums";

export const BRAND = {
  name: "THE BLANK HANGAR",
  shortName: "BLANK HANGAR",
  tagline: "Essentials, unbranded by noise.",
  email: "hello@theblankhangar.com",
} as const;

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export const FITS = ["Oversized", "Regular Fit", "Boxy", "Slim Fit"] as const;

export const PRODUCT_TYPES = [
  "Plain",
  "Printed",
  "Graphic",
  "Polo",
  "Full Sleeve",
] as const;

export const PRICE_BUCKETS = [
  { label: "Under ₹799", min: 0, max: 799 },
  { label: "₹799 – ₹1199", min: 799, max: 1199 },
  { label: "₹1199 – ₹1599", min: 1199, max: 1599 },
  { label: "Above ₹1599", min: 1599, max: 100000 },
] as const;

export const COLORS = [
  { name: "Black", hex: "#111111" },
  { name: "Off White", hex: "#F5F3EF" },
  { name: "Olive", hex: "#6B6B47" },
  { name: "Rust", hex: "#B4552B" },
  { name: "Charcoal", hex: "#3A3A3A" },
  { name: "Sand", hex: "#C9BCA4" },
  { name: "Navy", hex: "#26334D" },
] as const;

export const ORDER_FLOW: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const TERMINAL_STATUSES: OrderStatus[] = [
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const ORDER_STATUS_COPY: Record<OrderStatus, string> = {
  PLACED: "We have received your order.",
  CONFIRMED: "Your order is confirmed and being prepared.",
  PACKED: "Your order has been packed and is ready to dispatch.",
  SHIPPED: "Your order has left our warehouse.",
  OUT_FOR_DELIVERY: "Your order is out for delivery today.",
  DELIVERED: "Your order has been delivered.",
  CANCELLED: "This order was cancelled.",
  RETURNED: "This order was returned.",
};

// 25s strikes a balance between "stock updates show up without a refresh" and not
// hammering the API — usePolling already pauses while the tab is hidden and stops
// entirely on unmount, so this is the only knob actually worth tuning here.
export const POLL_INTERVAL_MS = 25000;
