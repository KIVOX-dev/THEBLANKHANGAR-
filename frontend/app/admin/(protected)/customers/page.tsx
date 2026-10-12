import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCustomers } from "@/lib/admin-api-client";
import { formatDate } from "@/lib/utils";
import { CustomerSearch } from "@/components/admin/CustomerSearch";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { customers, total, page, pageCount } = await getAdminCustomers(sp);

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v !== undefined) as [string, string][],
    );
    params.set("page", String(target));
    return `/admin/customers?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Customers</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {total} {total === 1 ? "customer" : "customers"}
        </p>
      </header>

      <CustomerSearch />

      {customers.length === 0 ? (
        <div className="border border-dashed border-line py-16 text-center">
          <p className="text-sm text-ink-muted">No customers match this search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 eyebrow text-ink-muted">Name</th>
                <th className="px-4 py-3 eyebrow text-ink-muted">Email</th>
                <th className="px-4 py-3 eyebrow text-ink-muted">Phone</th>
                <th className="px-4 py-3 eyebrow text-ink-muted">Joined</th>
                <th className="px-4 py-3 eyebrow text-ink-muted">Orders</th>
                <th className="px-4 py-3 eyebrow text-ink-muted">Lifetime spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-bone/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium hover:underline underline-offset-4"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{customer.email}</td>
                  <td className="px-4 py-3 text-ink-soft">{customer.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-3 tabular-nums">{customer.orderCount}</td>
                  <td className="px-4 py-3 tabular-nums">
                    ₹{customer.lifetimeSpend.toLocaleString("en-IN")}
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
