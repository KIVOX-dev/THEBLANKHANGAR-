"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="border border-olive/60 bg-olive/15 px-3 py-2.5 text-sm text-bone">
        You&apos;re on the list. Watch your inbox.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setDone(true);
      }}
      className="flex"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="min-w-0 flex-1 border border-bone/30 bg-transparent px-3 py-2.5 text-sm text-bone outline-none placeholder:text-bone/45 focus:border-bone"
      />
      <button
        type="submit"
        className="shrink-0 bg-bone px-4 text-[11px] font-semibold uppercase tracking-widest text-ink transition-colors hover:bg-olive hover:text-bone"
      >
        Join
      </button>
    </form>
  );
}
