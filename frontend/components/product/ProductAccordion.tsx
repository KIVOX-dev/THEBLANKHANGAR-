"use client";

import { useState } from "react";
import { IconChevron } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export function ProductAccordion({
  sections,
}: {
  sections: { title: string; body: React.ReactNode }[];
}) {
  const [open, setOpen] = useState<string | null>(sections[0]?.title ?? null);

  return (
    <div className="border-t border-line">
      {sections.map((section) => {
        const isOpen = open === section.title;
        return (
          <div key={section.title} className="border-b border-line">
            <button
              onClick={() => setOpen(isOpen ? null : section.title)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="eyebrow">{section.title}</span>
              <IconChevron
                className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")}
              />
            </button>
            {isOpen && (
              <div className="pb-5 text-sm leading-relaxed text-ink-soft">{section.body}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
