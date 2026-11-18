import type { MetadataRoute } from "next";
import { listPublicPosts } from "@/lib/posts";
import { SITE_URL, categories } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await listPublicPosts()).filter((p) => !p.sample);
  const latest = posts[0]?.updatedAt ? new Date(posts[0].updatedAt) : new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/journal`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/book`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/shelf`, lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    ...categories.map((c) => ({ url: `${SITE_URL}/shelf/${c.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
  return [
    ...fixed,
    ...posts.map((p) => ({ url: `${SITE_URL}/journal/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
