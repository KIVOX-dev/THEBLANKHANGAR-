"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconClose, IconSearch, IconSpinner } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";
import type { ProductCardData } from "@/types/catalog";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useDialog<HTMLDivElement>(open, onClose);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&take=6`, {
          signal: controller.signal,
        });
        if (res.ok) setResults((await res.json()).products);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60">
      <button className="absolute inset-0 bg-ink/40 bh-fade" onClick={onClose} aria-label="Close search" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative bg-bone bh-fade-up"
      >
        <div className="wrap flex h-16 items-center gap-3 border-b border-line lg:h-18">
          <IconSearch className="w-5 h-5 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for tees, fits, colours…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-ink-muted"
            aria-label="Search products"
          />
          {loading && <IconSpinner className="w-4 h-4 text-ink-muted" />}
          <button onClick={onClose} aria-label="Close search" className="p-2 -mr-2">
            <IconClose />
          </button>
        </div>

        {query.trim().length >= 2 && (
          <div className="wrap max-h-[60vh] overflow-y-auto py-5">
            {results.length === 0 && !loading ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                No products match “{query.trim()}”.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 border border-line bg-white p-3 hover:border-ink transition-colors"
                    >
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-bone-deep">
                        {product.images[0] && (
                          <Image src={product.images[0]} alt={product.title} fill sizes="64px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.title}</p>
                        <p className="mt-1 text-xs text-ink-muted">{product.fit}</p>
                        <p className="mt-1 text-sm">{formatPrice(product.basePrice)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
