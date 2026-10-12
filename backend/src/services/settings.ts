import { prisma } from "@/db";
import type { StockState } from "@/types/catalog";

export const SETTINGS_DEFAULTS = {
  shippingCharge: 79,
  freeShippingThreshold: 1499,
  taxRatePercent: 5,
  lowStockThreshold: 5,
  announcementMessages: ["Free shipping on orders above ₹1499"],
  storeEmail: "hello@theblankhangar.com",
  storePhone: "+91 90000 00000",
};

/** Reads the singleton settings row, creating it with defaults on first access. */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({
    where: { singleton: "SETTINGS" },
  });
  if (existing) return existing;

  return prisma.settings.create({
    data: { singleton: "SETTINGS", ...SETTINGS_DEFAULTS, heroBanners: [] },
  });
}

/** Stock state is derived, never stored — changing the threshold reclassifies every variant. */
export function stockState(stock: number, lowStockThreshold: number): StockState {
  if (stock <= 0) return "OUT_OF_STOCK";
  if (stock <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}
