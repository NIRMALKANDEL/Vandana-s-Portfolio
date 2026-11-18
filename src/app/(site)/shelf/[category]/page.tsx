import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EmptyState, PostRow } from "@/components/Cards";
import { Petal } from "@/components/Flowers";
import { postsByCategory } from "@/lib/posts";
import { categories, categoryById, site, type CategoryId } from "@/lib/site";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = categoryById(category);
  if (!c) return {};
  return {
    title: `${c.title} by ${site.author}`,
    description: `${c.desc} Read ${c.title.toLowerCase()} by ${site.author} on The Commonplace Book.`,
    alternates: { canonical: `/shelf/${c.id}` },
  };
}

export default async function ShelfPage({ params }: Props) {
  const { category } = await params;
  const c = categoryById(category);
  if (!c) notFound();
  const posts = await postsByCategory(c.id as CategoryId);
  const others = categories.filter((o) => o.id !== c.id);

  return (
    <div className="container-cpb pt-2 pb-20 sm:pt-6">
      <Breadcrumbs items={[{ href: "/shelf", label: "Shelf" }, { href: `/shelf/${c.id}`, label: c.title }]} />
      <header className="mt-10 mb-12 flex flex-wrap items-center gap-6 rounded-2xl p-7 sm:p-10" style={{ background: `var(--tint-${c.id})` }}>
        <div className="flex h-[110px] w-[48px] flex-none items-center justify-center rounded-[4px_4px_2px_2px]" style={{ background: `var(--cat-${c.id})` }} aria-hidden="true">
          <Petal size={22} fill="var(--paper)" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-1">one of my six shelves</p>
          <h1 className="h-section !text-[clamp(34px,5vw,48px)]">{c.title}</h1>
          <p className="mt-2 mb-0 max-w-[560px] text-body">{c.desc}</p>
        </div>
      </header>

      {posts.length ? (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]">
          {posts.map((p) => <PostRow key={p.id} post={p} />)}
        </div>
      ) : (
        <EmptyState title="Nothing on this shelf yet">
          The first {c.singular.toLowerCase()} is being written. Meanwhile, <Link href="/journal">browse the journal</Link>.
        </EmptyState>
      )}

      <nav aria-label="Other shelves" className="mt-16">
        <p className="eyebrow mb-4">wander to another shelf</p>
        <div className="flex flex-wrap gap-2.5">
          {others.map((o) => (
            <Link key={o.id} href={`/shelf/${o.id}`} className="inline-flex min-h-[44px] items-center rounded-full px-4 font-mono text-[15px] no-underline" style={{ background: `var(--cat-${o.id})`, color: "#2A2530" }}>
              {o.title}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
