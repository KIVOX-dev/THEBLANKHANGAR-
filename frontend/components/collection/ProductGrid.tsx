"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { IconSpinner } from "@/components/ui/Icons";
import type { ProductCardData } from "@/types/catalog";

/**
 * Renders the server-fetched first page, then appends further pages client-side.
 * Resets whenever the filter query changes.
 */
export function ProductGrid({
  initialProducts,
  initialHasMore,
  pageSize,
  categorySlug,
}: {
  initialProducts: ProductCardData[];
  initialHasMore: boolean;
  pageSize: number;
  categorySlug: string;
}) {
  const searchParams = useSearchParams();
  const key = searchParams.toString();

  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
    setHasMore(initialHasMore);
    setError(null);
  }, [initialProducts, initialHasMore, key]);

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(key);
      params.set("category", categorySlug);
      params.set("skip", String(products.length));
      params.set("take", String(pageSize));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load more products");

      const data = await res.json();
      setProducts((prev) => [...prev, ...data.products]);
      setHasMore(data.hasMore);
    } catch {
      setError("Could not load more products. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-70 flex-col items-center justify-center gap-3 border border-dashed border-line py-16 text-center">
        <p className="text-lg">No products match these filters</p>
        <p className="max-w-sm text-sm text-ink-muted">
          Try clearing a filter or two — the run may also be sold through.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 4} />
        ))}
      </div>

      {error && <p className="mt-6 text-center text-sm text-rust">{error}</p>}

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button onClick={loadMore} disabled={loading} className="btn btn-outline min-w-48">
            {loading ? (
              <>
                <IconSpinner className="h-4 w-4" />
                Loading
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
