import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAdminProducts } from "@/lib/admin-api-client";
import { assetUrl } from "@/lib/assets";
import { formatPrice } from "@/lib/utils";
import { StockCell } from "@/components/admin/StockCell";
import { ProductSearch } from "@/components/admin/ProductSearch";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { products, categories, lowStockThreshold, total, page, pageCount } = await getAdminProducts(sp);

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v !== undefined) as [string, string][],
    );
    params.set("page", String(target));
    return `/admin/products?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Products</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {total} {total === 1 ? "product" : "products"} · low-stock threshold {lowStockThreshold}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + New Product
        </Link>
      </header>

      <ProductSearch categories={categories} />

      {products.length === 0 ? (
        <div className="border border-dashed border-line py-16 text-center">
          <p className="text-sm text-ink-muted">No products match these filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <article key={product.id} className="border border-line bg-white">
              <div className="flex flex-wrap items-start gap-4 border-b border-line p-4">
                <div className="relative h-24 w-19 shrink-0 overflow-hidden bg-bone-deep" style={{ width: 76 }}>
                  {product.images[0] && (
                    <Image
                      src={assetUrl(product.images[0])}
                      alt={product.title}
                      fill
                      sizes="76px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium hover:underline underline-offset-4"
                    >
                      {product.title}
                    </Link>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                        product.status === "LIVE"
                          ? "bg-olive/20 text-olive-deep"
                          : product.status === "DRAFT"
                            ? "bg-bone-deep text-ink-muted"
                            : "bg-rust/15 text-rust"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {product.category.name}
                    {product.fit ? ` · ${product.fit}` : ""}
                    {product.type ? ` · ${product.type}` : ""}
                  </p>
                  <p className="mt-1.5 text-sm">
                    {formatPrice(product.basePrice)}
                    {product.mrp > product.basePrice && (
                      <span className="ml-2 text-xs text-ink-muted line-through">
                        {formatPrice(product.mrp)}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/products/${product.slug}`}
                    target="_blank"
                    className="btn btn-outline px-4 py-2 text-[10px]"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="btn btn-primary px-4 py-2 text-[10px]"
                  >
                    Edit
                  </Link>
                </div>
              </div>

              <div className="p-4">
                <p className="eyebrow mb-3 text-ink-muted">Stock by size</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <StockCell
                      key={variant.id}
                      variantId={variant.id}
                      size={variant.size}
                      sku={variant.sku}
                      stock={variant.stock}
                      state={variant.state}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildPageHref(page - 1)} className="btn btn-outline px-4 py-2">
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link href={buildPageHref(page + 1)} className="btn btn-outline px-4 py-2">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
