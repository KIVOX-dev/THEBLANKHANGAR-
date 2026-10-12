"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FITS, PRODUCT_TYPES, SIZES } from "@/lib/constants";
import type { NavCategory } from "@/types/catalog";

/** Facet groups shown inside the T-Shirts panel. Driven by product attributes, not sub-categories. */
const PANEL_GROUPS = [
  { title: "Shop by Fit", param: "fit", values: FITS },
  { title: "Shop by Type", param: "type", values: PRODUCT_TYPES },
  { title: "Shop by Size", param: "size", values: SIZES },
] as const;

export function MegaMenu({ categories }: { categories: NavCategory[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const active = categories.find((c) => c.slug === openSlug && !c.comingSoon);

  return (
    <nav
      className="hidden lg:block"
      onMouseLeave={() => setOpenSlug(null)}
      aria-label="Primary"
    >
      <ul className="flex items-center gap-7">
        <li>
          <Link
            href="/collections/all"
            className="eyebrow py-3 inline-block hover:text-olive transition-colors"
            onMouseEnter={() => setOpenSlug(null)}
          >
            Shop All
          </Link>
        </li>

        {categories.map((category) => (
          <li key={category.id}>
            {category.comingSoon ? (
              <span
                className="eyebrow py-3 inline-flex items-center gap-1.5 text-ink-muted cursor-default"
                title={`${category.name} — coming soon`}
              >
                {category.name}
                <span className="text-[9px] tracking-widest text-olive">SOON</span>
              </span>
            ) : (
              <Link
                href={`/collections/${category.slug}`}
                className={cn(
                  "eyebrow py-3 inline-block transition-colors hover:text-olive",
                  openSlug === category.slug && "text-olive",
                )}
                onMouseEnter={() => setOpenSlug(category.slug)}
              >
                {category.name}
              </Link>
            )}
          </li>
        ))}

        <li>
          <Link
            href="/about"
            className="eyebrow py-3 inline-block hover:text-olive transition-colors"
            onMouseEnter={() => setOpenSlug(null)}
          >
            Our Story
          </Link>
        </li>
      </ul>

      {active && (
        <div className="absolute inset-x-0 top-full border-t border-line bg-white shadow-[0_18px_40px_-24px_rgba(17,17,17,0.35)] bh-fade">
          <div className="wrap grid grid-cols-12 gap-10 py-10">
            {PANEL_GROUPS.map((group) => (
              <div key={group.title} className="col-span-2">
                <p className="eyebrow text-ink-muted mb-4">{group.title}</p>
                <ul className="space-y-2.5">
                  {group.values.map((value) => (
                    <li key={value}>
                      <Link
                        href={`/collections/${active.slug}?${group.param}=${encodeURIComponent(value)}`}
                        className="text-sm text-ink-soft hover:text-ink hover:underline underline-offset-4"
                        onClick={() => setOpenSlug(null)}
                      >
                        {value}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-3">
              <p className="eyebrow text-ink-muted mb-4">Featured</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href={`/collections/${active.slug}?sort=new`} className="text-sm text-ink-soft hover:text-ink hover:underline underline-offset-4" onClick={() => setOpenSlug(null)}>
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link href={`/collections/${active.slug}?sort=bestsellers`} className="text-sm text-ink-soft hover:text-ink hover:underline underline-offset-4" onClick={() => setOpenSlug(null)}>
                    Bestsellers
                  </Link>
                </li>
                <li>
                  <Link href={`/collections/${active.slug}?sale=1`} className="text-sm text-rust hover:underline underline-offset-4" onClick={() => setOpenSlug(null)}>
                    On Sale
                  </Link>
                </li>
              </ul>
            </div>

            {active.image && (
              <Link
                href={`/collections/${active.slug}`}
                className="col-span-3 group"
                onClick={() => setOpenSlug(null)}
              >
                <div className="relative aspect-4/5 overflow-hidden bg-bone-deep">
                  <Image
                    src={active.image}
                    alt={active.name}
                    fill
                    sizes="320px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="eyebrow mt-3 group-hover:text-olive transition-colors">
                  Shop all {active.name} →
                </p>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
