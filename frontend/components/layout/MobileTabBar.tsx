"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { cartCount, useCart } from "@/store/cart";
import { IconBag, IconGrid, IconHeart, IconHome, IconUser } from "@/components/ui/Icons";

export function MobileTabBar() {
  const pathname = usePathname();
  const { lines, openCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(lines) : 0;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const item = "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] tracking-widest uppercase";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bone lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch">
        <Link href="/" className={cn(item, isActive("/") ? "text-ink" : "text-ink-muted")}>
          <IconHome className="w-5 h-5" />
          Home
        </Link>
        <Link
          href="/collections/all"
          className={cn(item, isActive("/collections") ? "text-ink" : "text-ink-muted")}
        >
          <IconGrid className="w-5 h-5" />
          Shop
        </Link>
        <Link
          href="/account/wishlist"
          className={cn(item, isActive("/account/wishlist") ? "text-ink" : "text-ink-muted")}
        >
          <IconHeart className="w-5 h-5" />
          Wishlist
        </Link>
        <button onClick={openCart} className={cn(item, "text-ink-muted relative")}>
          <span className="relative">
            <IconBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-semibold text-bone tabular-nums">
                {count}
              </span>
            )}
          </span>
          Bag
        </button>
        <Link
          href="/account"
          className={cn(
            item,
            pathname === "/account" || pathname.startsWith("/account/orders")
              ? "text-ink"
              : "text-ink-muted",
          )}
        >
          <IconUser className="w-5 h-5" />
          Profile
        </Link>
      </div>
    </nav>
  );
}
