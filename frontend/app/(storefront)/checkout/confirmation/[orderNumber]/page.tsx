import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOrderForUser } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { IconCheck } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { orderNumber } = await params;
  const order = await getOrderForUser(orderNumber);
  if (!order) notFound();

  return (
    <div className="wrap max-w-2xl py-14 lg:py-20">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-olive text-bone">
          <IconCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl lg:text-4xl">Order Confirmed</h1>
        <p className="mt-3 max-w-md text-sm text-ink-soft">
          Thanks, {order.shippingAddress.fullName.split(" ")[0]}. We&apos;ve got your order and
          you&apos;ll get a dispatch note as soon as it leaves the warehouse.
        </p>
        <p className="mt-5 border border-line bg-white px-4 py-2.5 text-sm">
          Order number <strong className="font-semibold">{order.orderNumber}</strong>
        </p>
      </div>

      <div className="mt-10 border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base">Order Summary</h2>
        </div>

        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 px-5 py-4 text-sm">
              <div>
                <p className="font-medium">{item.productTitle}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Size {item.variantSize}
                  {item.variantColor ? ` · ${item.variantColor}` : ""} · Qty {item.quantity}
                </p>
              </div>
              <p className="shrink-0 font-medium">
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2.5 border-t border-line px-5 py-4 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discount > 0 && (
            <Row label="Discount" value={`− ${formatPrice(order.discount)}`} />
          )}
          <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)} />
          <Row label="Tax" value={formatPrice(order.tax)} />
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>

        <div className="border-t border-line px-5 py-4 text-sm">
          <p className="eyebrow mb-2">Delivering to</p>
          <p className="font-medium">{order.shippingAddress.fullName}</p>
          <p className="mt-1 text-ink-soft">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`/account/orders/${order.orderNumber}`} className="btn btn-primary flex-1">
          Track Order
        </Link>
        <Link href="/collections/t-shirts" className="btn btn-outline flex-1">
          Continue Shopping
        </Link>
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
