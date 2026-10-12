"use client";

import { useEffect } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useWishlist } from "@/store/wishlist";

/** Hydrates the wishlist id set once a session exists; clears it on sign-out. */
export function WishlistSync() {
  const { status } = useSession();
  const { load, reset, loaded } = useWishlist();

  useEffect(() => {
    if (status === "authenticated" && !loaded) load();
    if (status === "unauthenticated" && loaded) reset();
  }, [status, loaded, load, reset]);

  return null;
}
