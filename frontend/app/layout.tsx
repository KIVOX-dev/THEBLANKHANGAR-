import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { SessionProvider } from "@/providers/SessionProvider";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — Heavyweight Essentials for Men`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Heavyweight cotton T-shirts cut for everyday wear. Oversized, regular and slim fits in a tight, considered palette. Free shipping on orders above ₹1499.",
  keywords: [
    "men's t-shirts",
    "oversized t-shirts",
    "heavyweight cotton tee",
    "streetwear India",
    "plain t-shirts",
  ],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — Heavyweight Essentials for Men`,
    description:
      "Heavyweight cotton T-shirts cut for everyday wear. Oversized, regular and slim fits.",
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bone text-ink">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
