import { ImageResponse } from "next/og";

export const runtime = "edge";

const COLORS = {
  ink: "#151515",
  ivory: "#F5F2EA",
  gold: "#C5A24B",
  paper: "#FFFFFF",
};

function clean(value, fallback, max = 140) {
  const text = String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return (text || fallback).slice(0, max);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = clean(searchParams.get("title"), "News with precision and perspective");
  const section = clean(searchParams.get("section"), "MIC TECH", 40);
  const kicker = clean(searchParams.get("kicker"), "MIC TECH · PAKISTAN", 60);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLORS.ink,
          color: COLORS.ivory,
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: 2, color: COLORS.ivory }}>
              MIC
            </span>
            <span style={{ fontSize: 46, fontWeight: 400, letterSpacing: 4, color: COLORS.gold }}>
              TECH
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: COLORS.gold,
            }}
          >
            {kicker}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ width: 90, height: 3, background: COLORS.gold }} />
          <div style={{ fontSize: title.length > 80 ? 60 : 74, lineHeight: 1.08, fontWeight: 600 }}>
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${COLORS.gold}`,
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: COLORS.ivory }}>
            {section}
          </span>
          <span style={{ fontSize: 20, letterSpacing: 2, color: COLORS.gold }}>
            mictech.news
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
