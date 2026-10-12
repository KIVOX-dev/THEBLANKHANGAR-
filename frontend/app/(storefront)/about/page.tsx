import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Why THE BLANK HANGAR makes heavyweight essentials instead of seasonal noise.",
};

export default function AboutPage() {
  return (
    <div className="wrap max-w-3xl py-14 lg:py-20">
      <p className="eyebrow text-olive">Our Story</p>
      <h1 className="mt-4 text-4xl lg:text-5xl">Nothing extra</h1>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-bone-deep">
        <Image
          src={assetUrl("/uploads/photos/editorial-story.jpg")}
          alt="The Blank Hangar studio"
          fill
          sizes="(min-width: 1024px) 768px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-ink-soft">
        <p>
          THE BLANK HANGAR started with one question: what would a wardrobe look like if every
          piece earned its place? Not a logo shouting for attention, not a print chasing a
          trend cycle — just heavyweight cotton, an honest cut, and a colour that gets out of
          the way.
        </p>
        <p>
          The name comes from where every piece begins: a blank hangar, before a single stitch.
          We treat the T-shirt as a foundation, not filler — 240 GSM combed cotton, bio-washed
          for a softer break-in, cut with a drop shoulder that holds its shape past the first
          twenty washes.
        </p>
        <p>
          We&apos;re starting with T-shirts because we&apos;d rather get one category right than
          ship five half-finished ones. Shirts, bottomwear, hoodies and accessories are next —
          built the same way, on the same principle: buy less, wear it longer.
        </p>
        <p>Every run is limited. When it&apos;s gone, we make the next version better, not just more.</p>
      </div>

      <Link href="/collections/t-shirts" className="btn btn-primary mt-10">
        Shop the Current Drop
      </Link>
    </div>
  );
}
