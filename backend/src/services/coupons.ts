import { prisma } from "@/db";
import { computeCouponDiscount } from "@/pricing";

export type CouponResult =
  | { ok: true; code: string; discount: number; description: string | null }
  | { ok: false; reason: string };

/** Validates a coupon against the live subtotal. Used by both the cart UI and order creation. */
export async function validateCoupon(rawCode: string, subtotal: number): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive) {
    return { ok: false, reason: "That code isn't valid." };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, reason: "That code has expired." };
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, reason: "That code has been fully redeemed." };
  }

  if (subtotal < coupon.minOrderValue) {
    return {
      ok: false,
      reason: `Add ₹${Math.ceil(coupon.minOrderValue - subtotal)} more to use this code.`,
    };
  }

  const discount = computeCouponDiscount(
    {
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
    },
    subtotal,
  );

  return {
    ok: true,
    code: coupon.code,
    discount: Math.round(discount),
    description: coupon.description,
  };
}
