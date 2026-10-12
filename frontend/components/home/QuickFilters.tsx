import Link from "next/link";
import { COLORS, PRICE_BUCKETS, SIZES } from "@/lib/constants";

/** "Shop By Size / Price / Colour" chip rows — each links into the collection page's filters. */
export function QuickFilters({ collectionSlug }: { collectionSlug: string }) {
  const base = `/collections/${collectionSlug}`;

  return (
    <section className="wrap grid gap-10 py-14 lg:grid-cols-3 lg:py-20">
      <div>
        <h2 className="mb-5 text-xl">Shop by Size</h2>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <Link
              key={size}
              href={`${base}?size=${size}`}
              className="grid h-11 w-11 place-items-center border border-line bg-white text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-bone"
            >
              {size}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-5 text-xl">Shop by Price</h2>
        <div className="flex flex-wrap gap-2">
          {PRICE_BUCKETS.map((bucket) => (
            <Link
              key={bucket.label}
              href={`${base}?minPrice=${bucket.min}&maxPrice=${bucket.max}`}
              className="border border-line bg-white px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-ink hover:bg-ink hover:text-bone"
            >
              {bucket.label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-5 text-xl">Shop by Colour</h2>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((color) => (
            <Link
              key={color.name}
              href={`${base}?color=${encodeURIComponent(color.name)}`}
              title={color.name}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className="h-9 w-9 rounded-full border border-line transition-transform group-hover:scale-110"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                {color.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
