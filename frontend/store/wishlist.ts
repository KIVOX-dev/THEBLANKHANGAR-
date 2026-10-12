"use client";

import { create } from "zustand";

type WishlistState = {
  ids: string[];
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  reset: () => void;
};

/**
 * Server-backed wishlist (requires login). The store holds only the id set so
 * cards can render their saved state without each one hitting the API.
 */
export const useWishlist = create<WishlistState>((set, get) => ({
  ids: [],
  loaded: false,

  load: async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (!res.ok) {
        set({ loaded: true });
        return;
      }
      const data = await res.json();
      set({ ids: data.productIds ?? [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggle: async (productId) => {
    const saved = get().ids.includes(productId);

    // Optimistic — reverted if the request fails.
    set({
      ids: saved
        ? get().ids.filter((id) => id !== productId)
        : [...get().ids, productId],
    });

    try {
      const res = await fetch("/api/wishlist", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("wishlist request failed");
    } catch {
      set({
        ids: saved
          ? [...get().ids, productId]
          : get().ids.filter((id) => id !== productId),
      });
    }
  },

  reset: () => set({ ids: [], loaded: false }),
}));
