import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

/**
 * Single hook-up point for the brand mark (/public/logo.png — the circular badge).
 * `width` is kept from the old wordmark API and scaled down to a badge size, so existing
 * call sites didn't change. `tone="light"` is for dark grounds (footer, admin rail): the
 * badge is black, so it gets a thin light ring to stay visible.
 */
export function Logo({
  className,
  href = "/",
  width = 210,
  tone = "dark",
}: {
  className?: string;
  href?: string | null;
  width?: number;
  tone?: "dark" | "light";
}) {
  const size = Math.max(40, Math.round(width * 0.34));

  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt={BRAND.name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("rounded-full", tone === "light" && "ring-1 ring-bone/40", className)}
    />
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-block shrink-0" aria-label={`${BRAND.name} — home`}>
      {mark}
    </Link>
  );
}
