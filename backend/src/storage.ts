import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// SVG is deliberately excluded: it's script-capable and this server serves uploads
// statically from its own origin, so a stored SVG would execute as same-origin content.
// Seed/placeholder artwork writes SVG files directly to disk, bypassing this whitelist —
// only the live admin upload endpoint (product photography) is gated here.
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type StoredFile = { url: string };

/** Shape of a multer-parsed upload (memoryStorage) — avoids a hard dependency on multer's types here. */
export type UploadedFile = { mimetype: string; size: number; buffer: Buffer };

/**
 * Storage seam. The local driver writes to ./public/uploads, served by this server
 * at /uploads/*; swapping in Cloudinary/S3 means adding a branch here and setting
 * STORAGE_DRIVER — no calling code changes.
 */
export async function storeImage(file: UploadedFile): Promise<StoredFile> {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    throw new Error("Only JPG, PNG, WebP, AVIF or SVG images are supported.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();

  if (driver === "cloudinary") {
    throw new Error(
      "Cloudinary storage is not configured yet. Set STORAGE_DRIVER=local or add the Cloudinary driver.",
    );
  }

  const dir = join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });

  const name = `${randomUUID()}.${EXTENSION[file.mimetype] ?? "bin"}`;
  await writeFile(join(dir, name), file.buffer);

  return { url: `/uploads/products/${name}` };
}
