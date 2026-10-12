"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { cartSubtotal, useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { IconClose } from "@/components/ui/Icons";
import { useDialog } from "@/hooks/useDialog";

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const { lines, isOpen, closeCart, setQuantity, removeLine } = useCart();
  const subtotal = cartSubtotal(lines);
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const panelRef = useDialog<HTMLElement>(isOpen, closeCart);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60">
      <button className="absolute inset-0 bg-ink/40 bh-fade" onClick={closeCart} aria-label="Close cart" />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bone bh-slide-in-right"
        aria-label="Shopping bag"
      >
        <header className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="text-lg">Your Bag ({lines.reduce((s, l) => s + l.quantity, 0)})</h2>
          <button onClick={closeCart} aria-label="Close cart" className="p-2 -mr-2">
            <IconClose />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-ink-muted text-sm">Your bag is empty.</p>
            <Link href="/collections/t-shirts" onClick={closeCart} className="btn btn-primary">
              Shop T-Shirts
            </Link>
          </div>
        ) : (
          <>
            {remaining > 0 && (
              <p className="border-b border-line bg-bone-deep px-5 py-3 text-xs">
                Add <strong>{formatPrice(remaining)}</strong> more for free shipping.
              </p>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {lines.map((line) => (
                <div key={line.variantId} className="flex gap-4">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    className="relative h-28 w-22 shrink-0 overflow-hidden bg-bone-deep"
                  >
                    {line.image && (
                      <Image src={line.image} alt={line.title} fill sizes="88px" className="object-cover" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={closeCart}
                      className="block text-sm font-medium leading-snug hover:underline underline-offset-4"
                    >
                      {line.title}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted">
                      {line.size}
                      {line.color ? ` · ${line.color}` : ""}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center border border-line bg-white">
                        <button
                          className="px-2.5 py-1 text-sm disabled:opacity-40"
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                          aria-label={`Decrease quantity of ${line.title}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                          className="px-2.5 py-1 text-sm disabled:opacity-40"
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                          disabled={line.quantity >= line.maxStock}
                          aria-label={`Increase quantity of ${line.title}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(line.price * line.quantity)}</span>
                    </div>

                    <button
                      onClick={() => removeLine(line.variantId)}
                      className="mt-2 text-[11px] uppercase tracking-widest text-ink-muted hover:text-rust"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-line px-5 py-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="eyebrow">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Taxes and shipping calculated at checkout.
              </p>
              <div className="grid gap-2">
                <Link href="/checkout" onClick={closeCart} className="btn btn-primary w-full">
                  Checkout
                </Link>
                <Link href="/cart" onClick={closeCart} className="btn btn-outline w-full">
                  View Bag
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
