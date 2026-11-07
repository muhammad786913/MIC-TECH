import { createReport } from "@/lib/data/comments";
import { guardMutation, handleError, json, limit, readJson, requireApiUser } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "report", { max: 6, windowMs: 60 * 60_000 });
    const user = await requireApiUser(request);
    const payload = await readJson(request);
    const report = await createReport({
      reporter: user,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      details: payload.details,
    });
    await writeAudit({
      actor: user,
      action: "report.create",
      targetType: payload.targetType || "content",
      targetId: String(payload.targetId || ""),
      summary: `Content report: ${payload.reason || "other"}`,
    });
    return json({ ok: true, report: { _id: report._id, status: report.status } }, 201);
  } catch (error) {
    return handleError(error, "reports");
  }
}
