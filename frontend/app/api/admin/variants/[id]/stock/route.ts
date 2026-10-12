import { proxyRequest } from "@/lib/api-proxy";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(req, `/api/admin/variants/${encodeURIComponent(id)}/stock`);
}
