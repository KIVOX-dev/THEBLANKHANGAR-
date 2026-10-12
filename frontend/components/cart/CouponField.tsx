"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

export type AppliedCoupon = {
  code: string;
  discount: number;
  description: string | null;
};

export function CouponField({
  subtotal,
  applied,
  onChange,
}: {
  subtotal: number;
  applied: AppliedCoupon | null;
  onChange: (coupon: AppliedCoupon | null) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "That code isn't valid.");
        return;
      }

      onChange(data.coupon);
      setCode("");
    } catch {
      setError("Could not check that code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 border border-olive/40 bg-olive/10 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">{applied.code} applied</p>
          <p className="text-xs text-ink-muted">− {formatPrice(applied.discount)}</p>
        </div>
        <button
          onClick={() => {
            onChange(null);
            setError(null);
          }}
          className="shrink-0 text-[11px] uppercase tracking-widest text-ink-muted hover:text-rust"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply}>
      <label htmlFor="coupon" className="label">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="BLANK10"
          className="field"
        />
        <button type="submit" disabled={loading || !code.trim()} className="btn btn-outline px-5">
          {loading ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rust">{error}</p>}
    </form>
  );
}
