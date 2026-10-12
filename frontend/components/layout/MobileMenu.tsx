"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { IconChevron, IconClose } from "@/components/ui/Icons";
import { FITS, PRODUCT_TYPES, SIZES } from "@/lib/constants";
import { useDialog } from "@/hooks/useDialog";
import type { NavCategory } from "@/types/catalog";

const GROUPS = [
  { title: "Fit", param: "fit", values: FITS },
  { title: "Type", param: "type", values: PRODUCT_TYPES },
  { title: "Size", param: "size", values: SIZES },
] as const;

export function MobileMenu({
  categories,
  open,
  onClose,
}: {
  categories: NavCategory[];
  open: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelRef = useDialog<HTMLDivElement>(open, onClose);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 lg:hidden">
      <button
        className="absolute inset-0 bg-ink/40 bh-fade"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-bone flex flex-col bh-slide-in-left"
      >
        <div className="flex items-center justify-between border-b border-line px-5 h-16">
          <Logo width={150} />
          <button onClick={onClose} aria-label="Close menu" className="p-2 -mr-2">
            <IconClose />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-4">
          <Link href="/collections/all" onClick={onClose} className="block py-3 eyebrow border-b border-line">
            Shop All
          </Link>

          {categories.map((category) => {
            if (category.comingSoon) {
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between py-3 border-b border-line text-ink-muted"
                >
                  <span className="eyebrow">{category.name}</span>
                  <span className="text-[10px] tracking-widest text-olive">COMING SOON</span>
                </div>
              );
            }

            const isOpen = expanded === category.slug;
            return (
              <div key={category.id} className="border-b border-line">
                <button
                  className="flex w-full items-center justify-between py-3"
                  onClick={() => setExpanded(isOpen ? null : category.slug)}
                  aria-expanded={isOpen}
                >
                  <span className="eyebrow">{category.name}</span>
                  <IconChevron
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="pb-4 space-y-4">
                    <Link
                      href={`/collections/${category.slug}`}
                      onClick={onClose}
                      className="block text-sm underline underline-offset-4"
                    >
                      Shop all {category.name}
                    </Link>
                    {GROUPS.map((group) => (
                      <div key={group.title}>
                        <p className="eyebrow text-ink-muted mb-2">{group.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.values.map((value) => (
                            <Link
                              key={value}
                              href={`/collections/${category.slug}?${group.param}=${encodeURIComponent(value)}`}
                              onClick={onClose}
                              className="border border-line bg-white px-3 py-1.5 text-xs"
                            >
                              {value}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/about" onClick={onClose} className="block py-3 eyebrow border-b border-line">
            Our Story
          </Link>
          <Link href="/account/orders" onClick={onClose} className="block py-3 eyebrow border-b border-line">
            Track Order
          </Link>
          <Link href="/contact" onClick={onClose} className="block py-3 eyebrow border-b border-line">
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}
