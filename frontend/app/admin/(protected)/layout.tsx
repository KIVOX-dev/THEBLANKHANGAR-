import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * Second line of defence. `proxy.ts` already blocks non-staff before the
 * request reaches here — this re-checks server-side so the pages can never render
 * for a non-staff session even if the matcher changes.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell userName={user.name} role={user.role}>
      {children}
    </AdminShell>
  );
}
