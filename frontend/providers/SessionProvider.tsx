"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/jwt";

type SessionUser = { id: string; name: string; email: string; role: Role };
type Status = "loading" | "authenticated" | "unauthenticated";

const SessionContext = createContext<{ data: { user: SessionUser } | null; status: Status }>({
  data: null,
  status: "loading",
});

/** Replaces next-auth/react's SessionProvider — fetches the current session once on mount. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ data: { user: SessionUser } | null; status: Status }>({
    data: null,
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (cancelled) return;
        setState(
          data.user
            ? { data: { user: data.user }, status: "authenticated" }
            : { data: null, status: "unauthenticated" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, status: "unauthenticated" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

/** Same call shape as next-auth/react's useSession(): const { data: session } = useSession(); */
export function useSession() {
  return useContext(SessionContext);
}
