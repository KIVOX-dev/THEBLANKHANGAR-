export type PricingInput = {
  subtotal: number;
  discount?: number;
  shippingCharge: number;
  freeShippingThreshold: number;
  taxRatePercent: number;
};

export type PricingBreakdown = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

/**
 * Order maths shared byte-for-byte between backend/src/pricing.ts (authoritative for
 * charged totals) and frontend/lib/pricing.ts (display only) — scripts/check-pricing-drift.mjs
 * fails CI if the two ever diverge, so keep them in sync when editing either.
 */
export function computeTotals({
  subtotal,
  discount = 0,
  shippingCharge,
  freeShippingThreshold,
  taxRatePercent,
}: PricingInput): PricingBreakdown {
  const cappedDiscount = Math.min(Math.max(discount, 0), subtotal);
  const taxable = subtotal - cappedDiscount;
  const shipping = taxable >= freeShippingThreshold || taxable <= 0 ? 0 : shippingCharge;
  const tax = Math.round((taxable * taxRatePercent) / 100);

  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(cappedDiscount),
    shipping: Math.round(shipping),
    tax,
    total: Math.round(taxable + shipping + tax),
  };
}

export function computeCouponDiscount(
  coupon: { discountType: "PERCENT" | "FIXED"; discountValue: number; maxDiscount: number | null },
  subtotal: number,
) {
  if (coupon.discountType === "FIXED") return Math.min(coupon.discountValue, subtotal);

  const raw = (subtotal * coupon.discountValue) / 100;
  return Math.min(coupon.maxDiscount ?? raw, raw, subtotal);
}
