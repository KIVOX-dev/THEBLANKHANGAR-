import { proxyRequest } from "@/lib/api-proxy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  return proxyRequest(req, `/api/orders/${encodeURIComponent(orderNumber)}/pay`);
}
