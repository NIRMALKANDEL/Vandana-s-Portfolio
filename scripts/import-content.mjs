// Imports Markdown files from ./content into MongoDB (safe to run again: matches on slug).
//   node --env-file=.env.local scripts/import-content.mjs
// Front matter: title (required), category (Poetry, Short stories, Letters, Essays, Microfiction, Book notes),
// optional date (YYYY-MM-DD), featured (true/false), status (published | draft). Default status: published.
import { MongoClient } from "mongodb";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const CATS = {
  "micro poetry": "micro-poetry", "micro poem": "micro-poetry", microfiction: "micro-poetry",
  "long stanzas": "long-stanzas", poetry: "long-stanzas", poem: "long-stanzas",
  "short stories": "short-stories", "short story": "short-stories", story: "short-stories",
  "longer worlds": "longer-worlds", "longer world": "longer-worlds",
  "after hours": "after-hours", letters: "after-hours", letter: "after-hours", essays: "articles", essay: "articles", articles: "articles", article: "articles", "book notes": "after-hours",
};
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI is not set. Run with: node --env-file=.env.local scripts/import-content.mjs"); process.exit(1); }

const dir = join(process.cwd(), "content");
const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
const client = await new MongoClient(uri).connect();
const col = client.db(process.env.MONGODB_DB || "commonplace").collection("posts");
await col.createIndex({ slug: 1 }, { unique: true });

for (const f of files) {
  const raw = (await readFile(join(dir, f), "utf8")).replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { console.warn(`skip ${f}: no front matter`); continue; }
  const meta = Object.fromEntries(m[1].split("\n").map((l) => l.split(/:\s*/)).filter((p) => p.length >= 2).map(([k, ...v]) => [k.trim().toLowerCase(), v.join(": ").trim()]));
  const body = m[2].trim();
  const title = meta.title;
  const category = CATS[(meta.category || "long stanzas").toLowerCase()] || "long-stanzas";
  const slug = slugify(title);
  const when = meta.date ? new Date(`${meta.date}T10:00:00+05:30`).toISOString() : new Date().toISOString();
  const excerpt = (category === "long-stanzas" || category === "micro-poetry") ? body.split("\n").filter(Boolean).slice(0, 2).join(" / ") + "…" : body.replace(/\s+/g, " ").slice(0, 157).replace(/\s+\S*$/, "") + "…";
  const status = meta.status === "draft" ? "draft" : "published";
  const res = await col.updateOne(
    { slug },
    {
      $set: { title, category, body, excerpt, status, featured: meta.featured === "true", updatedAt: new Date().toISOString() },
      $setOnInsert: { slug, publishAt: status === "published" ? when : null, createdAt: when, coverImage: null },
    },
    { upsert: true },
  );
  console.log(`${res.upsertedCount ? "added  " : "updated"} ${slug} (${category})`);
}
await client.close();
