import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/backend";
import { SESSION_COOKIE } from "@/lib/session";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const res = await backendFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEVEN_DAYS,
  });

  return NextResponse.json({ user: data.user });
}
