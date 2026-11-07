import { publishDueArticles } from "@/lib/data/articles";
import { bearerAuthorised, fail, handleError, json } from "@/lib/api";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    if (!config.cronSecret) {
      return fail("CRON_SECRET is not configured on this deployment.", 503);
    }
    if (!bearerAuthorised(request, config.cronSecret)) {
      return fail("Unauthorised.", 401);
    }
    const result = await publishDueArticles();
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error, "cron/publish");
  }
}
