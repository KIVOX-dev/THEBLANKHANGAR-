import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/admin-api-client";
import { assetUrl } from "@/lib/assets";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { StatusControl } from "@/components/admin/StatusControl";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        ← All orders
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">Payment: {order.paymentStatus}</span>
          <OrderStatusBadge status={order.status} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3.5 text-base">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-bone-deep">
                    {item.productImage && (
                      <Image
                        src={assetUrl(item.productImage)}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link
                      href={`/products/${item.productSlug}`}
                      target="_blank"
                      className="font-medium hover:underline underline-offset-4"
                    >
                      {item.productTitle}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted">
                      Size {item.variantSize}
                      {item.variantColor ? ` · ${item.variantColor}` : ""} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatPrice(item.priceAtPurchase * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Row
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                  value={`− ${formatPrice(order.discount)}`}
                />
              )}
              <Row
                label="Shipping"
                value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              />
              <Row label="Tax" value={formatPrice(order.tax)} />
              <div className="flex justify-between border-t border-line pt-2.5 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3.5 text-base">Status History</h2>
            <ul className="divide-y divide-line">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="px-5 py-3.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{ORDER_STATUS_LABELS[entry.status]}</span>
                    <span className="text-xs text-ink-muted">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  {entry.note && <p className="mt-1 text-xs text-ink-soft">{entry.note}</p>}
                  <p className="mt-1 text-xs text-ink-muted">
                    {entry.changedByAdmin?.name ?? "System"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <StatusControl
            orderId={order.id}
            currentStatus={order.status}
            courierName={order.courierName}
            trackingNumber={order.trackingNumber}
          />

          <section className="border border-line bg-white px-5 py-4 text-sm">
            <h2 className="eyebrow mb-3 text-ink-muted">Customer</h2>
            <p className="font-medium">{order.user.name}</p>
            <p className="mt-1 text-ink-soft">{order.user.email}</p>
            {order.user.phone && <p className="text-ink-soft">{order.user.phone}</p>}
            <Link
              href={`/admin/customers/${order.user.id}`}
              className="mt-3 inline-block text-xs underline underline-offset-4 hover:text-olive"
            >
              View customer →
            </Link>
          </section>

          <section className="border border-line bg-white px-5 py-4 text-sm">
            <h2 className="eyebrow mb-3 text-ink-muted">Shipping address</h2>
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p className="mt-1 text-ink-soft">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            </p>
            <p className="text-ink-soft">
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
            </p>
            <p className="mt-1 text-ink-muted">{order.shippingAddress.phone}</p>
          </section>

          <section className="border border-line bg-white px-5 py-4 text-sm">
            <h2 className="eyebrow mb-3 text-ink-muted">Payment</h2>
            <p>Method: {order.paymentMethod}</p>
            <p className="mt-1">Status: {order.paymentStatus}</p>
            {order.paymentReference && (
              <p className="mt-1 break-all text-xs text-ink-muted">
                Ref: {order.paymentReference}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
