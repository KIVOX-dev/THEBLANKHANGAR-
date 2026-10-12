"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not delete this product.");
        setConfirming(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Could not delete this product.");
    } finally {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button
            onClick={remove}
            disabled={deleting}
            className="btn bg-rust px-4 py-2 text-[10px] text-bone hover:bg-rust/85"
          >
            {deleting ? "Deleting…" : "Confirm Delete"}
          </button>
          <button onClick={() => setConfirming(false)} className="btn btn-outline px-4 py-2 text-[10px]">
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-rust">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-ink-muted underline underline-offset-4 hover:text-rust"
    >
      Delete product
    </button>
  );
}
