"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn, discountPercent, formatPrice } from "@/lib/utils";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { usePolling } from "@/hooks/usePolling";
import { useCart } from "@/store/cart";
import { SizeGuideModal } from "@/components/product/SizeGuideModal";
import { PincodeChecker } from "@/components/product/PincodeChecker";
import { WishlistButton } from "@/components/product/WishlistButton";
import type { ProductDetailData, StockState } from "@/types/catalog";

type AvailabilityPayload = {
  variants: { id: string; stock: number; state: StockState }[];
};

const STATE_LABEL: Record<StockState, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Only a few left",
  OUT_OF_STOCK: "Out of stock",
};

export function BuyBox({ product }: { product: ProductDetailData }) {
  const router = useRouter();
  const addLine = useCart((s) => s.addLine);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Live stock — an admin edit flips a size to sold out without a reload.
  const { data: live } = usePolling<AvailabilityPayload>(
    `/api/products/${product.slug}/availability`,
    POLL_INTERVAL_MS,
  );

  const variants = useMemo(() => {
    if (!live) return product.variants;
    const byId = new Map(live.variants.map((v) => [v.id, v]));
    return product.variants.map((v) => {
      const fresh = byId.get(v.id);
      return fresh ? { ...v, stock: fresh.stock, state: fresh.state } : v;
    });
  }, [product.variants, live]);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const allSoldOut = variants.every((v) => v.state === "OUT_OF_STOCK");
  const price = selected?.price ?? product.basePrice;
  const off = discountPercent(product.mrp, price);

  // A selected size that an admin just zeroed out must stop being purchasable.
  const selectionUnavailable = selected?.state === "OUT_OF_STOCK";

  function buildLine(variant: NonNullable<typeof selected>) {
    return {
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      size: variant.size,
      color: variant.color,
      image: product.images[0] ?? null,
      price: variant.price,
      mrp: product.mrp,
      maxStock: variant.stock,
    };
  }

  function addToCart() {
    if (!selected || selected.state === "OUT_OF_STOCK") {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addLine(buildLine(selected));
  }

  function buyNow() {
    if (!selected || selected.state === "OUT_OF_STOCK") {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addLine(buildLine(selected));
    router.push("/checkout");
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-muted">
        <a href="/" className="hover:text-ink">Home</a>
        <span className="mx-2">/</span>
        <a href={`/collections/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </a>
      </nav>

      <h1 className="text-2xl leading-tight lg:text-4xl">{product.title}</h1>

      {(product.fit || product.type) && (
        <p className="mt-2 text-sm text-ink-muted">
          {[product.fit, product.type].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatPrice(price)}</span>
        {product.mrp > price && (
          <>
            <span className="text-base text-ink-muted line-through">
              {formatPrice(product.mrp)}
            </span>
            <span className="bg-olive px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-bone">
              {off}% Off
            </span>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-muted">Inclusive of all taxes</p>

      {/* Colour — the seed carries one colourway per product, but the UI supports more. */}
      {selected?.color && (
        <div className="mt-7">
          <p className="eyebrow mb-2.5">
            Colour: <span className="text-ink-muted">{selected.color}</span>
          </p>
          <span
            className="inline-block h-8 w-8 rounded-full border border-ink ring-2 ring-ink ring-offset-2"
            style={{ backgroundColor: selected.colorHex ?? "#ccc" }}
            title={selected.color}
          />
        </div>
      )}

      <div className="mt-7">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="eyebrow">
            Size
            {selected && <span className="ml-1.5 text-ink-muted">— {selected.size}</span>}
          </p>
          <button
            onClick={() => setGuideOpen(true)}
            className="text-xs underline underline-offset-4 hover:text-olive"
          >
            Size Guide
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {variants.map((variant) => {
            const soldOut = variant.state === "OUT_OF_STOCK";
            const active = variant.id === selectedId;
            return (
              <button
                key={variant.id}
                disabled={soldOut}
                onClick={() => {
                  setSelectedId(variant.id);
                  setSizeError(false);
                }}
                aria-pressed={active}
                aria-label={`Size ${variant.size}${soldOut ? " — out of stock" : ""}`}
                title={soldOut ? "Out of stock" : STATE_LABEL[variant.state]}
                className={cn(
                  "relative grid h-12 w-12 place-items-center border text-sm font-medium transition-colors",
                  soldOut
                    ? "cursor-not-allowed border-line bg-bone-deep text-ink-muted"
                    : active
                      ? "border-ink bg-ink text-bone"
                      : "border-line bg-white hover:border-ink",
                )}
              >
                {variant.size}
                {soldOut && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid place-items-center"
                  >
                    <span className="h-px w-10 rotate-[-38deg] bg-ink-muted" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected && selected.state === "LOW_STOCK" && (
          <p className="mt-2.5 text-xs font-medium text-rust">
            Only {selected.stock} left in {selected.size}
          </p>
        )}
        {selectionUnavailable && (
          <p className="mt-2.5 text-xs font-medium text-rust">
            Size {selected?.size} just sold out. Pick another size.
          </p>
        )}
        {sizeError && !selected && (
          <p className="mt-2.5 text-xs font-medium text-rust">Please select a size.</p>
        )}
      </div>

      <div className="mt-7 flex gap-3">
        <button
          onClick={addToCart}
          disabled={allSoldOut || selectionUnavailable}
          className="btn btn-primary flex-1"
        >
          {allSoldOut ? "Sold Out" : "Add to Bag"}
        </button>
        <WishlistButton
          productId={product.id}
          className="h-auto w-13 border border-ink bg-transparent hover:bg-ink hover:text-bone"
        />
      </div>

      {!allSoldOut && (
        <button
          onClick={buyNow}
          disabled={selectionUnavailable}
          className="btn btn-outline mt-3 w-full"
        >
          Buy Now
        </button>
      )}

      <PincodeChecker />

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
