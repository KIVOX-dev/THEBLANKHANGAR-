import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { OrderError } from "@/services/orders";

/** Thrown by route handlers for a specific HTTP status; caught by errorHandler below. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const unauthorized = () => new HttpError("You must be signed in to do that.", 401);
export const forbidden = () => new HttpError("You do not have access to this resource.", 403);
export const notFound = (what = "Resource") => new HttpError(`${what} not found.`, 404);

/** Wraps an async route handler so thrown/rejected errors reach errorHandler instead of hanging. */
export function asyncRoute(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/** Same JSON error shape the app used as a single Next.js project: { error, fieldErrors? }. */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    res.status(422).json({ error: "Please check the highlighted fields.", fieldErrors });
    return;
  }

  if (error instanceof OrderError) {
    const details = (error.details as Record<string, unknown> | undefined) ?? {};
    res.status(error.status).json({ error: error.message, ...details });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, ...error.extra });
    return;
  }

  // pino-http attaches req.log — falls back to console.error if this ever runs outside
  // a request context (it never should, but keeps the handler safe either way).
  (req.log ?? console).error({ err: error }, "Unhandled error");
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
