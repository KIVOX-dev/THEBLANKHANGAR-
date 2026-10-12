import { jwtVerify } from "jose";

export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export type SessionPayload = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// Known example values from .env / .env.example — never valid in production.
const PLACEHOLDER_JWT_SECRETS = new Set([
  "dev-only-secret-change-me-in-production-9f3a7c2b8e1d4056",
  "replace-me-with-a-long-random-string",
]);

function requireJwtSecret(): string {
  const value = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!value) {
    if (isProduction) throw new Error("Missing required environment variable: JWT_SECRET");
    return "";
  }

  if (isProduction && (PLACEHOLDER_JWT_SECRETS.has(value) || value.length < 32)) {
    throw new Error(
      "JWT_SECRET is a known placeholder or too short for production. Set a unique, random secret of at least 32 characters.",
    );
  }

  return value;
}

// The frontend only ever verifies tokens issued by the backend — it never signs its own.
// Must match the backend's JWT_SECRET exactly.
const secret = new TextEncoder().encode(requireJwtSecret());

/** Edge-compatible (jose, not jsonwebtoken) so this also works inside proxy.ts. */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.id !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
