import "server-only";
import { getSessionToken } from "@/lib/session";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export function backendUrl(path: string) {
  return `${BACKEND_URL}${path}`;
}

/** Server-to-server calls (this Next process → the Express API) aren't subject to CORS. */
export async function backendFetch(path: string, init?: RequestInit) {
  return fetch(backendUrl(path), init);
}

/** Same as backendFetch, but attaches the current user's session token as a Bearer header. */
export async function authedBackendFetch(path: string, init?: RequestInit) {
  const token = await getSessionToken();
  return fetch(backendUrl(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
