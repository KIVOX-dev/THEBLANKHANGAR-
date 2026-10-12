"use client";

import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-outline w-full">
      Sign Out
    </button>
  );
}
