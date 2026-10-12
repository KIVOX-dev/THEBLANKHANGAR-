"use client";

import { useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="border border-olive/40 bg-olive/10 px-4 py-3 text-sm text-olive-deep">
        Thanks — we&apos;ve got your message and will reply by email shortly.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input id="name" required className="field" />
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" type="email" required className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="orderNumber" className="label">
          Order number (optional)
        </label>
        <input id="orderNumber" placeholder="BH..." className="field" />
      </div>
      <div>
        <label htmlFor="message" className="label">
          Message
        </label>
        <textarea id="message" required rows={5} className="field resize-y" />
      </div>
      <button type="submit" className="btn btn-primary">
        Send Message
      </button>
    </form>
  );
}
