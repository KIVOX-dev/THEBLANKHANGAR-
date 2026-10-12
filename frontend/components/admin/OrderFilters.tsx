"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/admin/orders?${params.toString()}`);
  }

  function reset() {
    setQ("");
    setStatus("");
    setFrom("");
    setTo("");
    router.push("/admin/orders");
  }

  const hasFilters = q || status || from || to;

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="lg:col-span-2">
        <label htmlFor="q" className="label">
          Search
        </label>
        <input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Order number, customer name or email"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="status" className="label">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field"
        >
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="from" className="label">
          From
        </label>
        <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
      </div>

      <div>
        <label htmlFor="to" className="label">
          To
        </label>
        <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
      </div>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
        <button type="submit" className="btn btn-primary px-6 py-2.5">
          Apply
        </button>
        {hasFilters && (
          <button type="button" onClick={reset} className="btn btn-outline px-6 py-2.5">
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
