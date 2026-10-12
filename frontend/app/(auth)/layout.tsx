import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="wrap flex h-16 items-center justify-between">
          <Logo width={180} />
          <Link href="/" className="text-xs text-ink-muted underline underline-offset-4 hover:text-ink">
            Continue shopping
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
