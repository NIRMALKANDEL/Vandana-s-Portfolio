import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

const CAT: Record<string, [string, string]> = {
  "micro-poetry": ["#9DAF95", "#EEF2EA"],
  "long-stanzas": ["#C99A9A", "#FBEDEF"],
  "short-stories": ["#3F5A47", "#ECF2EE"],
  "longer-worlds": ["#7B3640", "#F7ECEE"],
  "after-hours": ["#C2A15E", "#FBF5E6"],
  articles: ["#A39383", "#F4F0EC"],
};

async function fonts() {
  const dir = join(process.cwd(), "assets");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "courier-prime-latin-400-normal.woff")),
    readFile(join(dir, "courier-prime-latin-700-normal.woff")),
  ]);
  return [
    { name: "Courier Prime", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Courier Prime", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

function Flower({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="13" cy="6" rx="4" ry="6" fill={color} transform={`rotate(${a} 13 13)`} />
      ))}
      <circle cx="13" cy="13" r="3" fill="#E8C878" />
    </svg>
  );
}

/** Social share card: paper background, a pressed flower in the shelf colour, the title in Courier Prime. */
export async function ogImage({ title, eyebrow, category, footer }: { title: string; eyebrow: string; category?: string; footer: string }) {
  const [stamp, tint] = CAT[category || "long-stanzas"] || CAT["long-stanzas"];
  const size = title.length > 60 ? 54 : title.length > 34 ? 64 : 76;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFFBF5", fontFamily: "Courier Prime", color: "#2E2A33", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
            <Flower size={44} color="#F2C6CC" />
            The Commonplace Book
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 26, color: "#6B6470" }}>{eyebrow}</div>
            <div style={{ fontSize: size, lineHeight: 1.12 }}>{title}</div>
          </div>
          <div style={{ fontSize: 24, color: "#6B6470" }}>{footer}</div>
        </div>
        <div style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: tint, borderRadius: 24, gap: 24 }}>
          <div style={{ width: 150, height: 180, background: stamp, border: "6px dashed #FFFDF8", boxShadow: "0 0 0 2px #E8DCCB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flower size={96} color="#FFFDF8" />
          </div>
          <div style={{ width: 150, height: 150, borderRadius: 999, border: "3px dashed #9C8F86", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#6B6470", transform: "rotate(-12deg)" }}>
            THE SKY
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
