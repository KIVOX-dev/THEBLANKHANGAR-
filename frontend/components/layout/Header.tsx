"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import { Logo } from "@/components/brand/Logo";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { IconBag, IconHeart, IconMenu, IconSearch, IconUser } from "@/components/ui/Icons";
import { cartCount, useCart } from "@/store/cart";
import type { NavCategory } from "@/types/catalog";
import { SearchOverlay } from "@/components/layout/SearchOverlay";

export function Header({ categories }: { categories: NavCategory[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { lines, openCart } = useCart();
  const { data: session } = useSession();

  // Cart lives in localStorage, so the count must not render until after hydration.
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(lines) : 0;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-bone/95 backdrop-blur-sm">
        <div className="wrap relative flex h-16 items-center gap-4 lg:h-18">
          <button
            className="lg:hidden -ml-2 p-2"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>

          <Logo width={180} className="lg:hidden mx-auto" />

          <div className="hidden lg:flex items-center gap-10">
            <Logo width={196} />
            <MegaMenu categories={categories} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 hover:text-olive transition-colors"
            >
              <IconSearch />
            </button>

            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="hidden sm:inline-flex p-2 hover:text-olive transition-colors"
            >
              <IconHeart />
            </Link>

            <Link
              href={session?.user ? "/account" : "/login"}
              aria-label={session?.user ? "Your account" : "Sign in"}
              className="hidden sm:inline-flex p-2 hover:text-olive transition-colors"
            >
              <IconUser />
            </Link>

            <button
              onClick={openCart}
              aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`}
              className="relative p-2 hover:text-olive transition-colors"
            >
              <IconBag />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-semibold text-bone tabular-nums">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu categories={categories} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
