import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

// Generated once at build time, then served as a plain file. Used for link previews in every language.
export const dynamic = "force-static";

export async function GET() {
  const font = await readFile(join(process.cwd(), "node_modules/@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#1c1814", border: "3px solid #c9a35b" }}>
      <div style={{ fontSize: 26, letterSpacing: 8, color: "#c9a35b", fontFamily: "Playfair" }}>BAR &amp; RESTAURANT</div>
      <div style={{ fontFamily: "Playfair", fontSize: 180, color: "#f5eee4", lineHeight: 1.1 }}>{brand.name}</div>
      <div style={{ fontSize: 30, color: "#c9a35b", fontFamily: "Playfair" }}>{`${brand.address.area} · ${brand.address.city}`}</div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: "Playfair", data: font, style: "normal", weight: 500 }] },
  );
}
