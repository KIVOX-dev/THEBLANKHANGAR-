import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getAccountOverview } from "@/lib/api-client";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { SignOutButton } from "@/components/account/SignOutButton";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const user = await requireUser();
  if (!user) return null;

  const { profile, orders, addressCount, wishlistCount } = await getAccountOverview();

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl">Profile</h2>
        <dl className="mt-4 grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
          <div>
            <dt className="eyebrow text-ink-muted">Name</dt>
            <dd className="mt-1 text-sm">{profile?.name}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-muted">Email</dt>
            <dd className="mt-1 text-sm">{profile?.email}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-muted">Mobile</dt>
            <dd className="mt-1 text-sm">{profile?.phone ?? "Not added"}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-muted">Member since</dt>
            <dd className="mt-1 text-sm">
              {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={orders.length} href="/account/orders" />
        <StatCard label="Saved addresses" value={addressCount} href="/account/addresses" />
        <StatCard label="Wishlist items" value={wishlistCount} href="/account/wishlist" />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm underline underline-offset-4 hover:text-olive">
            View all
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-line py-12 text-center">
            <p className="text-sm text-ink-muted">You haven&apos;t placed an order yet.</p>
            <Link href="/collections/t-shirts" className="btn btn-primary mt-1">
              Start Shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 border border-line bg-white p-4 transition-colors hover:border-ink"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatDate(order.createdAt)} ·{" "}
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-bone-deep px-2.5 py-1 text-[10px] uppercase tracking-widest">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="lg:hidden">
        <SignOutButton />
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="border border-line bg-white p-5 transition-colors hover:border-ink"
    >
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="eyebrow mt-1 text-ink-muted">{label}</p>
    </Link>
  );
}
