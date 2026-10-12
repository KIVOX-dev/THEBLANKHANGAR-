"use client";

import { useState } from "react";
import { IconTruck } from "@/components/ui/Icons";

type Result = { ok: boolean; message: string };

/**
 * Stub delivery estimator — validates the pincode format and returns an indicative
 * window. Swap the body for a courier serviceability API when one is available.
 */
export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    const value = pincode.trim();

    if (!/^\d{6}$/.test(value)) {
      setResult({ ok: false, message: "Enter a valid 6-digit pincode." });
      return;
    }

    const days = 2 + (Number(value[0]) % 4);
    const eta = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setResult({
      ok: true,
      message: `Delivers by ${eta.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })} · Free shipping over ₹1499`,
    });
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="mb-3 flex items-center gap-2">
        <IconTruck className="h-5 w-5 text-ink-muted" />
        <p className="eyebrow">Check Delivery</p>
      </div>

      <form onSubmit={check} className="flex gap-2">
        <label htmlFor="pincode" className="sr-only">
          Delivery pincode
        </label>
        <input
          id="pincode"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            setResult(null);
          }}
          placeholder="Enter pincode"
          className="field max-w-45"
        />
        <button type="submit" className="btn btn-outline px-5">
          Check
        </button>
      </form>

      {result && (
        <p className={`mt-2.5 text-xs ${result.ok ? "text-olive-deep" : "text-rust"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
