import { ogImage } from "@/lib/og";
import { getPublicPost } from "@/lib/posts";
import { categoryById, site } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Auto-generated social share image for each post: /og/<slug> (1200×630 PNG). */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  const cat = categoryById(post.category);
  return ogImage({
    title: post.title,
    eyebrow: `${cat?.singular.toLowerCase() || "a page"} by ${site.author}`,
    category: post.category,
    footer: post.publishAt ? formatDate(post.publishAt) : site.tagline,
  });
}
