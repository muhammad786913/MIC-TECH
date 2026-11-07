import { apiUser } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request) {
  const user = await apiUser(request);
  return Response.json({ ok: true, user }, { headers: { "Cache-Control": "no-store" } });
}
