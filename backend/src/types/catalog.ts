/**
 * Shared DTOs crossing the server → client boundary. Client components import
 * these; they must never import from `src/server/**`.
 */

export type StockState = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  comingSoon: boolean;
  description: string | null;
};

export type ProductCardData = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  mrp: number;
  images: string[];
  fit: string | null;
  type: string | null;
  colors: { name: string; hex: string }[];
  totalStock: number;
  isLowStock: boolean;
  isSoldOut: boolean;
};

export type VariantData = {
  id: string;
  size: string;
  color: string | null;
  colorHex: string | null;
  sku: string;
  stock: number;
  price: number;
  state: StockState;
};

export type ProductDetailData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  fit: string | null;
  type: string | null;
  fabric: string | null;
  careInstructions: string | null;
  basePrice: number;
  mrp: number;
  images: string[];
  category: { name: string; slug: string };
  variants: VariantData[];
};
