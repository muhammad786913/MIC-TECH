import { listReports, resolveReport } from "@/lib/data/comments";
import { guardMutation, handleError, json, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const params = new URL(request.url).searchParams;
    const reports = await listReports({
      status: params.get("status") || "open",
      limit: params.get("limit") || 50,
    });
    return json({ ok: true, reports });
  } catch (error) {
    return handleError(error, "admin/reports/list");
  }
}

export async function PATCH(request) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const payload = await readJson(request);
    const report = await resolveReport(payload.id, payload.status, admin);
    await writeAudit({
      actor: admin,
      action: "report.resolve",
      targetType: "report",
      targetId: String(payload.id || ""),
      summary: `Report marked ${payload.status}`,
    });
    return json({ ok: true, report });
  } catch (error) {
    return handleError(error, "admin/reports/resolve");
  }
}
