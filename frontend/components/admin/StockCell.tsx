"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StockState } from "@/types/catalog";

const TONE: Record<StockState, string> = {
  IN_STOCK: "border-line",
  LOW_STOCK: "border-rust/60 bg-rust/5",
  OUT_OF_STOCK: "border-ink bg-bone-deep",
};

/**
 * Inline stock editor. Saving hits the admin API, which writes a StockLog entry —
 * and because the storefront derives availability from this number, dropping it to
 * zero makes the size unselectable on the PDP within one poll.
 */
export function StockCell({
  variantId,
  size,
  sku,
  stock,
  state,
}: {
  variantId: string;
  size: string;
  sku: string;
  stock: number;
  state: StockState;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const dirty = value !== String(stock);

  async function save() {
    if (!dirty) return;
    setSaving(true);
    setError(false);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/variants/${variantId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Number(value), reason: "Manual stock edit" }),
      });

      if (!res.ok) {
        setError(true);
        setValue(String(stock));
        return;
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError(true);
      setValue(String(stock));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("w-24 border p-2.5 transition-colors", TONE[state])}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{size}</span>
        {state === "OUT_OF_STOCK" && (
          <span className="text-[9px] uppercase tracking-wider text-ink-muted">Out</span>
        )}
        {state === "LOW_STOCK" && (
          <span className="text-[9px] uppercase tracking-wider text-rust">Low</span>
        )}
      </div>

      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setValue(String(stock));
        }}
        disabled={saving}
        aria-label={`Stock for size ${size}, SKU ${sku}`}
        className={cn(
          "mt-1.5 w-full border bg-white px-2 py-1 text-sm tabular-nums outline-none transition-colors",
          error ? "border-rust" : saved ? "border-olive" : "border-line focus:border-ink",
        )}
      />

      <p className="mt-1 truncate text-[9px] text-ink-muted" title={sku}>
        {saving ? "Saving…" : saved ? "Saved" : error ? "Failed" : sku}
      </p>
    </div>
  );
}
