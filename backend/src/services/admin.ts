import { prisma } from "@/db";
import { getSettings } from "@/services/settings";

/** KPI + chart data for the admin dashboard. */
export async function getDashboardData() {
  const settings = await getSettings();
  const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const [orders, recentOrders, lowStockVariants, customerCount, liveProducts] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: { notIn: ["CANCELLED", "RETURNED"] }, createdAt: { gte: since } },
        select: { total: true, status: true, createdAt: true, paymentStatus: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { id: true } },
        },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: settings.lowStockThreshold } },
        include: { product: { select: { title: true, slug: true, id: true } } },
        orderBy: { stock: "asc" },
        take: 12,
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { status: "LIVE" } }),
    ]);

  const revenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(
    (o) => o.status === "PLACED" || o.status === "CONFIRMED" || o.status === "PACKED",
  ).length;

  // 30-day sales series, zero-filled so the chart has no gaps.
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.orders += 1;
      if (order.paymentStatus === "PAID") bucket.revenue += order.total;
    }
  }

  const salesSeries = [...byDay.entries()].map(([date, value]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    revenue: Math.round(value.revenue),
    orders: value.orders,
  }));

  return {
    kpis: {
      totalOrders: orders.length,
      revenue: Math.round(revenue),
      pendingOrders,
      lowStockCount: lowStockVariants.length,
      customerCount,
      liveProducts,
    },
    salesSeries,
    recentOrders,
    lowStockVariants: lowStockVariants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      stock: v.stock,
      productId: v.product.id,
      productTitle: v.product.title,
      isOut: v.stock <= 0,
    })),
    lowStockThreshold: settings.lowStockThreshold,
  };
}
