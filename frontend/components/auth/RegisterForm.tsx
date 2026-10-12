"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconSpinner } from "@/components/ui/Icons";

type FieldErrors = Record<string, string>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not create your account.");
        setFieldErrors(data.fieldErrors ?? {});
        setLoading(false);
        return;
      }

      // /api/auth/register already sets the session cookie, so no separate sign-in call is needed.
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Could not create your account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <Field
        id="name"
        label="Full name"
        value={form.name}
        onChange={set("name")}
        autoComplete="name"
        error={fieldErrors.name}
        placeholder="Arjun Mehta"
        required
      />
      <Field
        id="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={set("email")}
        autoComplete="email"
        error={fieldErrors.email}
        placeholder="you@example.com"
        required
      />
      <Field
        id="phone"
        label="Mobile (optional)"
        inputMode="numeric"
        value={form.phone}
        onChange={set("phone")}
        autoComplete="tel"
        error={fieldErrors.phone}
        placeholder="9812345678"
      />
      <Field
        id="password"
        label="Password"
        type="password"
        value={form.password}
        onChange={set("password")}
        autoComplete="new-password"
        error={fieldErrors.password}
        placeholder="At least 8 characters"
        required
      />

      {error && (
        <p role="alert" className="border border-rust/40 bg-rust/10 px-3 py-2.5 text-sm text-rust">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? (
          <>
            <IconSpinner className="h-4 w-4" />
            Creating account
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="field" aria-invalid={!!error} {...props} />
      {error && <p className="mt-1 text-xs text-rust">{error}</p>}
    </div>
  );
}
