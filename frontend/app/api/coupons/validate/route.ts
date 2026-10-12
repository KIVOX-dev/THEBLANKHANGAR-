import { proxyRequest } from "@/lib/api-proxy";

export async function POST(req: Request) {
  return proxyRequest(req, "/api/coupons/validate");
}
