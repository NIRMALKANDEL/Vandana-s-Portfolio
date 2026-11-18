"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Post } from "@/lib/types";
import { LEGACY_CATEGORIES, categories } from "@/lib/site";
import { EmptyState, PostcardGrid } from "./Cards";

export default function JournalBrowser({ posts }: { posts: Post[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState<string>(() => { const s = params.get("shelf") || "all"; return LEGACY_CATEGORIES[s] || s; });

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter(
      (p) => (cat === "all" || p.category === cat) && (!needle || `${p.title} ${p.excerpt} ${p.body}`.toLowerCase().includes(needle)),
    );
  }, [posts, q, cat]);

  const setShelf = (c: string) => {
    setCat(c);
    const sp = new URLSearchParams(params.toString());
    if (c === "all") sp.delete("shelf");
    else sp.set("shelf", c);
    router.replace(`/journal${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
  };

  const chip = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={cat === id}
      onClick={() => setShelf(id)}
      className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full border px-4 font-mono text-[15px]"
      style={{
        background: cat === id ? (id === "all" ? "var(--btn)" : `var(--cat-${id})`) : "transparent",
        color: cat === id ? (id === "all" ? "var(--btn-text)" : "#2A2530") : "var(--ink)",
        borderColor: cat === id ? "transparent" : "var(--line)",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="mb-10 flex flex-col gap-5">
        <div className="field max-w-[420px]">
          <label htmlFor="journal-search">Search the journal</label>
          <input id="journal-search" type="search" className="input" placeholder="a word, a title, a feeling…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div role="group" aria-label="Filter by shelf" className="flex flex-wrap gap-2.5">
          {chip("all", "All")}
          {categories.map((c) => chip(c.id, c.title))}
        </div>
        <p className="m-0 text-[15px] text-muted" aria-live="polite">{shown.length} {shown.length === 1 ? "entry" : "entries"}</p>
      </div>
      {shown.length ? (
        <PostcardGrid posts={shown} />
      ) : (
        <EmptyState title={posts.length ? "Nothing matches that yet" : "The first postcard is being written"}>
          {posts.length ? "Try another word or shelf." : "New pages arrive here as soon as they're published."}
        </EmptyState>
      )}
    </>
  );
}
