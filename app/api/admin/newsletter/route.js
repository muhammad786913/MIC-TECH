import { newsletterStats, subscribeNewsletter } from "@/lib/data/comments";
import { guardMutation, handleError, json, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    return json({ ok: true, stats: await newsletterStats() });
  } catch (error) {
    return handleError(error, "admin/newsletter");
  }
}

export async function POST(request) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const payload = await readJson(request);
    const result = await subscribeNewsletter(payload.email);
    await writeAudit({
      actor: admin,
      action: "newsletter.add",
      targetType: "newsletter",
      targetId: payload.email,
      summary: "Newsletter subscriber added manually",
    });
    return json({ ok: true, ...result, stats: await newsletterStats() });
  } catch (error) {
    return handleError(error, "admin/newsletter/add");
  }
}
