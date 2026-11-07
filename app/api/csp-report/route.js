import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    // CSP violation reports are logged server-side. In production, forward to
    // your observability pipeline if desired.
    console.error("[csp-report]", JSON.stringify(body));
    return NextResponse.json({ ok: true }, { status: 204 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 204 });
  }
}

export function GET() {
  return new NextResponse(null, { status: 405 });
}
