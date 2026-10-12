"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  title: string;
  size: string;
  color: string | null;
  image: string | null;
  price: number;
  mrp: number;
  quantity: number;
  /** Snapshot of available stock at add-time; re-validated server-side at checkout. */
  maxStock: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeLine: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      addLine: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              isOpen: true,
              lines: state.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, ...line, quantity: Math.min(l.quantity + quantity, line.maxStock) }
                  : l,
              ),
            };
          }
          return {
            isOpen: true,
            lines: [...state.lines, { ...line, quantity: Math.min(quantity, line.maxStock) }],
          };
        }),

      removeLine: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.variantId !== variantId)
              : state.lines.map((l) =>
                  l.variantId === variantId
                    ? { ...l, quantity: Math.min(quantity, l.maxStock) }
                    : l,
                ),
        })),

      clear: () => set({ lines: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "bh-cart",
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.quantity, 0);

export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
