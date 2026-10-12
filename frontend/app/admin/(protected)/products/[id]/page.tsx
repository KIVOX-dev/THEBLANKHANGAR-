import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/admin-api-client";
import { ProductForm, type ProductDraft } from "@/components/admin/ProductForm";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { StockLogTable } from "@/components/admin/StockLogTable";

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getAdminProduct(id);
  if (!result) notFound();
  const { product, categories, stockLogs } = result;

  const draft: ProductDraft = {
    title: product.title,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    fit: product.fit ?? "",
    type: product.type ?? "",
    fabric: product.fabric ?? "",
    careInstructions: product.careInstructions ?? "",
    basePrice: product.basePrice,
    mrp: product.mrp,
    images: product.images,
    status: product.status,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isBestseller: product.isBestseller,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color ?? "",
      colorHex: v.colorHex ?? "",
      sku: v.sku,
      stock: v.stock,
      priceOverride: v.priceOverride,
    })),
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
          >
            ← All products
          </Link>
          <h1 className="mt-3 text-2xl">{product.title}</h1>
        </div>
        <DeleteProductButton productId={product.id} />
      </div>

      <ProductForm productId={product.id} initial={draft} categories={categories} />

      <StockLogTable entries={stockLogs} />
    </div>
  );
}
