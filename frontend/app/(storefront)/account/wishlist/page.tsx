import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getWishlistProducts } from "@/lib/api-client";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const user = await requireUser();
  if (!user) return null;

  const products = await getWishlistProducts();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed border-line py-16 text-center">
        <p className="text-lg">Your wishlist is empty</p>
        <p className="max-w-sm text-sm text-ink-muted">
          Tap the heart on any product to save it for later.
        </p>
        <Link href="/collections/t-shirts" className="btn btn-primary mt-2">
          Browse T-Shirts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl">Wishlist</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {products.length} {products.length === 1 ? "item" : "items"} saved
      </p>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
