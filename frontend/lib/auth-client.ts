"use client";

/** Client-side replacements for next-auth/react's signIn/signOut, same call shape. */

export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.error ?? "Sign in failed." };
  }

  return {};
}

export async function signOut(options?: { callbackUrl?: string }) {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = options?.callbackUrl ?? "/";
}
