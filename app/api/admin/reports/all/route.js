import { listReports } from "@/lib/data/comments";
import { handleError, json, requireApiAdmin } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const reports = await listReports({ status: "all", limit: 100 });
    return json({ ok: true, reports });
  } catch (error) {
    return handleError(error, "admin/reports/all");
  }
}
