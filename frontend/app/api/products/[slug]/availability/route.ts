import { proxyRequest } from "@/lib/api-proxy";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return proxyRequest(req, `/api/products/${encodeURIComponent(slug)}/availability`);
}
