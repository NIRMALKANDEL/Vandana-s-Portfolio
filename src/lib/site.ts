// Central site configuration. Edit text and links here; nothing else needs to change.

/** The site's public address. Set NEXT_PUBLIC_SITE_URL in production (https://thecommonplacebook.in). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const DOMAIN = "thecommonplacebook.in";

export const site = {
  name: "The Commonplace Book",
  tagline: "Writing is how we teach a fleeting moment to stay.",
  /** Her own words, shown at the top of /about. */
  bio: [
    "I write poetry and fiction with a simple goal: to capture life as it is, and to imagine it as it could be. I believe in the power of language to turn ordinary observations into something memorable and resonant.",
  ],
  author: "Vandana Basnet",
  authorFirst: "Vandana",
  description:
    "The Commonplace Book is the home of poet and storyteller Vandana Basnet: poems, stories and imagined worlds, and her debut collection Things I Told the Sky.",
  locale: "en_IN",
  // Optional public details. Leave empty to hide them on the site.
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  /** Where else to find her. Shown in the footer and contact section, and used for search engines (Schema.org sameAs). */
  profiles: [
    { label: "Substack", href: "https://substack.com/@vandanabasnet" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/vandana-basnet-341285450" },
  ],
  get sameAs(): string[] {
    const extra = (process.env.NEXT_PUBLIC_SAME_AS || "").split(",").map((s) => s.trim()).filter(Boolean);
    return [...new Set([...this.profiles.map((p) => p.href), ...extra])];
  },
  portrait: {
    // Replace public/images/vandana.jpg with a higher-resolution photo any time.
    // Keep a portrait (roughly 4:5) crop; the slot is sized for it.
    src: "/images/vandana.jpg",
    alt: "Vandana Basnet smiling on a beach",
  },
};

export const book = {
  title: "Things I Told the Sky",
  genre: "Poetry",
  publisher: "BookLeaf Publishing",
  published: "November 2025",
  datePublished: "2025-11",
  isbn: "9798898654665",
  buyUrl: "https://www.flipkart.com/things-told-sky/p/itmd3902c24b798e", // paperback
  ebookUrl: "https://ebooks.bookleafpub.com/product-page/things-i-told-the-sky",
  cover: { src: "/images/book-cover.jpg", alt: "Cover of Things I Told the Sky by Vandana Basnet" },
  backCover: { src: "/images/back-cover.jpg", alt: "Back cover of Things I Told the Sky, with a poem and the author's bio" },
  certificate: { src: "/images/publication-certificate.jpg", alt: "Certificate of publication from BookLeaf Publishing" },
  blurb:
    "My first collection, born out of everything I have lived, felt, and could not say aloud. Poems that hold on to moments, people, places and emotions, so they can live a little longer.",
  backPoem: [
    "I saw a flower,",
    "So lovely, so bright.",
    "When I looked closer,",
    "I saw thorns in the light.",

    "But I didn't turn away",
    "It was still beautiful",
    "Flaws and all",
    "Just like life.",
  ],
};

export type CategoryId = "micro-poetry" | "long-stanzas" | "short-stories" | "longer-worlds" | "after-hours" | "articles";

export type Category = {
  id: CategoryId;
  title: string;
  singular: string;
  desc: string;
  verse: boolean; // set in Courier with line breaks kept
  /** The book on the homepage shelf: muted cover colour, its text colour, gilt detail, size in px (desktop). */
  book: { cover: string; ink: string; gilt: string; width: number; height: number };
};

export const categories: Category[] = [
  {
    id: "micro-poetry", title: "Micro Poetry", singular: "Micro poem", verse: true,
    desc: "Distilled poetry—small verses that say a lot in a few lines.",
    book: { cover: "#9DAF95", ink: "#2B2D4A", gilt: "#4E6347", width: 50, height: 216 },
  },
  {
    id: "long-stanzas", title: "Long Stanzas", singular: "Poem", verse: true,
    desc: "Extended verse that takes its time to explore a thought.",
    book: { cover: "#C99A9A", ink: "#2B2D4A", gilt: "#8A5A5E", width: 66, height: 252 },
  },
  {
    id: "short-stories", title: "Short Stories", singular: "Short story", verse: false,
    desc: "Brief encounters and small lives, told through short fiction.",
    book: { cover: "#3F5A47", ink: "#F3EAD8", gilt: "#C2A15E", width: 54, height: 236 },
  },
  {
    id: "longer-worlds", title: "Longer Worlds", singular: "Story", verse: false,
    desc: "Long-form fiction—expansive stories and imagined worlds told across many chapters.",
    book: { cover: "#7B3640", ink: "#F3EAD8", gilt: "#C2A15E", width: 72, height: 264 },
  },
  {
    id: "after-hours", title: "After Hours", singular: "Late-night page", verse: false,
    desc: "Late-night notes, fragments, and short pieces written whenever inspiration strikes.",
    book: { cover: "#C2A15E", ink: "#2B2D4A", gilt: "#6E5528", width: 50, height: 226 },
  },
  {
    id: "articles", title: "Articles", singular: "Article", verse: false,
    desc: "Articles and essays: thoughts on writing, reading and the world around me.",
    book: { cover: "#A39383", ink: "#2B2D4A", gilt: "#5E5145", width: 56, height: 244 },
  },
];

/** Shelves from before the November 2026 rename, so older links and stored posts still land somewhere sensible. */
export const LEGACY_CATEGORIES: Record<string, CategoryId> = {
  poetry: "long-stanzas",
  microfiction: "micro-poetry",
  letters: "after-hours",
  essays: "articles",
  "book-notes": "after-hours",
};

/** Maps any stored category (new or old) to a current shelf. */
export const normalizeCategory = (id: string | undefined | null): CategoryId =>
  (categories.some((c) => c.id === id) ? id : LEGACY_CATEGORIES[id || ""] || "long-stanzas") as CategoryId;

export const categoryById = (id: string) => categories.find((c) => c.id === id);

export const nav = [
  { href: "/#shelf", label: "Shelf" },
  { href: "/#work", label: "Writing" },
  { href: "/book", label: "Book" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];
