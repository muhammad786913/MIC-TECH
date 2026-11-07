import { listAdminComments } from "@/lib/data/comments";
import { handleError, json, requireApiAdmin } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const params = new URL(request.url).searchParams;
    const result = await listAdminComments({
      status: params.get("status") || "",
      page: params.get("page") || 1,
      limit: params.get("limit") || 25,
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error, "admin/comments/list");
  }
}
