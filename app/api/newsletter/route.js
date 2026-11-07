import { subscribeNewsletter } from "@/lib/data/comments";
import { guardMutation, handleError, json, limit, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "newsletter", { max: 6, windowMs: 60 * 60_000 });
    const payload = await readJson(request);
    const result = await subscribeNewsletter(payload.email);
    return json({
      ok: true,
      already: Boolean(result.already),
      message: result.already
        ? "You are already on the briefing list."
        : "You are subscribed. Look out for the next briefing.",
    });
  } catch (error) {
    return handleError(error, "newsletter");
  }
}
