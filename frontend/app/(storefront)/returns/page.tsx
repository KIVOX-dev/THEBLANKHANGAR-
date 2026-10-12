import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Shipping timelines, return windows and refund policy for THE BLANK HANGAR.",
};

const SECTIONS = [
  {
    title: "Shipping",
    body: [
      "Orders are dispatched within 24–48 hours of confirmation, Monday to Saturday.",
      "Free shipping on orders above ₹1499. A flat shipping charge applies below that.",
      "Standard delivery takes 3–7 business days depending on location.",
    ],
  },
  {
    title: "Returns",
    body: [
      "Unworn items with tags intact can be returned within 7 days of delivery.",
      "Start a return from your Order Tracking page, or contact support with your order number.",
      "Innerwear, socks and sale items marked \"Final Sale\" are not eligible for return.",
    ],
  },
  {
    title: "Refunds",
    body: [
      "Once we receive and inspect the returned item, refunds are issued to the original payment method within 5–7 business days.",
      "For prepaid orders, the full amount is refunded. For COD orders, refunds are issued via bank transfer or store credit.",
    ],
  },
  {
    title: "Exchanges",
    body: [
      "Need a different size? Request an exchange from your Order Tracking page and we'll ship the new size once the original is picked up.",
    ],
  },
];

export default function ReturnsPage() {
  return (
    <div className="wrap max-w-2xl py-14 lg:py-20">
      <h1 className="text-4xl lg:text-5xl">Shipping & Returns</h1>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xl">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
              {section.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
