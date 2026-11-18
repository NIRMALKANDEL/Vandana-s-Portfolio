import { ogImage, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${site.name} — poems and stories by ${site.author}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogImage({ title: "Poems, stories and imagined worlds", eyebrow: `a living archive by ${site.author}`, footer: site.tagline });
}
