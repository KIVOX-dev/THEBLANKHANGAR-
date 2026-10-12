"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/admin/customers?${params.toString()}`);
  }

  return (
    <form onSubmit={apply} className="flex gap-2 border border-line bg-white p-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, email or phone"
        className="field"
      />
      <button type="submit" className="btn btn-primary px-6">
        Search
      </button>
    </form>
  );
}
