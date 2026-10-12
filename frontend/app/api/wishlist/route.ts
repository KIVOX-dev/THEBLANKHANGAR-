import { proxyRequest } from "@/lib/api-proxy";

export async function GET(req: Request) {
  return proxyRequest(req, "/api/wishlist");
}

export async function POST(req: Request) {
  return proxyRequest(req, "/api/wishlist");
}

export async function DELETE(req: Request) {
  return proxyRequest(req, "/api/wishlist");
}
