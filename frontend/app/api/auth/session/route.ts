import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** Backs the client-side useSession() hook. */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session });
}
