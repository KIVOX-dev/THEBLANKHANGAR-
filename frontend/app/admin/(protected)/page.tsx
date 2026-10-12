import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardData } from "@/lib/admin-api-client";
import { SalesChart } from "@/components/admin/SalesChart";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { kpis, salesSeries, recentOrders, lowStockVariants, lowStockThreshold } =
    await getDashboardData();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">Last 30 days at a glance.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Orders" value={String(kpis.totalOrders)} href="/admin/orders" />
        <StatCard label="Revenue" value={formatPrice(kpis.revenue)} hint="Paid orders only" />
        <StatCard
          label="Pending Orders"
          value={String(kpis.pendingOrders)}
          hint="Awaiting dispatch"
          href="/admin/orders?status=PLACED"
          tone={kpis.pendingOrders > 0 ? "olive" : undefined}
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(kpis.lowStockCount)}
          hint={`At or below ${lowStockThreshold}`}
          href="/admin/products"
          tone={kpis.lowStockCount > 0 ? "rust" : undefined}
        />
      </section>

      <section className="border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">Sales</h2>
          <p className="text-xs text-ink-muted">
            {kpis.liveProducts} live products · {kpis.customerCount} customers
          </p>
        </div>
        <SalesChart data={salesSeries} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-base">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs underline underline-offset-4 hover:text-olive">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bone/60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {order.user.name} · {formatDate(order.createdAt)} ·{" "}
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
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

        <section className="border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-base">Stock Alerts</h2>
            <Link href="/admin/products" className="text-xs underline underline-offset-4 hover:text-olive">
              Manage stock
            </Link>
          </div>

          {lowStockVariants.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">
              Every variant is comfortably in stock.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStockVariants.map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${variant.productId}`}
                      className="truncate text-sm hover:underline underline-offset-4"
                    >
                      {variant.productTitle}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Size {variant.size} · {variant.sku}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                      variant.isOut ? "bg-ink text-bone" : "bg-rust/15 text-rust"
                    }`}
                  >
                    {variant.isOut ? "Out of stock" : `${variant.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  href,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "olive" | "rust";
}) {
  const content = (
    <div className="border border-line bg-white p-5 transition-colors hover:border-ink">
      <p className="eyebrow text-ink-muted">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${
          tone === "rust" ? "text-rust" : tone === "olive" ? "text-olive-deep" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
