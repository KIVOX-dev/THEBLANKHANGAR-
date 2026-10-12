import { prisma } from "@/db";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAt: string;
};

const DEFAULT_TAKE = 20;

export async function getProductReviews(
  productId: string,
  options: { skip?: number; take?: number } = {},
) {
  const take = options.take ?? DEFAULT_TAKE;
  const skip = options.skip ?? 0;

  const [rows, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { user: { select: { name: true } } },
    }),
    // Average/count computed in the database — no need to load every review just to reduce it in JS.
    prisma.review.aggregate({
      where: { productId },
      _count: true,
      _avg: { rating: true },
    }),
  ]);

  const items: ReviewItem[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.user.name,
    createdAt: r.createdAt.toISOString(),
  }));

  const count = aggregate._count;
  const average = count === 0 ? 0 : Math.round((aggregate._avg.rating ?? 0) * 10) / 10;

  return { items, count, average };
}
