/** Mirrors the backend's addressSchema shape (zod lives backend-side; this is type-only). */
export type AddressInput = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
};
