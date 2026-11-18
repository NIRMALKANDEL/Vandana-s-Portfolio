import "server-only";
import { ObjectId } from "mongodb";
import { getDb, hasDb } from "./mongo";
import { seedPosts } from "./seed";
import type { Post, PostInput } from "./types";
import { makeExcerpt, readingTime, slugify } from "./utils";
import { categories as categoryList, categoryById, normalizeCategory, type CategoryId } from "./site";

/* ------------------------------------------------------------------ */
/* Storage: MongoDB when MONGODB_URI is set, otherwise an in-memory    */
/* store seeded with sample content (local preview and tests).         */
/* ------------------------------------------------------------------ */

type Mem = typeof globalThis & { _cpbPosts?: Map<string, Post> };
function mem() {
  const g = globalThis as Mem;
  if (!g._cpbPosts) g._cpbPosts = new Map(seedPosts.map((p) => [p.id, { ...p }]));
  return g._cpbPosts;
}

type Doc = Omit<Post, "id"> & { _id: ObjectId };
const toPost = (d: Doc): Post => {
  const { _id, ...rest } = d;
  return { ...rest, category: normalizeCategory(rest.category), id: _id.toString() };
};
async function col() {
  return (await getDb()).collection<Doc>("posts");
}

export const usingSampleContent = !hasDb;

const isLive = (p: Post, now = Date.now()) =>
  (p.status === "published" || p.status === "scheduled") && !!p.publishAt && new Date(p.publishAt).getTime() <= now;

const byDateDesc = (a: Post, b: Post) =>
  new Date(b.publishAt || b.updatedAt).getTime() - new Date(a.publishAt || a.updatedAt).getTime();

/* ----------------------------- public ------------------------------ */

export async function listPublicPosts(): Promise<Post[]> {
  try {
    if (hasDb) {
      const now = new Date().toISOString();
      const docs = await (await col())
        .find({ status: { $in: ["published", "scheduled"] }, publishAt: { $lte: now } })
        .sort({ publishAt: -1 })
        .limit(500)
        .toArray();
      return docs.map(toPost);
    }
    return [...mem().values()].filter((p) => isLive(p)).sort(byDateDesc);
  } catch (e) {
    console.error("[posts] listPublicPosts failed", e);
    return [];
  }
}

export async function getPublicPost(slug: string): Promise<Post | null> {
  const all = await listPublicPosts();
  return all.find((p) => p.slug === slug) || null;
}

export async function postsByCategory(cat: CategoryId) {
  return (await listPublicPosts()).filter((p) => p.category === cat);
}

export async function categoryCounts() {
  const all = await listPublicPosts();
  const counts: Record<string, number> = {};
  for (const p of all) counts[p.category] = (counts[p.category] || 0) + 1;
  return counts;
}

/** Related posts: same shelf first, then the most recent others. */
export function relatedTo(post: Post, all: Post[], n = 3) {
  const others = all.filter((p) => p.id !== post.id);
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, n);
}

