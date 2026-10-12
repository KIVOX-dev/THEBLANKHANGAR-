import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo href={null} width={200} tone="light" className="mx-auto" />
          <p className="eyebrow mt-4 text-bone/60">Admin Panel</p>
        </div>

        <div className="bg-bone p-7">
          <h1 className="text-xl">Staff Sign In</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Admin and staff accounts only.
          </p>

          <Suspense fallback={<div className="mt-8 h-56 animate-pulse bg-bone-deep" />}>
            <LoginForm adminMode />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
