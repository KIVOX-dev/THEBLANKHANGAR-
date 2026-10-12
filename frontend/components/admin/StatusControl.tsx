"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/types/enums";
import { ORDER_FLOW, ORDER_STATUS_LABELS, TERMINAL_STATUSES } from "@/lib/constants";
import { IconSpinner } from "@/components/ui/Icons";

/**
 * Moves an order through its lifecycle. Every change writes an OrderStatusHistory
 * row server-side, which the customer's tracking timeline polls — so the customer
 * sees the update without any extra sync step.
 */
export function StatusControl({
  orderId,
  currentStatus,
  courierName,
  trackingNumber,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  courierName: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();

  const settled = TERMINAL_STATUSES.includes(currentStatus);
  const currentIndex = ORDER_FLOW.indexOf(currentStatus);
  const nextStatus = currentIndex >= 0 ? ORDER_FLOW[currentIndex + 1] : undefined;

  const [status, setStatus] = useState<OrderStatus>(nextStatus ?? currentStatus);
  const [note, setNote] = useState("");
  const [courier, setCourier] = useState(courierName ?? "");
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const needsCourier = status === "SHIPPED";

  // The backend only accepts the immediate next step in ORDER_FLOW (or a cancellation) —
  // offering only those here avoids the admin picking a skip-ahead/backward move that the
  // server would then reject. Returns are handled once an order is delivered and terminal,
  // not from this in-flight control.
  const options: OrderStatus[] = nextStatus ? [nextStatus, "CANCELLED"] : ["CANCELLED"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note || undefined,
          ...(needsCourier && { courierName: courier, trackingNumber: tracking }),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not update this order.");
        return;
      }

      setDone(true);
      setNote("");
      router.refresh();
    } catch {
      setError("Could not update this order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (settled) {
    return (
      <section className="border border-line bg-white px-5 py-4">
        <h2 className="eyebrow mb-2 text-ink-muted">Order status</h2>
        <p className="text-sm">
          This order is <strong>{ORDER_STATUS_LABELS[currentStatus].toLowerCase()}</strong> and
          can no longer be moved.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-line bg-white p-5">
      <h2 className="eyebrow mb-1 text-ink-muted">Update status</h2>
      <p className="mb-4 text-xs text-ink-muted">
        Currently {ORDER_STATUS_LABELS[currentStatus]}. Changes appear on the customer&apos;s
        tracking page automatically.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="status" className="label">
            Move to
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="field"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {ORDER_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {needsCourier && (
          <>
            <div>
              <label htmlFor="courier" className="label">
                Courier
              </label>
              <input
                id="courier"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                required
                placeholder="Delhivery"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="tracking" className="label">
                Tracking / AWB number
              </label>
              <input
                id="tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                required
                placeholder="DL2847193056IN"
                className="field"
              />
            </div>
          </>
        )}

        {status === "CANCELLED" && (
          <p className="border border-rust/40 bg-rust/10 px-3 py-2.5 text-xs text-rust">
            This will restock every item on the order and mark a paid order as refunded.
          </p>
        )}

        <div>
          <label htmlFor="note" className="label">
            Note (optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Shown to the customer on their tracking page"
            className="field resize-y"
          />
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}
        {done && <p className="text-sm text-olive-deep">Status updated.</p>}

        <button type="submit" disabled={saving} className="btn btn-primary w-full">
          {saving ? (
            <>
              <IconSpinner className="h-4 w-4" />
              Updating
            </>
          ) : (
            `Mark as ${ORDER_STATUS_LABELS[status]}`
          )}
        </button>
      </form>
    </section>
  );
}
