import type { Prisma } from "@prisma/client";
import { prisma } from "@/db";
import { notFound } from "@/middleware/errorHandler";
import type { AdminCustomerQuery } from "@/validation/adminQuery";

const PAGE_SIZE = 25;

export async function listAdminCustomers(query: AdminCustomerQuery) {
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
        { phone: { contains: query.q, mode: "insensitive" } },
      ],
    }),
  };

  const page = query.page ?? 1;

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Aggregated in the database, scoped to just this page's customers, rather than
  // loading every order for every matching customer and reducing in JS.
  const spendByUser = customers.length
    ? await prisma.order.groupBy({
        by: ["userId"],
        where: { paymentStatus: "PAID", userId: { in: customers.map((c) => c.id) } },
        _sum: { total: true },
      })
    : [];

  const spendById = new Map(spendByUser.map((row) => [row.userId, row._sum.total ?? 0]));

  return {
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
      lifetimeSpend: spendById.get(c.id) ?? 0,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminCustomerDetail(id: string) {
  const [customer, spend] = await Promise.all([
    prisma.user.findUnique({
      where: { id, role: "CUSTOMER" },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: { select: { id: true } } },
        },
      },
    }),
    prisma.order.aggregate({
      where: { userId: id, paymentStatus: "PAID" },
      _sum: { total: true },
    }),
  ]);

  if (!customer) throw notFound("Customer");

  return { customer, lifetimeSpend: spend._sum.total ?? 0 };
}
