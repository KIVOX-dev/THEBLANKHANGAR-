// Isomorphic (no "server-only") — used both in Server Component data transforms and in
// client components (e.g. the admin product form's live image preview).
function resolveAssetBase(): string {
  const value = process.env.NEXT_PUBLIC_ASSET_URL;
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_ASSET_URL. Production must not silently fall back to a localhost asset URL.",
    );
  }

  return "http://localhost:4000";
}

const ASSET_BASE = resolveAssetBase();

/** Uploaded/seeded imagery is served by the backend, not this app — prefix relative paths. */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ASSET_BASE}${path}`;
}

export function assetUrls(paths: string[]): string[] {
  return paths.map(assetUrl);
}
