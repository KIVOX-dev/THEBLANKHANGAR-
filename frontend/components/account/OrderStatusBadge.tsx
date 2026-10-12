import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/enums";

const TONE: Record<OrderStatus, string> = {
  PLACED: "bg-bone-deep text-ink",
  CONFIRMED: "bg-bone-deep text-ink",
  PACKED: "bg-olive/20 text-olive-deep",
  SHIPPED: "bg-olive/25 text-olive-deep",
  OUT_FOR_DELIVERY: "bg-olive/35 text-olive-deep",
  DELIVERED: "bg-olive text-bone",
  CANCELLED: "bg-rust/15 text-rust",
  RETURNED: "bg-rust/15 text-rust",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest",
        TONE[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
