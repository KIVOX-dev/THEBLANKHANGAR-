import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo width={200} href="/" />
      <div>
        <p className="eyebrow text-olive">404</p>
        <h1 className="mt-3 text-3xl lg:text-4xl">This hanger&apos;s empty</h1>
        <p className="mt-3 max-w-sm text-sm text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist, or has moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/" className="btn btn-primary">
          Back Home
        </Link>
        <Link href="/collections/t-shirts" className="btn btn-outline">
          Shop T-Shirts
        </Link>
      </div>
    </div>
  );
}