export function neighbours(post: Post, all: Post[]) {
  const i = all.findIndex((p) => p.id === post.id);
  return { newer: i > 0 ? all[i - 1] : null, older: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

/** The newest piece on each shelf, for the reading view on the homepage bookshelf. */
export type ShelfPick = { slug: string; title: string; sample: string; date: string; minutes: number } | null;
export async function shelfPicks(): Promise<Record<string, ShelfPick>> {
  const all = await listPublicPosts();
  const out: Record<string, ShelfPick> = {};
  for (const c of categoryList) {
    const p = all.find((x) => x.category === c.id);
    out[c.id] = p
      ? {
          slug: p.slug,
          title: p.title,
          sample: c.verse ? p.body.split("\n").filter((l) => l.trim()).slice(0, 4).join("\n") : p.excerpt,
          date: p.publishAt || p.updatedAt,
          minutes: readingTime(p.body),
        }
      : null;
  }
  return out;
}

/** One featured piece for each of poem / story / longer world (Selected writing). */
export async function selectedWriting() {
  const all = await listPublicPosts();
  const pick = (cat: CategoryId) =>
    all.find((p) => p.category === cat && p.featured) || all.find((p) => p.category === cat) || null;
  return [
    { cat: "long-stanzas" as const, post: pick("long-stanzas") },
    { cat: "short-stories" as const, post: pick("short-stories") },
    { cat: "longer-worlds" as const, post: pick("longer-worlds") },
  ];
}

/* ------------------------------ desk ------------------------------- */

export async function listAllPosts(): Promise<Post[]> {
  if (hasDb) {
    const docs = await (await col()).find({}).sort({ updatedAt: -1 }).limit(1000).toArray();
    return docs.map(toPost);
  }
  return [...mem().values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPost(id: string): Promise<Post | null> {
  if (hasDb) {
    if (!ObjectId.isValid(id)) return null;
    const d = await (await col()).findOne({ _id: new ObjectId(id) });
    return d ? toPost(d) : null;
  }
  return mem().get(id) || null;
}

async function slugTaken(slug: string, exceptId?: string) {
  if (hasDb) {
    const d = await (await col()).findOne({ slug });
    return !!d && d._id.toString() !== exceptId;
  }
  return [...mem().values()].some((p) => p.slug === slug && p.id !== exceptId);
}

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = slugify(base);
  let n = 2;
  while (await slugTaken(slug, exceptId)) slug = `${slugify(base)}-${n++}`;
  return slug;
}

export async function createPost(input: PostInput = {}): Promise<Post> {
  const now = new Date().toISOString();
  const title = input.title?.trim() || "Untitled";
  const category = categoryById(input.category || "") ? (input.category as CategoryId) : "long-stanzas";
  const base: Omit<Post, "id"> = {
    title,
    slug: await uniqueSlug(`${title}-${Date.now().toString(36)}`),
    category,
    body: input.body || "",
    excerpt: input.excerpt || "",
    status: "draft",
    publishAt: null,
    createdAt: now,
    updatedAt: now,
    featured: false,
    coverImage: null,
  };
  if (hasDb) {
    const _id = new ObjectId();
    await (await col()).insertOne({ ...base, _id });
    return { ...base, id: _id.toString() };
  }
  const id = `local-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const post = { ...base, id };
  mem().set(id, post);
  return post;
}

export async function updatePost(id: string, input: PostInput): Promise<Post | null> {
  const current = await getPost(id);
  if (!current) return null;
  const next: Post = { ...current };

  if (typeof input.title === "string") next.title = input.title.slice(0, 200);
  if (input.category && categoryById(input.category)) next.category = input.category;
  if (typeof input.body === "string") next.body = input.body.slice(0, 200_000);
  if (typeof input.excerpt === "string") next.excerpt = input.excerpt.slice(0, 300);
  if (typeof input.featured === "boolean") next.featured = input.featured;
  if (input.coverImage !== undefined) next.coverImage = input.coverImage;

  if (input.status) {
    if (input.status === "published") {
      next.status = "published";
      next.publishAt = current.status === "published" && current.publishAt ? current.publishAt : new Date().toISOString();
    } else if (input.status === "scheduled") {
      if (!input.publishAt || isNaN(Date.parse(input.publishAt))) throw new Error("A valid date is needed to schedule");
      next.status = "scheduled";
      next.publishAt = new Date(input.publishAt).toISOString();
    } else {
      next.status = "draft";
      next.publishAt = null;
    }
  }

  // The address is fixed once a piece has gone public; drafts follow their title.
  const wasPublic = current.status !== "draft";
  if (!wasPublic && next.status !== "draft") next.slug = await uniqueSlug(next.title, id);
  if (!next.excerpt && next.status !== "draft") next.excerpt = makeExcerpt(next.body);

  next.updatedAt = new Date().toISOString();

  if (hasDb) {
    const { id: _ignore, ...doc } = next;
    void _ignore;
    await (await col()).updateOne({ _id: new ObjectId(id) }, { $set: doc });
  } else {
    mem().set(id, next);
  }
  return next;
}

export async function deletePost(id: string) {
  if (hasDb) {
    if (!ObjectId.isValid(id)) return false;
    const r = await (await col()).deleteOne({ _id: new ObjectId(id) });
    return r.deletedCount === 1;
  }
  return mem().delete(id);
}

export async function publishedDates() {
  const all = await listAllPosts();
  return all.filter((p) => p.status !== "draft" && p.publishAt && new Date(p.publishAt) <= new Date()).map((p) => p.publishAt!);
}
