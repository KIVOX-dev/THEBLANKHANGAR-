"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cartSubtotal, useCart } from "@/store/cart";
import { computeTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { CouponField, type AppliedCoupon } from "@/components/cart/CouponField";

export function CartView({
  shippingCharge,
  freeShippingThreshold,
  taxRatePercent,
}: {
  shippingCharge: number;
  freeShippingThreshold: number;
  taxRatePercent: number;
}) {
  const { lines, setQuantity, removeLine } = useCart();
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="mt-10 h-72 animate-pulse bg-bone-deep" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-4 border border-dashed border-line py-20 text-center">
        <p className="text-lg">Your bag is empty</p>
        <p className="max-w-sm text-sm text-ink-muted">
          Nothing in here yet. The heavyweight tees are a good place to start.
        </p>
        <Link href="/collections/t-shirts" className="btn btn-primary mt-2">
          Shop T-Shirts
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const totals = computeTotals({
    subtotal,
    discount: coupon?.discount ?? 0,
    shippingCharge,
    freeShippingThreshold,
    taxRatePercent,
  });

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
      <div>
        <ul className="border-t border-line">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4 border-b border-line py-5 sm:gap-6">
              <Link
                href={`/products/${line.slug}`}
                className="relative h-36 w-28 shrink-0 overflow-hidden bg-bone-deep"
              >
                {line.image && (
                  <Image src={line.image} alt={line.title} fill sizes="112px" className="object-cover" />
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${line.slug}`}
                      className="text-sm font-medium hover:underline underline-offset-4"
                    >
                      {line.title}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted">
                      Size {line.size}
                      {line.color ? ` · ${line.color}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatPrice(line.price * line.quantity)}</p>
                    {line.mrp > line.price && (
                      <p className="text-xs text-ink-muted line-through">
                        {formatPrice(line.mrp * line.quantity)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <div className="flex items-center border border-line bg-white">
                    <button
                      className="px-3 py-1.5 text-sm"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      aria-label={`Decrease quantity of ${line.title}`}
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm tabular-nums">{line.quantity}</span>
                    <button
                      className="px-3 py-1.5 text-sm disabled:opacity-40"
                      disabled={line.quantity >= line.maxStock}
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      aria-label={`Increase quantity of ${line.title}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeLine(line.variantId)}
                    className="text-[11px] uppercase tracking-widest text-ink-muted hover:text-rust"
                  >
                    Remove
                  </button>
                </div>

                {line.quantity >= line.maxStock && (
                  <p className="mt-2 text-xs text-rust">
                    Only {line.maxStock} available in this size.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/collections/t-shirts"
          className="mt-6 inline-block text-sm underline underline-offset-4 hover:text-olive"
        >
          ← Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="border border-line bg-white p-6">
          <h2 className="text-lg">Order Summary</h2>

          <div className="mt-5">
            <CouponField subtotal={subtotal} applied={coupon} onChange={setCoupon} />
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
            {totals.discount > 0 && (
              <Row
                label={`Discount${coupon ? ` (${coupon.code})` : ""}`}
                value={`− ${formatPrice(totals.discount)}`}
                tone="olive"
              />
            )}
            <Row
              label="Shipping"
              value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
            />
            <Row label={`Tax (${taxRatePercent}%)`} value={formatPrice(totals.tax)} />
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="eyebrow">Total</span>
            <span className="text-lg font-semibold">{formatPrice(totals.total)}</span>
          </div>

          {totals.shipping > 0 && (
            <p className="mt-3 text-xs text-ink-muted">
              Add {formatPrice(freeShippingThreshold - (subtotal - totals.discount))} more for free
              shipping.
            </p>
          )}

          <Link href="/checkout" className="btn btn-primary mt-5 w-full">
            Proceed to Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "olive";
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={tone === "olive" ? "text-olive-deep" : undefined}>{value}</dd>
    </div>
  );
}
