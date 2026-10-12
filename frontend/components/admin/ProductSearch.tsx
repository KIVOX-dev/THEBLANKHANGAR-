"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ProductSearch({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    router.push(`/admin/products?${params.toString()}`);
  }

  return (
    <form onSubmit={apply} className="grid gap-3 border border-line bg-white p-4 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <label htmlFor="pq" className="label">
          Search
        </label>
        <input
          id="pq"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Product title"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="pstatus" className="label">
          Status
        </label>
        <select id="pstatus" value={status} onChange={(e) => setStatus(e.target.value)} className="field">
          <option value="">All</option>
          <option value="LIVE">Live</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div>
        <label htmlFor="pcat" className="label">
          Category
        </label>
        <select id="pcat" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 sm:col-span-4">
        <button type="submit" className="btn btn-primary px-6 py-2.5">
          Apply
        </button>
        {(q || status || category) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setStatus("");
              setCategory("");
              router.push("/admin/products");
            }}
            className="btn btn-outline px-6 py-2.5"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
