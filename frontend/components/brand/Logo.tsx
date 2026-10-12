import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

/**
 * Single hook-up point for the brand mark. Drop a real /public/logo.svg in place of
 * the placeholder wordmark and nothing else in the layout has to change.
 * `tone="light"` inverts the dark mark for use on dark grounds (footer, admin rail).
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
  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt={BRAND.name}
      width={width}
      height={Math.round((width * 64) / 520)}
      style={{ width, maxWidth: "100%" }}
      className={cn("h-auto", tone === "light" && "invert", className)}
    />
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-block shrink-0" aria-label={`${BRAND.name} — home`}>
      {mark}
    </Link>
  );
}
