#!/usr/bin/env node
// Backend (source of truth for charged totals) and frontend (display-only) each keep their
// own copy of pricing.ts — a real shared package would be overkill for two tiny pure
// functions across a Next.js app and an Express app that don't otherwise share a build
// pipeline. This script is the guardrail instead: it fails CI the moment the two files
// diverge, so a change to one can't silently go un-mirrored in the other.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const backendPath = join(rootDir, "backend", "src", "pricing.ts");
const frontendPath = join(rootDir, "frontend", "lib", "pricing.ts");

const normalize = (text) => text.replace(/\r\n/g, "\n").trim();

const backend = normalize(readFileSync(backendPath, "utf8"));
const frontend = normalize(readFileSync(frontendPath, "utf8"));

if (backend !== frontend) {
  console.error(
    `Pricing logic has drifted between ${backendPath} and ${frontendPath}.\n` +
      "These two files must stay identical — the backend is authoritative for charged " +
      "totals, but the frontend mirrors the same maths for display. Update both together.",
  );
  process.exit(1);
}

console.log("pricing.ts is in sync between backend and frontend.");
