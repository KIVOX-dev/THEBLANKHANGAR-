import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "uploads", "seed");

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readableOn(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#F5F3EF";
}

/** A flat-illustrated tee on a colored ground — stands in for real product photography. */
export function productShot(opts: {
  file: string;
  bg: string;
  garment: string;
  label: string;
  sublabel: string;
  view: "front" | "back";
  sleeve: "short" | "long";
}) {
  const ink = readableOn(opts.bg);
  const stroke = readableOn(opts.garment) === "#111111" ? "#00000022" : "#ffffff33";
  const sleeveW = opts.sleeve === "long" ? 120 : 54;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${esc(opts.label)}">
  <rect width="800" height="1000" fill="${opts.bg}"/>
  <g transform="translate(400 470)">
    <path d="M -150 -190 L -70 -225 Q 0 -180 70 -225 L 150 -190 L ${-190 - sleeveW + 190} -190 Z" fill="none"/>
    <path d="
      M -80 -228
      L -172 -186
      L -172 ${-186 + sleeveW + 40}
      L -116 ${-186 + sleeveW + 58}
      L -116 300
      L 116 300
      L 116 ${-186 + sleeveW + 58}
      L 172 ${-186 + sleeveW + 40}
      L 172 -186
      L 80 -228
      Q 0 -170 -80 -228 Z"
      fill="${opts.garment}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M -80 -228 Q 0 -170 80 -228" fill="none" stroke="${stroke}" stroke-width="6"/>
    ${
      opts.view === "back"
        ? `<path d="M -60 -212 Q 0 -186 60 -212" fill="none" stroke="${stroke}" stroke-width="5"/>`
        : ""
    }
  </g>
  <text x="56" y="86" fill="${ink}" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="7">THE BLANK HANGAR</text>
  <text x="56" y="924" fill="${ink}" font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="2">${esc(opts.label)}</text>
  <text x="56" y="962" fill="${ink}" opacity="0.65" font-family="Helvetica, Arial, sans-serif" font-size="21" letter-spacing="4">${esc(opts.sublabel.toUpperCase())}</text>
</svg>`;

  writeFileSync(join(OUT_DIR, opts.file), svg, "utf8");
  return `/uploads/seed/${opts.file}`;
}

/** Square-ish tile used in the category / "shop by" grids. */
export function tile(opts: { file: string; bg: string; accent: string; label: string }) {
  const ink = readableOn(opts.bg);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 880" width="700" height="880" role="img" aria-label="${esc(opts.label)}">
  <rect width="700" height="880" fill="${opts.bg}"/>
  <path d="M 0 880 L 700 500 L 700 880 Z" fill="${opts.accent}" opacity="0.4"/>
  <circle cx="530" cy="250" r="150" fill="${opts.accent}" opacity="0.45"/>
  <text x="48" y="800" fill="${ink}" font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="700" letter-spacing="2">${esc(opts.label.toUpperCase())}</text>
</svg>`;
  writeFileSync(join(OUT_DIR, opts.file), svg, "utf8");
  return `/uploads/seed/${opts.file}`;
}

export function ensureArtDir() {
  mkdirSync(OUT_DIR, { recursive: true });
}
