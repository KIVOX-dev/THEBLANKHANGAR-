import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOrderForUser } from "@/lib/api-client";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata: Metadata = {
  title: "Track Order",
  robots: { index: false, follow: false },
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireUser();
  if (!user) return null;

  const { orderNumber } = await params;
  const order = await getOrderForUser(orderNumber);
  if (!order) notFound();

  return (
    <div>
      <Link
        href="/account/orders"
        className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-ink-muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
        <section className="border border-line bg-white p-6">
          <OrderTimeline
            orderNumber={order.orderNumber}
            initialStatus={order.status}
            initialHistory={order.statusHistory.map((h) => ({
              id: h.id,
              status: h.status,
              note: h.note,
              createdAt: h.createdAt,
            }))}
            initialCourier={order.courierName}
            initialTracking={order.trackingNumber}
            initialEta={order.estimatedDelivery}
          />
        </section>

        <aside className="space-y-6">
          <div className="border border-line bg-white">
            <h3 className="border-b border-line px-5 py-3.5 text-base">Items</h3>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-4">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="relative h-20 w-16 shrink-0 overflow-hidden bg-bone-deep"
                  >
                    {item.productImage && (
                      <Image
                        src={item.productImage}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="font-medium hover:underline underline-offset-4"
                    >
                      {item.productTitle}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted">
                      {item.variantSize}
                      {item.variantColor ? ` · ${item.variantColor}` : ""} · Qty {item.quantity}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatPrice(item.priceAtPurchase * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Row label="Discount" value={`− ${formatPrice(order.discount)}`} />
              )}
              <Row
                label="Shipping"
                value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              />
              <Row label="Tax" value={formatPrice(order.tax)} />
              <div className="flex justify-between border-t border-line pt-2.5 font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="border border-line bg-white px-5 py-4 text-sm">
            <p className="eyebrow mb-2 text-ink-muted">Delivery address</p>
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
          </div>

          <div className="border border-line bg-white px-5 py-4 text-sm">
            <p className="eyebrow mb-2 text-ink-muted">Payment</p>
            <p>
              {order.paymentMethod === "MOCK" ? "Test payment" : order.paymentMethod} ·{" "}
              <span className="capitalize">{order.paymentStatus.toLowerCase()}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
