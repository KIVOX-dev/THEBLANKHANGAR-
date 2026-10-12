"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
];

export function AccountNav({ isStaff }: { isStaff: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
      <ul className="flex gap-1 overflow-x-auto border-b border-line pb-px no-scrollbar lg:block lg:space-y-1 lg:overflow-visible lg:border-0 lg:pb-0">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={cn(
                  "block whitespace-nowrap px-4 py-2.5 text-sm transition-colors lg:px-3",
                  active
                    ? "border-b-2 border-ink font-medium text-ink lg:border-b-0 lg:border-l-2 lg:bg-bone-deep/60"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}

        {isStaff && (
          <li className="shrink-0">
            <Link
              href="/admin"
              className="block whitespace-nowrap px-4 py-2.5 text-sm text-olive hover:underline underline-offset-4 lg:px-3"
            >
              Admin Panel →
            </Link>
          </li>
        )}
      </ul>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-5 hidden text-sm text-ink-muted underline underline-offset-4 hover:text-rust lg:block lg:px-3"
      >
        Sign out
      </button>
    </nav>
  );
}
