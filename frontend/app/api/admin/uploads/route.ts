import { proxyUpload } from "@/lib/api-proxy";

export async function POST(req: Request) {
  return proxyUpload(req, "/api/admin/uploads");
}
