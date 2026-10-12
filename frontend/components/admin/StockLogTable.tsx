import { formatDateTime } from "@/lib/utils";

export type StockLogEntry = {
  id: string;
  delta: number;
  stockAfter: number;
  reason: string;
  source: string;
  size: string;
  sku: string;
  adminName: string | null;
  createdAt: string;
};

/** Audit trail: every manual edit and every order-driven deduction, in one place. */
export function StockLogTable({ entries }: { entries: StockLogEntry[] }) {
  return (
    <section className="border border-line bg-white">
      <h2 className="border-b border-line px-5 py-3.5 text-base">Stock Movement Log</h2>

      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">
          No stock movements recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-5 py-2.5 eyebrow text-ink-muted">When</th>
                <th className="px-5 py-2.5 eyebrow text-ink-muted">Size / SKU</th>
                <th className="px-5 py-2.5 eyebrow text-ink-muted">Change</th>
                <th className="px-5 py-2.5 eyebrow text-ink-muted">Reason</th>
                <th className="px-5 py-2.5 eyebrow text-ink-muted">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-5 py-2.5 text-xs text-ink-muted">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-5 py-2.5">
                    {entry.size} <span className="text-xs text-ink-muted">{entry.sku}</span>
                  </td>
                  <td className="px-5 py-2.5 tabular-nums">
                    <span className={entry.delta > 0 ? "text-olive-deep" : "text-rust"}>
                      {entry.delta > 0 ? "+" : ""}
                      {entry.delta}
                    </span>
                    <span className="ml-1.5 text-xs text-ink-muted">→ {entry.stockAfter}</span>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-ink-soft">{entry.reason}</td>
                  <td className="px-5 py-2.5 text-xs text-ink-muted">
                    {entry.adminName ?? "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
