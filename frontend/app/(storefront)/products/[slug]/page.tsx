import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductRail } from "@/components/home/ProductRail";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import {
  getProductDetail,
  getProductCards,
  getProductReviews,
  getSitemapEntries,
} from "@/lib/api-client";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { products } = await getSitemapEntries();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.title,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images.slice(0, 1),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getProductCards(
      { categorySlug: product.category.slug, excludeId: product.id },
      { take: 4 },
    ),
    getProductReviews(product.id),
  ]);

  const inStock = product.variants.some((v) => v.stock > 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    // product.images are already absolute (backend-hosted), unlike a same-origin path.
    image: product.images,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "The Blank Hangar" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...product.variants.map((v) => v.price)),
      highPrice: Math.max(...product.variants.map((v) => v.price)),
      offerCount: product.variants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteUrl}/products/${product.slug}`,
    },
    ...(reviews.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviews.average,
        reviewCount: reviews.count,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="wrap py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} title={product.title} />

          <div className="lg:max-w-lg">
            <BuyBox product={product} />

            <div className="mt-10">
              <ProductAccordion
                sections={[
                  {
                    title: "Description",
                    body: <p>{product.description}</p>,
                  },
                  {
                    title: "Fabric & Care",
                    body: (
                      <div className="space-y-2">
                        {product.fabric && (
                          <p>
                            <strong className="font-medium text-ink">Fabric:</strong>{" "}
                            {product.fabric}
                          </p>
                        )}
                        {product.careInstructions && <p>{product.careInstructions}</p>}
                      </div>
                    ),
                  },
                  {
                    title: "Shipping & Returns",
                    body: (
                      <div className="space-y-2">
                        <p>Free shipping on orders above ₹1499. Dispatched within 24–48 hours.</p>
                        <p>
                          Easy 7-day returns on unworn items with tags intact. Refunds are issued
                          to the original payment method within 5–7 business days of pickup.
                        </p>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <ReviewsSection
        productId={product.id}
        initialReviews={reviews.items}
        average={reviews.average}
        count={reviews.count}
      />

      <ProductRail
        title="Complete the Look"
        href={`/collections/${product.category.slug}`}
        products={related}
      />
    </>
  );
}
