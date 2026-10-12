"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const shots = images.length ? images : [];

  if (shots.length === 0) {
    return <div className="aspect-4/5 w-full bg-bone-deep" />;
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {shots.length > 1 && (
        <div className="flex gap-3 lg:flex-col">
          {shots.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${title}`}
              aria-current={i === active}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden border bg-bone-deep transition-colors lg:h-28 lg:w-22",
                i === active ? "border-ink" : "border-transparent hover:border-line",
              )}
            >
              <Image src={src} alt="" fill sizes="88px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setZoomed((z) => !z)}
        className="relative aspect-4/5 flex-1 cursor-zoom-in overflow-hidden bg-bone-deep"
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
      >
        <Image
          src={shots[active]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className={cn(
            "object-cover transition-transform duration-500",
            zoomed && "scale-150 cursor-zoom-out",
          )}
        />
      </button>
    </div>
  );
}
