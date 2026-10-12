"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { COLORS, FITS, PRICE_BUCKETS, PRODUCT_TYPES, SIZES } from "@/lib/constants";
import { IconClose, IconFilter } from "@/components/ui/Icons";

const SORTS = [
  { value: "new", label: "Newest" },
  { value: "bestsellers", label: "Bestsellers" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export function FilterPanel({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const selected = useCallback(
    (key: string) => searchParams.getAll(key),
    [searchParams],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      const current = next.getAll(key);
      next.delete(key);
      const remaining = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of remaining) next.append(key, v);
      next.delete("skip");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setPrice = useCallback(
    (min: number, max: number) => {
      const next = new URLSearchParams(searchParams.toString());
      const isActive =
        next.get("minPrice") === String(min) && next.get("maxPrice") === String(max);
      if (isActive) {
        next.delete("minPrice");
        next.delete("maxPrice");
      } else {
        next.set("minPrice", String(min));
        next.set("maxPrice", String(max));
      }
      next.delete("skip");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSort = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set("sort", value);
      else next.delete("sort");
      next.delete("skip");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const activeCount =
    selected("size").length +
    selected("color").length +
    selected("fit").length +
    selected("type").length +
    (searchParams.get("minPrice") ? 1 : 0);

  const clearAll = () => router.push(pathname, { scroll: false });

  const body = (
    <div className="space-y-8">
      <Group title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <Chip
              key={size}
              active={selected("size").includes(size)}
              onClick={() => toggle("size", size)}
              className="h-10 w-10 justify-center"
            >
              {size}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Fit">
        <div className="space-y-2">
          {FITS.map((fit) => (
            <Checkbox
              key={fit}
              label={fit}
              checked={selected("fit").includes(fit)}
              onChange={() => toggle("fit", fit)}
            />
          ))}
        </div>
      </Group>

      <Group title="Type">
        <div className="space-y-2">
          {PRODUCT_TYPES.map((type) => (
            <Checkbox
              key={type}
              label={type}
              checked={selected("type").includes(type)}
              onChange={() => toggle("type", type)}
            />
          ))}
        </div>
      </Group>

      <Group title="Colour">
        <div className="flex flex-wrap gap-3">
          {COLORS.map((color) => {
            const active = selected("color").includes(color.name);
            return (
              <button
                key={color.name}
                onClick={() => toggle("color", color.name)}
                title={color.name}
                aria-pressed={active}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "h-8 w-8 rounded-full border transition-all",
                    active ? "border-ink ring-2 ring-ink ring-offset-2" : "border-line",
                  )}
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-[10px] uppercase tracking-wide text-ink-muted">
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Price">
        <div className="space-y-2">
          {PRICE_BUCKETS.map((bucket) => (
            <Checkbox
              key={bucket.label}
              label={bucket.label}
              checked={
                searchParams.get("minPrice") === String(bucket.min) &&
                searchParams.get("maxPrice") === String(bucket.max)
              }
              onChange={() => setPrice(bucket.min, bucket.max)}
            />
          ))}
        </div>
      </Group>
    </div>
  );

  return (
    <>
      {/* Mobile trigger row */}
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="btn btn-outline flex-1 py-3"
        >
          <IconFilter className="h-4 w-4" />
          Filter{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
        <select
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => setSort(e.target.value)}
          className="field flex-1 py-3"
          aria-label="Sort products"
        >
          <option value="">Sort</option>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="mb-6 flex items-center justify-between">
          <p className="eyebrow">
            Filter{activeCount > 0 ? ` (${activeCount})` : ""}
          </p>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-ink-muted underline underline-offset-4 hover:text-rust">
              Clear all
            </button>
          )}
        </div>
        {body}
      </aside>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40 bh-fade"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col bg-bone">
            <div className="flex h-14 items-center justify-between border-b border-line px-5">
              <h2 className="text-base">Filter</h2>
              <button onClick={() => setMobileOpen(false)} aria-label="Close filters" className="p-2 -mr-2">
                <IconClose />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{body}</div>
            <div className="flex gap-3 border-t border-line px-5 py-4">
              <button onClick={clearAll} className="btn btn-outline flex-1">
                Clear
              </button>
              <button onClick={() => setMobileOpen(false)} className="btn btn-primary flex-1">
                Show {total} {total === 1 ? "item" : "items"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="eyebrow mb-3 text-ink-muted">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center border px-3 py-2 text-sm transition-colors",
        active
          ? "border-ink bg-ink text-bone"
          : "border-line bg-white hover:border-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-ink"
      />
      <span className={cn(checked ? "text-ink" : "text-ink-soft")}>{label}</span>
    </label>
  );
}
