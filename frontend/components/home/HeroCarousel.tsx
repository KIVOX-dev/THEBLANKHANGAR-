"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string | null;
  cta?: string | null;
  href: string;
  image: string;
  /** Whether `image`'s background is dark enough for light (bone) overlay text. */
  darkBackground: boolean;
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  // Autoplay pauses on hover, keyboard focus, an explicit pause toggle, or a
  // backgrounded tab — any of these is enough to stop the timer.
  const autoplaying = !hovered && !focused && !manuallyPaused && !tabHidden;

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!autoplaying || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [autoplaying, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-bone-deep sm:aspect-[16/9] lg:aspect-[21/9]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            {slide.darkBackground && (
              // Photo brightness varies across the frame — a scrim guarantees the
              // light overlay text stays legible regardless of what's underneath.
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent sm:bg-gradient-to-r sm:from-ink/70 sm:via-ink/25 sm:to-transparent"
              />
            )}
            <div className="absolute inset-0 flex items-end sm:items-center">
              <div className="wrap pb-12 sm:pb-0">
                <div className="max-w-xl">
                  {slide.subtitle && (
                    <p
                      className={cn(
                        "eyebrow mb-3",
                        slide.darkBackground ? "text-bone/85" : "text-ink/75",
                      )}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  <h1
                    className={cn(
                      "text-4xl leading-[0.95] sm:text-6xl lg:text-7xl",
                      slide.darkBackground ? "text-bone drop-shadow-sm" : "text-ink",
                    )}
                  >
                    {slide.title}
                  </h1>
                  {slide.cta && (
                    <Link
                      href={slide.href}
                      className={cn(
                        "btn mt-7",
                        slide.darkBackground
                          ? "bg-bone text-ink hover:bg-olive hover:text-bone"
                          : "bg-ink text-bone hover:bg-olive",
                      )}
                      tabIndex={i === index ? 0 : -1}
                    >
                      {slide.cta}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <CarouselArrow direction="prev" onClick={() => go(index - 1)} />
          <CarouselArrow direction="next" onClick={() => go(index + 1)} />

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <div className="flex gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "h-1 transition-all",
                    i === index ? "w-8 bg-bone" : "w-4 bg-bone/50 hover:bg-bone/80",
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => setManuallyPaused((p) => !p)}
              aria-label={manuallyPaused ? "Play carousel" : "Pause carousel"}
              aria-pressed={manuallyPaused}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bone/85 text-ink hover:bg-bone"
            >
              {manuallyPaused ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                  <path d="M6 4.5v15l14-7.5-14-7.5Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                  <path d="M6 4.5h4v15H6v-15Zm8 0h4v15h-4v-15Z" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      className={cn(
        "absolute top-1/2 hidden -translate-y-1/2 grid-cols-1 place-items-center bg-bone/85 p-3 text-ink transition-colors hover:bg-bone sm:grid",
        direction === "prev" ? "left-4" : "right-4",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path
          d={direction === "prev" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
