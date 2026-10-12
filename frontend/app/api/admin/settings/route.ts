import { proxyRequest } from "@/lib/api-proxy";

export async function PATCH(req: Request) {
  return proxyRequest(req, "/api/admin/settings");
}
