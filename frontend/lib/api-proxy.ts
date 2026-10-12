import "server-only";
import { NextResponse } from "next/server";
import { authedBackendFetch } from "@/lib/backend";

/**
 * Forwards an incoming request to the backend API almost verbatim — same method, query
 * string, JSON body, and the caller's session token if present — and relays the backend's
 * status/body straight back. This is what turns the ~30 API routes from direct database
 * calls into thin BFF proxies without each one hand-rolling the plumbing. Attaching a token
 * to a public backend route is harmless (the backend simply ignores it there), so there's no
 * need to distinguish "public" vs "authenticated" routes here — the backend's own
 * requireAuth/requireStaff/requireAdmin middleware is what actually enforces access, and its
 * 401/403 responses pass straight through.
 */
export async function proxyRequest(req: Request, backendPath: string) {
  const url = new URL(req.url);
  const target = `${backendPath}${url.search}`;
  const method = req.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  const res = await authedBackendFetch(target, {
    method,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? await req.text() : undefined,
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

/** Same idea, but forwards a multipart/form-data body (file uploads) as-is. */
export async function proxyUpload(req: Request, backendPath: string) {
  const contentType = req.headers.get("content-type") ?? "";
  const res = await authedBackendFetch(backendPath, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: req.body,
    // @ts-expect-error -- required by undici when streaming a body through fetch
    duplex: "half",
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}
