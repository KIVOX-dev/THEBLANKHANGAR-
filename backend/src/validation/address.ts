import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient's name").max(80),
  line1: z.string().trim().min(4, "Enter the flat / building / street").max(140),
  line2: z.string().trim().max(140).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city").max(60),
  state: z.string().trim().min(2, "Enter a state").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
