import { proxyRequest } from "@/lib/api-proxy";

// No GET handler here: order listing is read server-side via lib/api-client.ts's
// listOrdersForUser(), which calls the backend directly — this route only proxies
// CheckoutFlow's client-side POST.
export async function POST(req: Request) {
  return proxyRequest(req, "/api/orders");
}
