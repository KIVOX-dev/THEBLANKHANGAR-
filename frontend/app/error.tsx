"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo width={200} href="/" />
      <div>
        <p className="eyebrow text-rust">Something tore</p>
        <h1 className="mt-3 text-3xl lg:text-4xl">Something went wrong</h1>
        <p className="mt-3 max-w-sm text-sm text-ink-muted">
          We hit an unexpected error. Try again, or head back home.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className="btn btn-primary">
          Try Again
        </button>
        <Link href="/" className="btn btn-outline">
          Back Home
        </Link>
      </div>
    </div>
  );
}
