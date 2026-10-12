"use client";

import { useState } from "react";
import { AddressForm, type SavedAddress } from "@/components/checkout/AddressForm";

export function AddressBook({ initialAddresses }: { initialAddresses: SavedAddress[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function upsert(saved: SavedAddress) {
    setAddresses((prev) => {
      const cleared = saved.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      const exists = cleared.some((a) => a.id === saved.id);
      const next = exists
        ? cleared.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...cleared];
      return [...next].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    });
    setEditing(null);
    setAdding(false);
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mt-5">
      {!adding && !editing && (
        <button onClick={() => setAdding(true)} className="btn btn-primary mb-5">
          + Add New Address
        </button>
      )}

      {adding && (
        <div className="mb-6 border border-line bg-white p-5">
          <h3 className="mb-4 text-base">New Address</h3>
          <AddressForm onSaved={upsert} onCancel={() => setAdding(false)} />
        </div>
      )}

      {addresses.length === 0 && !adding ? (
        <div className="border border-dashed border-line py-12 text-center">
          <p className="text-sm text-ink-muted">
            No saved addresses yet. Add one for faster checkout.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) =>
            editing === address.id ? (
              <li key={address.id} className="border border-ink bg-white p-5 sm:col-span-2">
                <h3 className="mb-4 text-base">Edit Address</h3>
                <AddressForm
                  addressId={address.id}
                  initial={address}
                  onSaved={upsert}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={address.id} className="flex flex-col border border-line bg-white p-5">
                {address.isDefault && (
                  <span className="mb-2 self-start bg-bone-deep px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-muted">
                    Default
                  </span>
                )}
                <p className="text-sm font-medium">{address.fullName}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </p>
                <p className="text-sm text-ink-soft">
                  {address.city}, {address.state} {address.pincode}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{address.phone}</p>

                <div className="mt-4 flex gap-4 pt-2 text-xs uppercase tracking-widest">
                  <button
                    onClick={() => setEditing(address.id)}
                    className="text-ink-muted hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(address.id)}
                    disabled={deleting === address.id}
                    className="text-ink-muted hover:text-rust disabled:opacity-50"
                  >
                    {deleting === address.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
