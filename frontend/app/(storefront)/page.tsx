import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { ProductRail } from "@/components/home/ProductRail";
import { QuickFilters } from "@/components/home/QuickFilters";
import { ShopByTiles } from "@/components/home/ShopByTiles";
import { getNavCategories, getProductCards, getSettings } from "@/lib/api-client";
import { assetUrl } from "@/lib/assets";
import { PRODUCT_TYPES } from "@/lib/constants";

export const metadata: Metadata = {
  description:
    "Heavyweight cotton T-shirts cut for everyday wear. Oversized, regular and slim fits in a tight, considered palette.",
};

export const revalidate = 60;

export default async function HomePage() {
  const [settings, categories, newArrivals, bestsellers] = await Promise.all([
    getSettings(),
    getNavCategories(),
    getProductCards({ isNewArrival: true }, { take: 8 }),
    getProductCards({ isBestseller: true }, { take: 8 }),
  ]);

  const primary = categories.find((c) => !c.comingSoon);
  const primarySlug = primary?.slug ?? "all";

  const slides: HeroSlide[] = [...settings.heroBanners]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      cta: b.cta,
      href: b.href,
      image: assetUrl(b.image),
      darkBackground: b.darkBackground,
    }));

  const typeTiles = PRODUCT_TYPES.map((type) => ({
    label: type,
    href: `/collections/${primarySlug}?type=${encodeURIComponent(type)}`,
    image: assetUrl(`/uploads/seed/type-${type.toLowerCase().replace(/\s+/g, "-")}.svg`),
  }));

  const categoryTiles = categories
    .filter((c) => c.image)
    .map((c) => ({
      label: c.comingSoon ? `${c.name} — Soon` : c.name,
      href: c.comingSoon ? "#" : `/collections/${c.slug}`,
      image: c.image as string,
    }));

  return (
    <>
      <HeroCarousel slides={slides} />

      <ProductRail
        title="New Arrivals"
        href={`/collections/${primarySlug}?sort=new`}
        products={newArrivals}
        priority
      />

      <ShopByTiles
        title="Shop T-Shirts By"
        subtitle="One category, many cuts. Pick the silhouette, not the logo."
        tiles={typeTiles}
      />

      <ProductRail
        title="Bestsellers"
        href={`/collections/${primarySlug}?sort=bestsellers`}
        products={bestsellers}
      />

      <QuickFilters collectionSlug={primarySlug} />

      {/* Editorial band */}
      <section className="relative mt-6 overflow-hidden bg-bone-deep">
        <div className="wrap grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="relative aspect-[16/10] overflow-hidden bg-line lg:order-2">
            <Image
              src={assetUrl("/uploads/photos/editorial-story.jpg")}
              alt="The Blank Hangar studio"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lg:order-1">
            <p className="eyebrow text-olive">Our Story</p>
            <h2 className="mt-4 text-3xl leading-tight lg:text-5xl">Nothing extra</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              We started with one question: what would a wardrobe look like if every piece
              earned its place? No seasonal noise, no logos doing the talking. Just heavyweight
              cotton, honest cuts, and a palette that gets out of the way.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
              Every run is limited — we make what we&apos;d wear, then we make it again better.
            </p>
            <Link href="/about" className="btn btn-outline mt-8">
              Read Our Story
            </Link>
          </div>
        </div>
      </section>

      <ShopByTiles
        title="Coming to the Hangar"
        subtitle="T-Shirts today. The rest of the wardrobe is on its way."
        tiles={categoryTiles}
      />

      {/* Newsletter band */}
      <section className="bg-ink text-bone">
        <div className="wrap flex flex-col items-center gap-6 py-16 text-center lg:py-20">
          <p className="eyebrow text-bone/70">Join the list</p>
          <h2 className="max-w-2xl text-3xl leading-tight lg:text-5xl">
            First look at every drop
          </h2>
          <p className="max-w-md text-sm text-bone/70">
            Limited runs sell through fast. Get restock and drop notices before they go public.
          </p>
          <Link href="/register" className="btn mt-2 bg-bone text-ink hover:bg-olive hover:text-bone">
            Create an Account
          </Link>
        </div>
      </section>
    </>
  );
}
