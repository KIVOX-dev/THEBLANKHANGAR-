"use client";

import { useEffect } from "react";
import { IconClose } from "@/components/ui/Icons";

const ROWS = [
  { size: "S", chest: 38, length: 27, shoulder: 17.5 },
  { size: "M", chest: 40, length: 28, shoulder: 18.5 },
  { size: "L", chest: 42, length: 29, shoulder: 19.5 },
  { size: "XL", chest: 44, length: 30, shoulder: 20.5 },
  { size: "XXL", chest: 46, length: 31, shoulder: 21.5 },
];

export function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 grid place-items-center p-4" role="dialog" aria-modal aria-label="Size guide">
      <button className="absolute inset-0 bg-ink/50 bh-fade" onClick={onClose} aria-label="Close size guide" />

      <div className="relative w-full max-w-lg bg-bone bh-fade-up">
        <header className="flex items-center justify-between border-b border-line px-5 h-14">
          <h2 className="text-base">Size Guide</h2>
          <button onClick={onClose} aria-label="Close size guide" className="p-2 -mr-2">
            <IconClose />
          </button>
        </header>

        <div className="px-5 py-5">
          <p className="mb-4 text-xs text-ink-muted">
            All measurements in inches, taken flat and doubled. Our oversized fits run one size
            larger by design — size down for a regular drape.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2.5 pr-4 eyebrow">Size</th>
                  <th className="py-2.5 pr-4 eyebrow">Chest</th>
                  <th className="py-2.5 pr-4 eyebrow">Length</th>
                  <th className="py-2.5 eyebrow">Shoulder</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.size} className="border-b border-line/60">
                    <td className="py-2.5 pr-4 font-medium">{row.size}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{row.chest}&quot;</td>
                    <td className="py-2.5 pr-4 tabular-nums">{row.length}&quot;</td>
                    <td className="py-2.5 tabular-nums">{row.shoulder}&quot;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
