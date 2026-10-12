import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterPanel } from "@/components/collection/FilterPanel";
import { ProductGrid } from "@/components/collection/ProductGrid";
import { getCategoryBySlug, searchProducts } from "@/lib/api-client";

const PAGE_SIZE = 12;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Collection not found" };

  return {
    title: category.name,
    description:
      category.description ??
      `Shop ${category.name} at The Blank Hangar — heavyweight essentials cut for everyday wear.`,
    alternates: { canonical: `/collections/${category.slug}` },
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const rawSearch = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { products, total, hasMore } = await searchProducts(
    { ...rawSearch, take: String(PAGE_SIZE), skip: "0" },
    slug,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const itemListJsonLd = products.length > 0 && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/products/${product.slug}`,
    })),
  };

  // Suspense keys on the query string so the client filter/grid remount on navigation.
  const suspenseKey = new URLSearchParams(
    Object.entries(rawSearch).flatMap(([k, v]) =>
      v === undefined ? [] : Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]],
    ),
  ).toString();

  return (
    <div className="wrap py-8 lg:py-12">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <nav aria-label="Breadcrumb" className="mb-5 text-xs text-ink-muted">
        <a href="/" className="hover:text-ink">Home</a>
        <span className="mx-2">/</span>
        <span className="text-ink">{category.name}</span>
      </nav>

      <header className="mb-8 lg:mb-12">
        <h1 className="text-3xl lg:text-5xl">{category.name}</h1>
        {category.description && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            {category.description}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          {total} {total === 1 ? "product" : "products"}
        </p>
      </header>

      {category.comingSoon ? (
        <div className="flex min-h-70 flex-col items-center justify-center gap-3 border border-dashed border-line py-20 text-center">
          <p className="eyebrow text-olive">Coming Soon</p>
          <h2 className="text-2xl">{category.name} are on the way</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            We&apos;re still cutting the first run. Join the list and you&apos;ll hear about it first.
          </p>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          <Suspense key={`filters-${suspenseKey}`} fallback={null}>
            <FilterPanel total={total} />
          </Suspense>

          <Suspense key={`grid-${suspenseKey}`} fallback={<GridSkeleton />}>
            <ProductGrid
              initialProducts={products}
              initialHasMore={hasMore}
              pageSize={PAGE_SIZE}
              categorySlug={slug}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-4/5 bg-bone-deep" />
          <div className="mt-3 h-3 w-3/4 bg-bone-deep" />
          <div className="mt-2 h-3 w-1/3 bg-bone-deep" />
        </div>
      ))}
    </div>
  );
}
