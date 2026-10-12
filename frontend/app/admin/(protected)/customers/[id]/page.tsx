import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCustomer } from "@/lib/admin-api-client";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata: Metadata = {
  title: "Customer Detail",
  robots: { index: false, follow: false },
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getAdminCustomer(id);
  if (!result) notFound();
  const { customer, lifetimeSpend } = result;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        ← All customers
      </Link>

      <header>
        <h1 className="text-2xl">{customer.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Customer since {formatDate(customer.createdAt)}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={String(customer.orders.length)} />
        <StatCard label="Lifetime spend" value={formatPrice(lifetimeSpend)} />
        <StatCard label="Saved addresses" value={String(customer.addresses.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3.5 text-base">Order History</h2>
          {customer.orders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {customer.orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bone/60"
                  >
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatDate(order.createdAt)} · {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="border border-line bg-white px-5 py-4 text-sm">
            <h2 className="eyebrow mb-2 text-ink-muted">Contact</h2>
            <p>{customer.email}</p>
            {customer.phone && <p className="mt-1">{customer.phone}</p>}
          </div>

          {customer.addresses.map((address) => (
            <div key={address.id} className="border border-line bg-white px-5 py-4 text-sm">
              {address.isDefault && (
                <span className="mb-2 inline-block bg-bone-deep px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-muted">
                  Default
                </span>
              )}
              <p className="font-medium">{address.fullName}</p>
              <p className="mt-1 text-ink-soft">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </p>
              <p className="text-ink-soft">
                {address.city}, {address.state} {address.pincode}
              </p>
              <p className="mt-1 text-ink-muted">{address.phone}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-white p-5">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="eyebrow mt-1 text-ink-muted">{label}</p>
    </div>
  );
}
