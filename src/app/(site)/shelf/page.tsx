import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import Shelf from "@/components/home/Shelf";
import { categoryCounts, shelfPicks } from "@/lib/posts";
import { categories, site } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The shelf: poems, stories and imagined worlds",
  description: `Six shelves of writing by ${site.author}: micro poetry, long stanzas, short stories, longer worlds, after hours and articles.`,
  alternates: { canonical: "/shelf" },
};

export default async function ShelfIndex() {
  const [counts, picks] = await Promise.all([categoryCounts(), shelfPicks()]);
  return (
    <div className="container-cpb pt-2 pb-20 sm:pt-6">
      <Breadcrumbs items={[{ href: "/shelf", label: "Shelf" }]} />
      <div className="mt-10">
        <Shelf counts={counts} picks={picks} headingLevel={1} />
      </div>
      <h2 className="sr-only">All shelves</h2>
      <ul className="m-0 mt-16 grid list-none gap-5 p-0 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/shelf/${c.id}`} className="wcard flex h-full flex-col gap-2 rounded-2xl p-6 no-underline" style={{ background: `var(--tint-${c.id})` }}>
              <span className="font-mono text-[22px] font-bold">{c.title}</span>
              <span className="text-[16px] text-body">{c.desc}</span>
              <span className="mt-auto pt-2 text-[14px] text-muted">{counts[c.id] || 0} {(counts[c.id] || 0) === 1 ? "piece" : "pieces"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
