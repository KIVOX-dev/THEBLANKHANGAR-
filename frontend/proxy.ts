import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/jwt";
import { SESSION_COOKIE } from "@/lib/session";

const STAFF_ROLES = new Set(["ADMIN", "STAFF"]);

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySession(token) : null;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (user && STAFF_ROLES.has(user.role)) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!user) {
      const to = new URL("/admin/login", req.url);
      to.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(to);
    }

    if (!STAFF_ROLES.has(user.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    if (!user) {
      const to = new URL("/login", req.url);
      to.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(to);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
