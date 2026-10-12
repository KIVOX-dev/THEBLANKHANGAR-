import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// SVG is deliberately excluded: it's script-capable and this server serves uploads
// from its own origin, so a stored SVG would execute as same-origin content.
// Seed/placeholder artwork bypasses this whitelist — only the live admin upload
// endpoint (product photography) is gated here.
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

let b2Client: S3Client | null = null;

function b2() {
  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const key = process.env.B2_APPLICATION_KEY;
  const bucket = process.env.B2_BUCKET_NAME;
  const endpoint = process.env.B2_S3_ENDPOINT;
  if (!keyId || !key || !bucket || !endpoint) {
    throw new Error(
      "Backblaze B2 is not configured. Set B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME and B2_S3_ENDPOINT.",
    );
  }
  b2Client ??= new S3Client({
    region: process.env.B2_REGION ?? "us-west-004",
    endpoint,
    credentials: { accessKeyId: keyId, secretAccessKey: key },
    forcePathStyle: true,
  });
  return { client: b2Client, bucket };
}

export const usesB2 = () => (process.env.STORAGE_DRIVER ?? "local").toLowerCase() === "b2";

/** Uploads an object to the private B2 bucket. `key` is relative to /uploads (e.g. "products/x.jpg"). */
export async function putB2Object(key: string, body: Buffer, contentType: string) {
  const { client, bucket } = b2();
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

/** Streams an object from B2, or returns null if it doesn't exist. */
export async function getB2Object(key: string) {
  const { client, bucket } = b2();
  try {
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!out.Body) return null;
    return {
      body: out.Body as Readable,
      contentType: out.ContentType ?? "application/octet-stream",
      contentLength: out.ContentLength,
    };
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw err;
  }
}

/**
 * Storage seam. "b2" stores images in a private Backblaze B2 bucket (the API streams them
 * back at /uploads/*, so credentials never reach the browser); "local" writes to
 * ./public/uploads. Only the path (/uploads/products/<file>) is stored in the database.
 */
export async function storeImage(file: UploadedFile): Promise<StoredFile> {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    throw new Error("Only JPG, PNG, WebP or AVIF images are supported.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const name = `${randomUUID()}.${EXTENSION[file.mimetype] ?? "bin"}`;

  if (usesB2()) {
    await putB2Object(`products/${name}`, file.buffer, file.mimetype);
    return { url: `/uploads/products/${name}` };
  }

  const dir = join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), file.buffer);

  return { url: `/uploads/products/${name}` };
}
