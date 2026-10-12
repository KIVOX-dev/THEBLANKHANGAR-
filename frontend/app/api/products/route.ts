import { proxyRequest } from "@/lib/api-proxy";

export async function GET(req: Request) {
  return proxyRequest(req, "/api/products");
}
