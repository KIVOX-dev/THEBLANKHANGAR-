import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import type { NavCategory } from "@/types/catalog";

const QUICK_LINKS = [
  { label: "Track Order", href: "/account/orders" },
  { label: "Contact Us", href: "/contact" },
  { label: "About Us", href: "/about" },
  { label: "Shipping & Returns", href: "/returns" },
  { label: "Size Guide", href: "/size-guide" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X", href: "https://x.com" },
  { label: "YouTube", href: "https://youtube.com" },
];

const PAYMENT_METHODS = ["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "COD"];

export function Footer({
  categories,
  storeEmail,
  storePhone,
}: {
  categories: NavCategory[];
  storeEmail: string;
  storePhone: string;
}) {
  return (
    <footer className="mt-24 bg-ink text-bone">
      <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo href={null} width={200} tone="light" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-bone/70">
            Heavyweight essentials cut for everyday wear. Made in limited runs, in a palette
            that stays out of your way.
          </p>
          <div className="mt-6 space-y-1 text-sm text-bone/70">
            <p>
              <a href={`mailto:${storeEmail}`} className="hover:text-bone underline-offset-4 hover:underline">
                {storeEmail}
              </a>
            </p>
            <p>{storePhone}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm mb-5 tracking-[0.2em]">Shop</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/collections/all" className="text-bone/70 hover:text-bone underline-offset-4 hover:underline">
                Shop All
              </Link>
            </li>
            {categories.map((category) =>
              category.comingSoon ? (
                <li key={category.id} className="flex items-center gap-2 text-bone/40">
                  {category.name}
                  <span className="text-[10px] tracking-widest text-olive">SOON</span>
                </li>
              ) : (
                <li key={category.id}>
                  <Link
                    href={`/collections/${category.slug}`}
                    className="text-bone/70 hover:text-bone underline-offset-4 hover:underline"
                  >
                    {category.name}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm mb-5 tracking-[0.2em]">Help</h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-bone/70 hover:text-bone underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm mb-5 tracking-[0.2em]">Stay in the loop</h3>
          <p className="mb-4 text-sm text-bone/70">
            Early access to drops and restocks. No noise.
          </p>
          <NewsletterForm />

          <div className="mt-7 flex flex-wrap gap-4">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs uppercase tracking-widest text-bone/70 hover:text-bone"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-bone/15">
        <div className="wrap flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="border border-bone/25 px-2.5 py-1 text-[10px] uppercase tracking-widest text-bone/60"
              >
                {method}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-bone/50">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-bone">
                {link.label}
              </Link>
            ))}
            <span>© {new Date().getFullYear()} The Blank Hangar. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
