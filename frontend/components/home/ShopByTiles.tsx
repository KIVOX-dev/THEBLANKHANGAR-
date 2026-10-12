import Image from "next/image";
import Link from "next/link";

export type ShopTile = {
  label: string;
  href: string;
  image: string;
};

export function ShopByTiles({
  title,
  tiles,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  tiles: ShopTile[];
}) {
  if (tiles.length === 0) return null;

  return (
    <section className="wrap py-14 lg:py-20">
      <div className="mb-7">
        <h2 className="text-2xl lg:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-lg text-sm text-ink-muted">{subtitle}</p>}
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group w-[52vw] shrink-0 snap-start sm:w-[34vw] md:w-auto"
          >
            <div className="relative aspect-4/5 overflow-hidden bg-bone-deep">
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 52vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="eyebrow mt-3 group-hover:text-olive transition-colors">{tile.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
