import type { NextFunction, Request, Response } from "express";
import { verifySession, type SessionPayload } from "@/jwt";
import { forbidden, unauthorized } from "@/middleware/errorHandler";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

const STAFF_ROLES = new Set(["ADMIN", "STAFF"]);

/** Populates req.user from the Authorization header if present; never rejects on its own. */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (token) {
    const session = await verifySession(token);
    if (session) req.user = session;
  }

  next();
}

/** Route guard: any authenticated user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  next();
}

/** Route guard: STAFF or ADMIN. */
export function requireStaff(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  if (!STAFF_ROLES.has(req.user.role)) return next(forbidden());
  next();
}

/** Route guard: ADMIN only. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== "ADMIN") return next(forbidden());
  next();
}
