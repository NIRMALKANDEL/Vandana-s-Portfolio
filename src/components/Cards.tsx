import Link from "next/link";
import { Petal } from "./Flowers";
import type { Post } from "@/lib/types";
import { categoryById } from "@/lib/site";
import { formatDate, readingTime } from "@/lib/utils";

const ROT = [-2, 1.5, -1, 2];
const DY = [6, -4, 8, 0];

/** Journal design E: a postcard with a petal stamp in the shelf colour. */
export function Postcard({ post, i = 0 }: { post: Post; i?: number }) {
  const cat = categoryById(post.category);
  return (
    <Link
      href={`/journal/${post.slug}`}
      className="pc box-border flex min-h-[270px] flex-col gap-3.5 rounded-md border border-line bg-paper p-[18px] no-underline sm:min-h-[330px]"
      style={{ transform: `rotate(${ROT[i % 4]}deg) translateY(${DY[i % 4]}px)` }}
      data-testid="postcard"
    >
      <div className="flex items-start justify-end">
        <div className="flex h-[70px] w-[58px] items-center justify-center" style={{ background: `var(--cat-${post.category})`, border: "3px dotted var(--paper)", outline: "1px solid var(--line)" }} aria-hidden="true">
          <Petal size={34} fill="var(--paper)" />
        </div>
      </div>
      <h3 className="m-0 font-mono text-[21px] font-normal leading-[1.3]">{post.title}</h3>
      <div className="mt-auto flex flex-col gap-2.5">
        <div className="h-px bg-line" />
        <div className="h-px bg-line" />
        <span className="font-mono text-[13px] text-muted">
          {cat?.title} · <time dateTime={post.publishAt || undefined}>{formatDate(post.publishAt, { day: "numeric", month: "short" })}</time>
        </span>
      </div>
    </Link>
  );
}

export function PostcardGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="m-rail grid gap-6 px-1 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]">
      {posts.map((p, i) => (
        <Postcard key={p.id} post={p} i={i} />
      ))}
    </div>
  );
}

const TAG_TEXT: Record<string, string> = { "long-stanzas": "Poem" };

/** "Selected writing" card: rises 4px on hover and a petal appears in the corner. */
export function WorkCard({ post, cat }: { post: Post | null; cat: string }) {
  const c = categoryById(cat)!;
  if (!post) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-6 sm:gap-3.5 sm:p-7" data-testid="work-empty">
        <span className="tag" style={{ background: `var(--tint-${cat})` }}>{c.singular}</span>
        <span className="font-mono text-[22px] leading-[1.3]">A new {c.singular.toLowerCase()} is on its way</span>
        <span className="text-[16px] text-body">Nothing here yet. Check back soon, or read the journal meanwhile.</span>
        <Link href="/journal" className="link-arrow mt-auto">Open the journal →</Link>
      </div>
    );
  }
  const lines = c.verse ? post.body.split("\n").filter(Boolean).slice(0, 2) : null;
  return (
    <Link href={`/journal/${post.slug}`} className="wcard relative flex flex-col gap-3 rounded-2xl border border-card bg-surface p-6 no-underline sm:gap-3.5 sm:p-7">
      <Petal className="pt absolute right-5 top-5" fill={`var(--cat-${cat})`} />
      <span className="tag" style={{ background: `var(--tint-${cat})` }}>{TAG_TEXT[cat] || c.singular}</span>
      <h3 className="m-0 font-mono text-[22px] font-normal leading-[1.3]">{post.title}</h3>
      {lines ? (
        <span className="font-mono text-[16px] italic text-body">
          {lines[0]}
          <br />
          {lines[1]}…
        </span>
      ) : (
        <span className="text-[16px] text-body">{post.excerpt}</span>
      )}
      <span className="mt-auto font-medium">Read the {c.verse ? "poem" : c.singular.toLowerCase().replace("personal ", "")} →</span>
    </Link>
  );
}

/** List row used on shelf pages. */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link href={`/journal/${post.slug}`} className="wcard flex flex-col gap-2 rounded-2xl border border-card bg-surface p-6 no-underline" data-testid="post-row">
      <span className="font-mono text-[13px] text-muted">
        <time dateTime={post.publishAt || undefined}>{formatDate(post.publishAt)}</time> · {readingTime(post.body)} min read
      </span>
      <h3 className="m-0 font-mono text-[22px] font-normal leading-[1.3]">{post.title}</h3>
      <p className="m-0 text-[16px] text-body">{post.excerpt}</p>
    </Link>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center" data-testid="empty-state">
      <Petal size={40} center="var(--gold)" />
      <p className="m-0 font-mono text-[22px]">{title}</p>
      {children && <div className="max-w-[420px] text-body">{children}</div>}
    </div>
  );
}
