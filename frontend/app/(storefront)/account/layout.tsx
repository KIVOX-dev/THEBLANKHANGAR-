import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=/account");

  return (
    <div className="wrap py-10 lg:py-14">
      <header className="mb-8">
        <h1 className="text-3xl lg:text-4xl">My Account</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Signed in as {user.email}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
        <AccountNav isStaff={user.role === "ADMIN" || user.role === "STAFF"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
