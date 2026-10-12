import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl">Create Account</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Faster checkout, order tracking and early access to drops.
      </p>

      <Suspense fallback={<div className="mt-8 h-80 animate-pulse bg-bone-deep" />}>
        <RegisterForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
