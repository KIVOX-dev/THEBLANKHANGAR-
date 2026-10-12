import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOrders } from "@/lib/admin-api-client";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderFilters } from "@/components/admin/OrderFilters";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { orders, total, page, pageCount } = await getAdminOrders(sp);

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v !== undefined) as [string, string][],
    );
    params.set("page", String(target));
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Orders</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {total} {total === 1 ? "order" : "orders"}
          </p>
        </div>
      </header>

      <OrderFilters />

      {orders.length === 0 ? (
        <div className="border border-dashed border-line py-16 text-center">
          <p className="text-sm text-ink-muted">No orders match these filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-4xl text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-bone/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium hover:underline underline-offset-4"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.user.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {order.items.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        order.paymentStatus === "PAID"
                          ? "text-olive-deep"
                          : order.paymentStatus === "FAILED"
                            ? "text-rust"
                            : "text-ink-muted"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildPageHref(page - 1)} className="btn btn-outline px-4 py-2">
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link href={buildPageHref(page + 1)} className="btn btn-outline px-4 py-2">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 eyebrow text-ink-muted font-semibold">{children}</th>;
}
