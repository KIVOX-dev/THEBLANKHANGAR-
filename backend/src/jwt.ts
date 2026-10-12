import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";
import type { Role } from "@prisma/client";

export type SessionPayload = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const secret = new TextEncoder().encode(env.jwtSecret);

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.jwtExpiresIn)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
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
