import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "Find your fit for THE BLANK HANGAR T-shirts.",
};

const ROWS = [
  { size: "S", chest: 38, length: 27, shoulder: 17.5 },
  { size: "M", chest: 40, length: 28, shoulder: 18.5 },
  { size: "L", chest: 42, length: 29, shoulder: 19.5 },
  { size: "XL", chest: 44, length: 30, shoulder: 20.5 },
  { size: "XXL", chest: 46, length: 31, shoulder: 21.5 },
];

export default function SizeGuidePage() {
  return (
    <div className="wrap max-w-2xl py-14 lg:py-20">
      <h1 className="text-4xl lg:text-5xl">Size Guide</h1>
      <p className="mt-3 text-sm text-ink-soft">
        All measurements in inches, taken flat and doubled. Oversized fits run one size larger
        by design — size down for a regular drape.
      </p>

      <div className="mt-8 overflow-x-auto border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bone-deep/40 text-left">
              <th className="px-4 py-3 eyebrow text-ink-muted">Size</th>
              <th className="px-4 py-3 eyebrow text-ink-muted">Chest</th>
              <th className="px-4 py-3 eyebrow text-ink-muted">Length</th>
              <th className="px-4 py-3 eyebrow text-ink-muted">Shoulder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ROWS.map((row) => (
              <tr key={row.size}>
                <td className="px-4 py-3 font-medium">{row.size}</td>
                <td className="px-4 py-3 tabular-nums">{row.chest}&quot;</td>
                <td className="px-4 py-3 tabular-nums">{row.length}&quot;</td>
                <td className="px-4 py-3 tabular-nums">{row.shoulder}&quot;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-3 text-sm leading-relaxed text-ink-soft">
        <p>
          <strong className="font-medium text-ink">Chest</strong> — measured 1&quot; below the
          armhole, straight across.
        </p>
        <p>
          <strong className="font-medium text-ink">Length</strong> — measured from the highest
          point of the shoulder to the hem.
        </p>
        <p>
          <strong className="font-medium text-ink">Shoulder</strong> — measured seam to seam,
          across the back.
        </p>
      </div>
    </div>
  );
}
