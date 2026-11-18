export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

export function wordCount(s: string) {
  return (s.trim().match(/\S+/g) || []).length;
}

export function readingTime(body: string) {
  return Math.max(1, Math.round(wordCount(body) / 200));
}

export function makeExcerpt(body: string, max = 160) {
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

const TZ = "Asia/Kolkata";

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: TZ }).format(new Date(iso));
}

export function postmark(iso: string | null | undefined) {
  if (!iso) return "DRAFT";
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: TZ }).format(new Date(iso)).toUpperCase();
  return `${day} · THE SKY`;
}

/** Day key (YYYY-MM-DD) in India time. */
export function dayKey(d: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
}

/** Consecutive days (ending today or yesterday) that have at least one published post. */
export function computeStreak(dates: string[], now = new Date()) {
  const days = new Set(dates.map(dayKey));
  const step = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
  let cursor = now;
  if (!days.has(dayKey(cursor))) cursor = step(cursor, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = step(cursor, -1);
  }
  return { streak, wroteToday: days.has(dayKey(now)) };
}

export function absoluteUrl(path: string, base: string) {
  return base + (path.startsWith("/") ? path : `/${path}`);
}
