import { proxyRequest } from "@/lib/api-proxy";

/** Polled by the customer tracking page so admin status changes appear without a reload. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  return proxyRequest(req, `/api/orders/${encodeURIComponent(orderNumber)}`);
}
