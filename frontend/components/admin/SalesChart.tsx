"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";

export type SalesPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const hasRevenue = data.some((d) => d.revenue > 0);

  return (
    <div className="h-64 w-full">
      {!hasRevenue ? (
        <div className="grid h-full place-items-center text-sm text-ink-muted">
          No paid orders in the last 30 days yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6B6B47" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6B6B47" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#DDD8CE" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6f6f6f" }}
              tickLine={false}
              axisLine={{ stroke: "#DDD8CE" }}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6f6f6f" }}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #DDD8CE",
                borderRadius: 0,
                fontSize: 12,
                background: "#fff",
              }}
              formatter={(value, name) =>
                name === "revenue"
                  ? [formatPrice(Number(value)), "Revenue"]
                  : [String(value), "Orders"]
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6B6B47"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
