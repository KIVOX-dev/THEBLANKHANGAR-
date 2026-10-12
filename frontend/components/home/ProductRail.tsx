import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCardData } from "@/types/catalog";

/** Horizontally scrollable rail on mobile, grid on desktop. */
export function ProductRail({
  title,
  href,
  products,
  priority = false,
}: {
  title: string;
  href: string;
  products: ProductCardData[];
  priority?: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section className="wrap py-14 lg:py-20">
      <div className="mb-7 flex items-end justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl">{title}</h2>
        <Link
          href={href}
          className="eyebrow shrink-0 border-b border-ink pb-0.5 hover:text-olive hover:border-olive transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={priority && i < 2}
            className="w-[58vw] shrink-0 snap-start xs:w-[46vw] sm:w-[38vw] md:w-auto"
          />
        ))}
      </div>
    </section>
  );
}
