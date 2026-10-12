"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cartSubtotal, useCart } from "@/store/cart";
import { computeTotals } from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";
import { AddressForm, type SavedAddress } from "@/components/checkout/AddressForm";
import { CouponField, type AppliedCoupon } from "@/components/cart/CouponField";
import { IconCheck, IconSpinner } from "@/components/ui/Icons";

type Step = "address" | "payment" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "Delivery" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
];

export function CheckoutFlow({
  addresses: initialAddresses,
  shippingCharge,
  freeShippingThreshold,
  taxRatePercent,
  paymentProvider,
}: {
  addresses: SavedAddress[];
  shippingCharge: number;
  freeShippingThreshold: number;
  taxRatePercent: number;
  paymentProvider: string;
}) {
  const router = useRouter();
  const { lines, clear } = useCart();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    initialAddresses.find((a) => a.isDefault)?.id ?? initialAddresses[0]?.id ?? "",
  );
  const [showAddressForm, setShowAddressForm] = useState(initialAddresses.length === 0);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="mt-10 h-96 animate-pulse bg-bone-deep" />;

  if (lines.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-4 border border-dashed border-line py-20 text-center">
        <p className="text-lg">Your bag is empty</p>
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

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  async function placeOrder() {
    setPlacing(true);
    setError(null);
    setIssues([]);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          shippingAddressId: selectedAddressId,
          couponCode: coupon?.code,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not place your order.");
        if (Array.isArray(data.issues)) {
          setIssues(data.issues.map((i: { message: string }) => i.message));
        }
        return;
      }

      // Mock provider settles instantly; a real provider's UI would run here first.
      const payRes = await fetch(`/api/orders/${data.orderNumber}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: data.payment.reference }),
      });

      if (!payRes.ok) {
        const payData = await payRes.json();
        setError(payData.error ?? "Payment could not be completed.");
        return;
      }

      clear();
      router.push(`/checkout/confirmation/${data.orderNumber}`);
    } catch {
      setError("Could not place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
      <div>
        {/* Stepper */}
        <ol className="mb-8 flex items-center gap-3">
          {STEPS.map((s, i) => {
            const currentIndex = STEPS.findIndex((x) => x.key === step);
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-3">
                <button
                  onClick={() => i <= currentIndex && setStep(s.key)}
                  disabled={i > currentIndex}
                  className="flex items-center gap-2.5 disabled:cursor-not-allowed"
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold",
                      done && "border-olive bg-olive text-bone",
                      active && "border-ink bg-ink text-bone",
                      !done && !active && "border-line text-ink-muted",
                    )}
                  >
                    {done ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn("eyebrow", !active && !done && "text-ink-muted")}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
              </li>
            );
          })}
        </ol>

        {step === "address" && (
          <section>
            <h2 className="text-xl">Delivery Address</h2>

            {addresses.length > 0 && !showAddressForm && (
              <div className="mt-5 space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={cn(
                      "flex cursor-pointer gap-3 border p-4 transition-colors",
                      selectedAddressId === address.id
                        ? "border-ink bg-white"
                        : "border-line bg-white/60 hover:border-ink-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1 h-4 w-4 accent-ink"
                    />
                    <div className="text-sm">
                      <p className="font-medium">
                        {address.fullName}
                        {address.isDefault && (
                          <span className="ml-2 bg-bone-deep px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ink-muted">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-ink-soft">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                      </p>
                      <p className="text-ink-soft">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="mt-1 text-ink-muted">{address.phone}</p>
                    </div>
                  </label>
                ))}

                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-sm underline underline-offset-4 hover:text-olive"
                >
                  + Add a new address
                </button>
              </div>
            )}

            {showAddressForm && (
              <div className="mt-5 border border-line bg-white p-5">
                <h3 className="mb-4 text-base">New Address</h3>
                <AddressForm
                  onSaved={(address) => {
                    setAddresses((prev) => [
                      address,
                      ...prev.map((a) => (address.isDefault ? { ...a, isDefault: false } : a)),
                    ]);
                    setSelectedAddressId(address.id);
                    setShowAddressForm(false);
                  }}
                  onCancel={addresses.length > 0 ? () => setShowAddressForm(false) : undefined}
                />
              </div>
            )}

            <button
              onClick={() => setStep("payment")}
              disabled={!selectedAddressId || showAddressForm}
              className="btn btn-primary mt-6"
            >
              Continue to Payment
            </button>
          </section>
        )}

        {step === "payment" && (
          <section>
            <h2 className="text-xl">Payment</h2>

            <div className="mt-5 border border-line bg-white p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="radio" checked readOnly className="mt-1 h-4 w-4 accent-ink" />
                <div className="text-sm">
                  <p className="font-medium">
                    {paymentProvider === "RAZORPAY" ? "Razorpay" : "Test Payment (Mock)"}
                  </p>
                  <p className="mt-1 text-ink-muted">
                    {paymentProvider === "RAZORPAY"
                      ? "UPI, cards, net banking and wallets via Razorpay."
                      : "No live payment keys are configured, so this order settles instantly in test mode. Add Razorpay keys to .env to switch on real payments — no code changes needed."}
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep("address")} className="btn btn-outline">
                Back
              </button>
              <button onClick={() => setStep("review")} className="btn btn-primary">
                Review Order
              </button>
            </div>
          </section>
        )}

        {step === "review" && (
          <section>
            <h2 className="text-xl">Review Your Order</h2>

            {selectedAddress && (
              <div className="mt-5 border border-line bg-white p-5 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="eyebrow">Delivering to</p>
                  <button
                    onClick={() => setStep("address")}
                    className="text-xs underline underline-offset-4 hover:text-olive"
                  >
                    Change
                  </button>
                </div>
                <p className="font-medium">{selectedAddress.fullName}</p>
                <p className="mt-1 text-ink-soft">
                  {selectedAddress.line1}
                  {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""},{" "}
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                </p>
                <p className="mt-1 text-ink-muted">{selectedAddress.phone}</p>
              </div>
            )}

            <ul className="mt-5 border-t border-line">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 border-b border-line py-4">
                  <div className="relative h-24 w-19 shrink-0 overflow-hidden bg-bone-deep" style={{ width: 76 }}>
                    {line.image && (
                      <Image src={line.image} alt={line.title} fill sizes="76px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{line.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Size {line.size}
                      {line.color ? ` · ${line.color}` : ""} · Qty {line.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(line.price * line.quantity)}</p>
                </li>
              ))}
            </ul>

            {error && (
              <div role="alert" className="mt-5 border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">
                <p>{error}</p>
                {issues.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
                {issues.length > 0 && (
                  <Link href="/cart" className="mt-3 inline-block underline underline-offset-4">
                    Update your bag
                  </Link>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep("payment")} className="btn btn-outline">
                Back
              </button>
              <button onClick={placeOrder} disabled={placing} className="btn btn-primary flex-1">
                {placing ? (
                  <>
                    <IconSpinner className="h-4 w-4" />
                    Placing order
                  </>
                ) : (
                  `Place Order · ${formatPrice(totals.total)}`
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="border border-line bg-white p-6">
          <h2 className="text-lg">Order Summary</h2>

          <ul className="mt-4 space-y-3 border-b border-line pb-4">
            {lines.map((line) => (
              <li key={line.variantId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-ink-soft">
                  <span className="block truncate">{line.title}</span>
                  <span className="text-xs text-ink-muted">
                    {line.size} × {line.quantity}
                  </span>
                </span>
                <span className="shrink-0">{formatPrice(line.price * line.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <CouponField subtotal={subtotal} applied={coupon} onChange={setCoupon} />
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
            {totals.discount > 0 && (
              <Row label="Discount" value={`− ${formatPrice(totals.discount)}`} tone="olive" />
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
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "olive" }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={tone === "olive" ? "text-olive-deep" : undefined}>{value}</dd>
    </div>
  );
}
