import { z } from "zod";

export const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1, "Size is required").max(12),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour")
    .optional()
    .or(z.literal("")),
  sku: z.string().trim().min(1, "SKU is required").max(60),
  stock: z.coerce.number().int().min(0).max(100000),
  priceOverride: z.coerce.number().min(0).max(1000000).optional().nullable(),
});

export const productSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens")
    .max(160),
  description: z.string().trim().min(10, "Add a description").max(4000),
  categoryId: z.string().min(1, "Choose a category"),
  fit: z.string().trim().max(40).optional().or(z.literal("")),
  type: z.string().trim().max(40).optional().or(z.literal("")),
  fabric: z.string().trim().max(200).optional().or(z.literal("")),
  careInstructions: z.string().trim().max(600).optional().or(z.literal("")),
  basePrice: z.coerce.number().min(1, "Price must be greater than zero").max(1000000),
  mrp: z.coerce.number().min(1).max(1000000),
  images: z.array(z.string().trim().min(1)).min(1, "Add at least one image"),
  status: z.enum(["DRAFT", "LIVE", "ARCHIVED"]),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  variants: z.array(variantSchema).min(1, "Add at least one size"),
});

export const stockUpdateSchema = z.object({
  stock: z.coerce.number().int().min(0).max(100000),
  reason: z.string().trim().max(140).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
