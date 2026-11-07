import { listMedia, saveUpload } from "@/lib/media";
import { guardMutation, handleError, json, limit, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const params = new URL(request.url).searchParams;
    const result = await listMedia({
      page: params.get("page") || 1,
      type: params.get("type") || "",
      q: params.get("q") || "",
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error, "admin/media/list");
  }
}

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "admin-upload", { max: 30, windowMs: 10 * 60_000 });
    const admin = await requireApiAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    const media = await saveUpload({ file, user: admin });
    await writeAudit({
      actor: admin,
      action: "media.upload",
      targetType: "media",
      targetId: media._id,
      summary: `Uploaded ${media.originalName}`,
    });
    return json({ ok: true, media }, 201);
  } catch (error) {
    return handleError(error, "admin/media/upload");
  }
}
