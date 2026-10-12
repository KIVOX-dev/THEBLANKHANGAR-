import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@/db";
import { signSession } from "@/jwt";
import { loginSchema, registerSchema } from "@/validation/auth";
import { asyncRoute, HttpError } from "@/middleware/errorHandler";
import { rateLimit } from "@/middleware/rateLimit";
import { requireAuth } from "@/middleware/auth";
import { BCRYPT_COST } from "@/utils";

export const authRouter = Router();

authRouter.post(
  "/login",
  rateLimit(10, 60_000),
  asyncRoute(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new HttpError("That email and password combination didn't work.", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new HttpError("That email and password combination didn't work.", 401);

    const token = await signSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

authRouter.post(
  "/register",
  rateLimit(5, 60_000),
  asyncRoute(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError("An account with this email already exists.", 409);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        phone: body.phone || null,
        passwordHash: await bcrypt.hash(body.password, BCRYPT_COST),
        role: "CUSTOMER",
      },
    });

    const token = await signSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

// Not called by the frontend — it verifies its own session cookie locally (lib/session.ts)
// instead of round-tripping to the backend. Kept as public API surface: it's the standard
// "whoami" endpoint for any token-bearing API consumer (Postman/curl/a future mobile
// client) hitting this backend directly, and removing it would be a breaking change for
// no functional gain.
authRouter.get(
  "/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json({ user: req.user });
  }),
);
