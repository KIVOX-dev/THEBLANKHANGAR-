"use client";

import { useMemo } from "react";
import { usePolling } from "@/hooks/usePolling";
import {
  ORDER_FLOW,
  ORDER_STATUS_COPY,
  ORDER_STATUS_LABELS,
  POLL_INTERVAL_MS,
  TERMINAL_STATUSES,
} from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { IconCheck } from "@/components/ui/Icons";
import type { OrderStatus } from "@/types/enums";

export type TimelineEntry = {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
};

type LivePayload = {
  order: {
    status: OrderStatus;
    paymentStatus: string;
    courierName: string | null;
    trackingNumber: string | null;
    estimatedDelivery: string | null;
    statusHistory: TimelineEntry[];
  };
};

/**
 * Reads OrderStatusHistory — the same table the admin status control writes to —
 * and re-polls it, so an admin status change appears here without a page reload.
 */
export function OrderTimeline({
  orderNumber,
  initialStatus,
  initialHistory,
  initialCourier,
  initialTracking,
  initialEta,
}: {
  orderNumber: string;
  initialStatus: OrderStatus;
  initialHistory: TimelineEntry[];
  initialCourier: string | null;
  initialTracking: string | null;
  initialEta: string | null;
}) {
  const isSettled = TERMINAL_STATUSES.includes(initialStatus);

  const { data } = usePolling<LivePayload>(
    `/api/orders/${orderNumber}`,
    POLL_INTERVAL_MS,
    // Stop polling once the order can no longer change.
    { enabled: !isSettled },
  );

  const live = data?.order;
  const status = live?.status ?? initialStatus;
  const history = live?.statusHistory ?? initialHistory;
  const courier = live?.courierName ?? initialCourier;
  const tracking = live?.trackingNumber ?? initialTracking;
  const eta = live?.estimatedDelivery ?? initialEta;

  const reachedAt = useMemo(() => {
    const map = new Map<OrderStatus, string>();
    for (const entry of history) {
      if (!map.has(entry.status)) map.set(entry.status, entry.createdAt);
    }
    return map;
  }, [history]);

  const cancelled = status === "CANCELLED" || status === "RETURNED";
  const currentIndex = ORDER_FLOW.indexOf(status);

  const steps = cancelled
    ? history.map((h) => ({
        status: h.status,
        note: h.note,
        at: h.createdAt,
        done: true,
        current: h.status === status,
      }))
    : ORDER_FLOW.map((flowStatus, i) => {
        const at = reachedAt.get(flowStatus);
        return {
          status: flowStatus,
          note: history.find((h) => h.status === flowStatus)?.note ?? null,
          at: at ?? null,
          done: i <= currentIndex,
          current: i === currentIndex,
        };
      });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-ink-muted">Current status</p>
          <p className="mt-1 text-lg font-medium">{ORDER_STATUS_LABELS[status]}</p>
          <p className="mt-0.5 text-sm text-ink-muted">{ORDER_STATUS_COPY[status]}</p>
        </div>

        {!cancelled && eta && status !== "DELIVERED" && (
          <div className="text-right">
            <p className="eyebrow text-ink-muted">Estimated delivery</p>
            <p className="mt-1 text-sm font-medium">
              {new Date(eta).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        )}
      </div>

      {tracking && (
        <div className="mb-6 border border-line bg-white px-4 py-3 text-sm">
          <p className="eyebrow text-ink-muted">Tracking</p>
          <p className="mt-1.5">
            <span className="font-medium">{courier ?? "Courier"}</span>
            <span className="mx-2 text-line">|</span>
            <span className="tabular-nums">{tracking}</span>
          </p>
          {courier && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${courier} tracking ${tracking}`)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1.5 inline-block text-xs underline underline-offset-4 hover:text-olive"
            >
              Track with {courier} →
            </a>
          )}
        </div>
      )}

      <ol className="relative">
        {steps.map((step, i) => (
          <li key={`${step.status}-${i}`} className="relative flex gap-4 pb-8 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-3.5 top-8 h-full w-px",
                  step.done && steps[i + 1].done ? "bg-olive" : "bg-line",
                )}
              />
            )}

            <span
              className={cn(
                "relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
                step.status === "CANCELLED" || step.status === "RETURNED"
                  ? "border-rust bg-rust text-bone"
                  : step.done
                    ? "border-olive bg-olive text-bone"
                    : "border-line bg-bone",
              )}
            >
              {step.done && <IconCheck className="h-3.5 w-3.5" />}
            </span>

            <div className={cn("pt-0.5", !step.done && "opacity-50")}>
              <p className={cn("text-sm", step.current ? "font-semibold" : "font-medium")}>
                {ORDER_STATUS_LABELS[step.status]}
              </p>
              {step.at && (
                <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(step.at)}</p>
              )}
              {step.note && <p className="mt-1 text-xs text-ink-soft">{step.note}</p>}
            </div>
          </li>
        ))}
      </ol>

      {!isSettled && (
        <p className="mt-4 text-[11px] text-ink-muted">
          This page updates automatically as your order moves.
        </p>
      )}
    </div>
  );
}
