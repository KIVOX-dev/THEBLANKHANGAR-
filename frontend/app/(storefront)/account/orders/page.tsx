import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listOrdersForUser } from "@/lib/api-client";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await requireUser();
  if (!user) return null;

  const orders = await listOrdersForUser();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed border-line py-16 text-center">
        <p className="text-lg">No orders yet</p>
        <p className="max-w-sm text-sm text-ink-muted">
          When you place an order, it&apos;ll show up here with live tracking.
        </p>
        <Link href="/collections/t-shirts" className="btn btn-primary mt-2">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl">Order History</h2>

      <ul className="mt-5 space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-sm font-medium">{order.orderNumber}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Placed {formatDate(order.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="flex gap-3 overflow-x-auto px-5 py-4 no-scrollbar">
              {order.items.map((item) => (
                <div key={item.id} className="flex shrink-0 items-center gap-3">
                  <div className="relative h-20 w-16 overflow-hidden bg-bone-deep">
                    {item.productImage && (
                      <Image
                        src={item.productImage}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="max-w-40 truncate font-medium">{item.productTitle}</p>
                    <p className="mt-0.5 text-ink-muted">
                      {item.variantSize} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <p className="text-sm">
                <span className="text-ink-muted">Total </span>
                <span className="font-semibold">{formatPrice(order.total)}</span>
              </p>
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="btn btn-outline px-5 py-2.5"
              >
                Track Order
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
