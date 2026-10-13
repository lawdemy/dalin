import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/queries/public";

// Social share preview for every page. Text only: signed photo URLs expire
// within the hour, while link previews are cached for much longer.
export const alt = "Our diary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [{ coupleNames, welcomeLine }, font] = await Promise.all([
    getSiteSettings(),
    readFile(join(process.cwd(), "assets/fonts/CormorantGaramond-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "#FBF8F3",
        color: "#2E2A27",
        fontFamily: "Cormorant Garamond",
        padding: 80,
        border: "16px solid #F3ECE2",
      }}
    >
      <div style={{ fontSize: 28, letterSpacing: 6, color: "#6E635A" }}>OUR DIARY</div>
      <div style={{ fontSize: 112, lineHeight: 1.05, textAlign: "center" }}>{coupleNames}</div>
      <div style={{ width: 96, height: 3, background: "#B9776B", borderRadius: 2 }} />
      <div style={{ fontSize: 36, color: "#4A433E", textAlign: "center", maxWidth: 900 }}>
        {welcomeLine || "Written together, one day at a time."}
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Cormorant Garamond", data: font, style: "normal", weight: 600 }],
    },
  );
}
