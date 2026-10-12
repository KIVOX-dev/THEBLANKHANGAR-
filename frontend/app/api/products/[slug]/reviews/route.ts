import { proxyRequest } from "@/lib/api-proxy";

// No GET handler here: reviews are read server-side via lib/api-client.ts's
// getProductReviews(), which calls the backend directly — this route only proxies
// ReviewsSection's client-side POST. `slug` carries the product id.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return proxyRequest(req, `/api/products/${encodeURIComponent(slug)}/reviews`);
}
