import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <div className="wrap max-w-2xl py-14 lg:py-20">
      <h1 className="text-4xl lg:text-5xl">Terms of Service</h1>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-ink-soft">
        <p>
          By placing an order with THE BLANK HANGAR, you agree to pay the listed price
          (inclusive of applicable taxes) plus any shipping charge shown at checkout.
        </p>
        <p>
          Product availability is not guaranteed until an order is confirmed. Prices and
          availability may change without notice.
        </p>
        <p>
          Returns and refunds are governed by our{" "}
          <a href="/returns" className="underline underline-offset-4">
            Shipping & Returns
          </a>{" "}
          policy.
        </p>
        <p>Questions about these terms can be sent to hello@theblankhangar.com.</p>
      </div>
    </div>
  );
}
