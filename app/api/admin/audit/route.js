import { listAudit } from "@/lib/audit";
import { handleError, json, requireApiAdmin } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const params = new URL(request.url).searchParams;
    const items = await listAudit({
      limit: params.get("limit") || 50,
      skip: params.get("skip") || 0,
      action: params.get("action") || "",
    });
    return json({ ok: true, items });
  } catch (error) {
    return handleError(error, "admin/audit");
  }
}
