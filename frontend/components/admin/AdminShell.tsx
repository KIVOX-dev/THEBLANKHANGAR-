"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { IconClose, IconMenu } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/enums";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings", adminOnly: true },
];

export function AdminShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  role: Role;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const links = NAV.filter((link) => !link.adminOnly || role === "ADMIN");

  const nav = (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setNavOpen(false)}
            className={cn(
              "block px-4 py-2.5 text-sm transition-colors",
              active
                ? "bg-bone/15 font-medium text-bone"
                : "text-bone/60 hover:bg-bone/8 hover:text-bone",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-bone">
      {/* Desktop rail */}
      <aside className="hidden w-56 shrink-0 flex-col bg-ink lg:flex">
        <div className="px-4 py-6">
          <Logo width={150} tone="light" href="/admin" />
          <p className="eyebrow mt-2 text-bone/50">Admin</p>
        </div>
        <div className="flex-1 py-2">{nav}</div>
        <div className="border-t border-bone/15 px-4 py-4">
          <p className="truncate text-sm text-bone">{userName}</p>
          <p className="text-[10px] uppercase tracking-widest text-bone/50">{role}</p>
          <div className="mt-3 space-y-1.5">
            <Link href="/" className="block text-xs text-bone/60 hover:text-bone">
              View storefront →
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-xs text-bone/60 hover:text-bone"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/50"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink bh-slide-in-left">
            <div className="flex items-center justify-between px-4 py-5">
              <Logo width={130} tone="light" href="/admin" />
              <button onClick={() => setNavOpen(false)} aria-label="Close navigation" className="p-2 text-bone">
                <IconClose />
              </button>
            </div>
            <div className="flex-1 py-2">{nav}</div>
            <div className="border-t border-bone/15 px-4 py-4">
              <p className="truncate text-sm text-bone">{userName}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="mt-2 text-xs text-bone/60 hover:text-bone"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
          <button onClick={() => setNavOpen(true)} aria-label="Open navigation" className="p-2 -ml-2">
            <IconMenu />
          </button>
          <Logo width={140} href="/admin" />
        </header>

        <main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
