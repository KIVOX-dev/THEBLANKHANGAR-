import "server-only";
import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "@/lib/jwt";

export const SESSION_COOKIE = "bh_session";

/** The raw JWT, for attaching as an Authorization header on backend calls. */
export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

/** Reads and verifies the session cookie. Server Components / Route Handlers only. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifySession(token);
}

// Same names/return shape as the previous NextAuth-backed helpers, so the ~24 call sites
// across pages and route handlers needed only an import-path change, not a rewrite.
export async function requireUser() {
  return getSession();
}

export async function requireStaff() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "ADMIN" && session.role !== "STAFF") return null;
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== "ADMIN") return null;
  return session;
}
