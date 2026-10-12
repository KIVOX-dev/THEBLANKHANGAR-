"use client";

import { useState } from "react";
import { IconSpinner } from "@/components/ui/Icons";
import type { AddressInput } from "@/types/address";

export type SavedAddress = AddressInput & { id: string; isDefault: boolean };

const EMPTY: AddressInput = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  isDefault: false,
};

export function AddressForm({
  initial,
  addressId,
  onSaved,
  onCancel,
}: {
  initial?: Partial<AddressInput>;
  addressId?: string;
  onSaved: (address: SavedAddress) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<AddressInput>({ ...EMPTY, ...initial });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof AddressInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch(addressId ? `/api/addresses/${addressId}` : "/api/addresses", {
        method: addressId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save this address.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      onSaved(data.address);
    } catch {
      setError("Could not save this address. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="fullName" label="Full name" value={form.fullName} onChange={set("fullName")} error={fieldErrors.fullName} required autoComplete="name" />
      <Field id="phone" label="Mobile number" value={form.phone} onChange={set("phone")} error={fieldErrors.phone} required inputMode="numeric" maxLength={10} autoComplete="tel" />
      <Field id="line1" label="Flat, building, street" value={form.line1} onChange={set("line1")} error={fieldErrors.line1} required autoComplete="address-line1" />
      <Field id="line2" label="Area, landmark (optional)" value={form.line2 ?? ""} onChange={set("line2")} error={fieldErrors.line2} autoComplete="address-line2" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="pincode" label="Pincode" value={form.pincode} onChange={set("pincode")} error={fieldErrors.pincode} required inputMode="numeric" maxLength={6} autoComplete="postal-code" />
        <Field id="city" label="City" value={form.city} onChange={set("city")} error={fieldErrors.city} required autoComplete="address-level2" />
        <Field id="state" label="State" value={form.state} onChange={set("state")} error={fieldErrors.state} required autoComplete="address-level1" />
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault ?? false}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="h-4 w-4 accent-ink"
        />
        Make this my default address
      </label>

      {error && (
        <p role="alert" className="border border-rust/40 bg-rust/10 px-3 py-2.5 text-sm text-rust">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? (
            <>
              <IconSpinner className="h-4 w-4" />
              Saving
            </>
          ) : (
            "Save Address"
          )}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="field" aria-invalid={!!error} {...props} />
      {error && <p className="mt-1 text-xs text-rust">{error}</p>}
    </div>
  );
}
