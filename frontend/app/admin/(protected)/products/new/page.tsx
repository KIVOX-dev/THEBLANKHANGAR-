import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCategories } from "@/lib/admin-api-client";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "New Product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          ← All products
        </Link>
        <h1 className="mt-3 text-2xl">New Product</h1>
      </div>

      {categories.length === 0 ? (
        <p className="border border-dashed border-line py-10 text-center text-sm text-ink-muted">
          Create a category that isn&apos;t marked &quot;Coming Soon&quot; before adding products.
        </p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
