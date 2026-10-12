"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn, discountPercent, formatPrice } from "@/lib/utils";
import { WishlistButton } from "@/components/product/WishlistButton";
import type { ProductCardData } from "@/types/catalog";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const off = discountPercent(product.mrp, product.basePrice);
  const secondary = product.images[1];
  const shown = hovered && secondary ? secondary : product.images[0];

  return (
    <article
      className={cn("group relative", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-4/5 overflow-hidden bg-bone-deep">
        <Link href={`/products/${product.slug}`} aria-label={product.title}>
          {shown && (
            <Image
              src={shown}
              alt={product.title}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={cn(
                "object-cover transition-opacity duration-300",
                product.isSoldOut && "opacity-60",
              )}
            />
          )}
        </Link>

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isSoldOut ? (
            <Badge tone="ink">Sold Out</Badge>
          ) : product.isLowStock ? (
            <Badge tone="rust">Low Stock</Badge>
          ) : null}
          {!product.isSoldOut && off > 0 && <Badge tone="olive">{off}% Off</Badge>}
        </div>

        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} />
        </div>

        {!product.isSoldOut && (
          <Link
            href={`/products/${product.slug}`}
            className="absolute inset-x-0 bottom-0 translate-y-full bg-ink py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-bone transition-transform duration-250 group-hover:translate-y-0 focus-visible:translate-y-0"
          >
            Quick Shop
          </Link>
        )}
      </div>

      <div className="pt-3">
        <h3 className="text-sm font-medium normal-case tracking-normal font-sans">
          <Link href={`/products/${product.slug}`} className="hover:underline underline-offset-4">
            {product.title}
          </Link>
        </h3>

        {product.fit && <p className="mt-1 text-xs text-ink-muted">{product.fit}</p>}

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatPrice(product.basePrice)}</span>
          {product.mrp > product.basePrice && (
            <span className="text-xs text-ink-muted line-through">{formatPrice(product.mrp)}</span>
          )}
        </div>

        {product.colors.length > 1 && (
          <div className="mt-2 flex gap-1.5">
            {product.colors.map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="h-3 w-3 rounded-full border border-line"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "ink" | "rust" | "olive" }) {
  return (
    <span
      className={cn(
        "px-2 py-1 text-[10px] font-semibold uppercase tracking-widest",
        tone === "ink" && "bg-ink text-bone",
        tone === "rust" && "bg-rust text-bone",
        tone === "olive" && "bg-olive text-bone",
      )}
    >
      {children}
    </span>
  );
}
