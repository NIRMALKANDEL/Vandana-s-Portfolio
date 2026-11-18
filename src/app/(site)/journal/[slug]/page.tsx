import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import PostBody from "@/components/PostBody";
import JsonLd from "@/components/JsonLd";
import { AsideFlower } from "@/components/Flowers";
import { ReadTracker, ReadingProgress, ShareBar } from "@/components/PostTools";
import { getPublicPost, listPublicPosts, neighbours, relatedTo } from "@/lib/posts";
import { SITE_URL, book, categoryById, site } from "@/lib/site";
import { formatDate, readingTime } from "@/lib/utils";
import { blogPostingSchema } from "@/lib/schema";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listPublicPosts()).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) return { title: "Page not found", robots: { index: false } };
  const cat = categoryById(post.category);
  const description = post.excerpt || `${cat?.singular} by ${site.author}.`;
  return {
    title: `${post.title} — a ${cat?.singular.toLowerCase()} by ${site.author}`,
    description,
    alternates: { canonical: `/journal/${post.slug}` },
    robots: post.sample ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/journal/${post.slug}`,
      publishedTime: post.publishAt || undefined,
      modifiedTime: post.updatedAt,
      authors: [site.author],
      section: cat?.title,
      images: [{ url: `/og/${post.slug}`, width: 1200, height: 630, alt: `${post.title} by ${site.author}` }],
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: [`/og/${post.slug}`] },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) notFound();
  const all = await listPublicPosts();
  const cat = categoryById(post.category)!;
  const related = relatedTo(post, all, 2);
  const { newer, older } = neighbours(post, all);
  const url = `${SITE_URL}/journal/${post.slug}`;
  const accent = post.category === "long-stanzas" ? "var(--crimson)" : `var(--cat-${post.category})`;

  return (
    <>
      <ReadingProgress color={accent} />
      <ReadTracker slug={post.slug} category={post.category} />
      <div className="container-cpb pt-2 pb-16 sm:pt-6">
        <Breadcrumbs items={[{ href: "/shelf", label: "Shelf" }, { href: `/shelf/${cat.id}`, label: cat.title }, { href: `/journal/${post.slug}`, label: post.title }]} />

        <div className="mt-10 flex flex-wrap gap-14 sm:mt-12">
          <article className="min-w-0 max-w-[680px] flex-[1_1_560px]" aria-labelledby="post-title">
            <span className="tag" style={{ background: `var(--tint-${cat.id})` }}>{cat.title}</span>
            <h1 id="post-title" className="mt-[18px] mb-2.5 font-mono text-[clamp(34px,6vw,56px)] font-normal leading-[1.1] [overflow-wrap:anywhere]">{post.title}</h1>
            <p className="m-0 text-[15px] text-muted">
              by {site.author} · <time dateTime={post.publishAt || undefined}>{formatDate(post.publishAt)}</time> · {readingTime(post.body)} min read
            </p>
            <div aria-hidden="true" className="mt-7 mb-10 h-[2px] w-16 origin-left" style={{ background: accent, animation: "fadein 900ms ease-out 200ms both" }} />
            {post.sample && (
              <p className="mb-8 rounded-xl border border-dashed border-line p-4 text-[15px] text-muted">Sample page shown until the database is connected.</p>
            )}
            <PostBody body={post.body} verse={cat.verse} />
            <div id="post-end" />
            <ShareBar url={url} title={post.title} />

            {(newer || older) && (
              <nav aria-label="More entries" className="mt-10 grid gap-4 sm:grid-cols-2">
                {older ? (
                  <Link href={`/journal/${older.slug}`} className="flex min-h-[44px] flex-col rounded-xl border border-line p-4 no-underline">
                    <span className="text-[13px] text-muted">← Previous</span>
                    <span className="font-mono">{older.title}</span>
                  </Link>
                ) : <span />}
                {newer && (
                  <Link href={`/journal/${newer.slug}`} className="flex min-h-[44px] flex-col rounded-xl border border-line p-4 text-right no-underline">
                    <span className="text-[13px] text-muted">Next →</span>
                    <span className="font-mono">{newer.title}</span>
                  </Link>
                )}
              </nav>
            )}
          </article>

          <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-7" aria-label="More from the shelf">
            <div className="hidden sm:block"><AsideFlower color={`var(--cat-${cat.id})`} /></div>
            <p className="eyebrow">keep reading</p>
            <Link href="/book" className="wcard flex flex-col gap-2 rounded-[14px] border border-card bg-surface p-5 no-underline">
              <span className="text-[13px] text-muted">From {book.title}</span>
              <span className="font-mono text-[18px] italic leading-[1.4]">{book.backPoem[0].replace(/,$/, "")}…</span>
            </Link>
            {related.map((r) => (
              <Link key={r.id} href={`/journal/${r.slug}`} className="wcard flex flex-col gap-2 rounded-[14px] border border-card bg-surface p-5 no-underline" data-testid="related">
                <span className="text-[13px] text-muted">{categoryById(r.category)?.title}</span>
                <span className="font-mono text-[18px] leading-[1.4]">{r.title}</span>
              </Link>
            ))}
            <Link href={`/shelf/${cat.id}`} className="link-arrow">Back to the {cat.title.toLowerCase()} shelf →</Link>
          </aside>
        </div>
      </div>
      <JsonLd data={blogPostingSchema(post, SITE_URL)} />
    </>
  );
}
