import { listPublicPosts } from "@/lib/posts";
import { SITE_URL, categoryById, site } from "@/lib/site";

export const revalidate = 3600;

const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function GET() {
  const posts = (await listPublicPosts()).filter((p) => !p.sample).slice(0, 50);
  const items = posts
    .map(
      (p) => `<item><title>${x(p.title)}</title><link>${SITE_URL}/journal/${p.slug}</link><guid>${SITE_URL}/journal/${p.slug}</guid><pubDate>${new Date(p.publishAt!).toUTCString()}</pubDate><category>${x(categoryById(p.category)?.title || "")}</category><description>${x(p.excerpt)}</description></item>`,
    )
    .join("");
  // The stylesheet turns the feed into a friendly "how to follow" page when opened in a browser;
  // feed reader apps ignore it. application/xml lets browsers apply it (readers accept it too).
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet href="/feed.xsl" type="text/xsl"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${x(site.name)}</title><link>${SITE_URL}</link><atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/><description>${x(site.description)}</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
