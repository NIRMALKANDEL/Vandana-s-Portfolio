import type { Post } from "./types";

const day = (n: number) => new Date(Date.UTC(2026, 10, 17 - n, 4, 30)).toISOString();

/**
 * Starter content.
 * - "The Progeny of Shame" is Vandana's real, approved poem and is inserted by `npm run seed`.
 * - Everything marked `sample: true` is placeholder text so the layout can be seen before she writes.
 *   Samples are only shown when no database is configured, and are never written to MongoDB.
 */
export const seedPosts: Post[] = [
  {
    id: "seed-progeny-of-shame",
    slug: "the-progeny-of-shame",
    title: "The Progeny of Shame",
    category: "long-stanzas",
    excerpt: "I shall not hide the crimson / Nor fold my body's law…",
    featured: true,
    status: "published",
    publishAt: day(1),
    createdAt: day(1),
    updatedAt: day(1),
    body: `I shall not hide the crimson
Nor fold my body's law
What nature writes in scarlet ink
No shame shall dare withdraw

What blood is purer than the red
That bids a soul to be
What greater sin than calling shame
The root of humanity

What blood is purer than the red
That promises a life
How can you shame the sacred source
From which all souls arrive

And if this blood be sin
For giving life its start
Then let the world convict the womb
And find the accused in its own heart

If blood be shame, then tell me why
The world still draws its breath
Aren't we the progeny of shame
Yet shame the mother of flesh?`,
  },
  sample("sample-after-hours", "after-hours", "A page written after midnight", 2),
  sample("sample-longer-world", "longer-worlds", "The first chapter is being written", 3, true),
  sample("sample-story", "short-stories", "A short story is on its way", 4, true),
  sample("sample-micro", "micro-poetry", "A few small lines will live here", 5),
  sample("sample-article", "articles", "An article is being written", 6),
];

function sample(id: string, category: Post["category"], title: string, ago: number, featured = false): Post {
  return {
    id,
    slug: id,
    title,
    category,
    featured,
    sample: true,
    status: "published",
    publishAt: day(ago),
    createdAt: day(ago),
    updatedAt: day(ago),
    excerpt: "Sample page. Vandana will replace this from her writing desk.",
    body: `This is a sample page so you can see how a ${({ "short-stories": "short story", "longer-worlds": "longer story", "after-hours": "late-night page", articles: "article", "micro-poetry": "micro poem", "long-stanzas": "poem" } as Record<string, string>)[category]} looks on the site.

Once the database is connected, sample pages disappear and only what Vandana publishes from her writing desk at /desk is shown.

Each entry keeps its paragraphs, *italics* and line breaks exactly as she types them.`,
  };
}
