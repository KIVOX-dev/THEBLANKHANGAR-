import type { Metadata } from "next";
import { getSettings } from "@/lib/api-client";
import { ContactForm } from "@/components/misc/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with THE BLANK HANGAR support team.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="wrap max-w-2xl py-14 lg:py-20">
      <h1 className="text-4xl lg:text-5xl">Contact Us</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Questions about an order, a fit, or a return? We usually reply within one business day.
      </p>

      <div className="mt-6 grid gap-2 border border-line bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="eyebrow text-ink-muted">Email</p>
          <a href={`mailto:${settings.storeEmail}`} className="mt-1 block hover:underline underline-offset-4">
            {settings.storeEmail}
          </a>
        </div>
        <div>
          <p className="eyebrow text-ink-muted">Phone</p>
          <p className="mt-1">{settings.storePhone}</p>
        </div>
      </div>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
