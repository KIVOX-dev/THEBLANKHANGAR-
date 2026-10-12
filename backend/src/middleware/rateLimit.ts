import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * In-memory fixed-window limiter. Adequate for a single instance / demo deploy;
 * a multi-instance production deploy needs a shared store (Redis/Upstash).
 */
function check(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip ?? "unknown";
}

/** Express middleware factory: `rateLimit(5, 60_000)` allows 5 requests/minute per IP+route. */
export function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.baseUrl}${req.path}:${clientIp(req)}`;
    const result = check(key, limit, windowMs);

    if (!result.ok) {
      res.status(429).json({
        error: "Too many attempts. Please try again shortly.",
        retryAfter: result.retryAfter,
      });
      return;
    }

    next();
  };
}
