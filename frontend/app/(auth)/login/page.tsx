import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl">Sign In</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Track orders, save addresses and keep a wishlist.
      </p>

      <Suspense fallback={<div className="mt-8 h-64 animate-pulse bg-bone-deep" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/register" className="text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
