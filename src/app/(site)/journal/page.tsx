import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import JournalBrowser from "@/components/JournalBrowser";
import { listPublicPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import JournalLoading from "./loading";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Journal — postcards from the week",
  description: `Every poem, story, letter and essay ${site.author} has published, newest first. Filter by shelf or search.`,
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  const posts = await listPublicPosts();
  return (
    <div className="overflow-x-clip">
      <div className="container-cpb pt-2 pb-20 sm:pt-6">
        <Breadcrumbs items={[{ href: "/journal", label: "Journal" }]} />
        <header className="mt-10 mb-10">
          <p className="eyebrow mb-2">notes from the writing desk</p>
          <h1 className="h-section !text-[clamp(34px,5vw,48px)]">Postcards from the week</h1>
          <p className="mt-3 max-w-[560px] text-body">Every page I&apos;ve put on the shelf, newest first. Some days a poem, some days a letter to the sky.</p>
        </header>
        <Suspense fallback={<JournalLoading inline />}>
          <JournalBrowser posts={posts} />
        </Suspense>
      </div>
    </div>
  );
}
