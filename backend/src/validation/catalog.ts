import { z } from "zod";

/** Query contract shared by the collection page and the products API. */
export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  size: z.union([z.string(), z.array(z.string())]).optional(),
  color: z.union([z.string(), z.array(z.string())]).optional(),
  fit: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  fabric: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["new", "bestsellers", "price-asc", "price-desc", "featured"]).optional(),
  sale: z.enum(["0", "1"]).optional(),
  isNewArrival: z.enum(["0", "1"]).optional(),
  isBestseller: z.enum(["0", "1"]).optional(),
  excludeId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(48).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

/** Normalises repeated query params (?size=S&size=M) into arrays. */
export function parseProductQuery(searchParams: URLSearchParams | Record<string, string | string[] | undefined>) {
  const raw: Record<string, string | string[]> = {};

  if (searchParams instanceof URLSearchParams) {
    for (const key of new Set(searchParams.keys())) {
      const all = searchParams.getAll(key);
      raw[key] = all.length > 1 ? all : all[0];
    }
  } else {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) raw[key] = value;
    }
  }

  return productQuerySchema.parse(raw);
}

export const toArray = (value: string | string[] | undefined): string[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
