import { listUsers } from "@/lib/data/users";
import { handleError, json, requireApiAdmin } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const params = new URL(request.url).searchParams;
    const result = await listUsers({
      q: params.get("q") || "",
      page: params.get("page") || 1,
      limit: params.get("limit") || 20,
      role: params.get("role") || "",
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error, "admin/users/list");
  }
}
