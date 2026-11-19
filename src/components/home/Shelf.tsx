"use client";

import Link from "next/link";
import { animate, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type Lenis from "lenis";
import { categories, site, type Category } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import type { ShelfPick } from "@/lib/posts";
import { Petal } from "../Flowers";
import { track } from "@/lib/analytics";

const EASE_OUT: [number, number, number, number] = [0.2, 0.7, 0.2, 1];
const EASE_BOOK: [number, number, number, number] = [0.45, 0.05, 0.25, 1];
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = () => window.matchMedia("(max-width: 639px)").matches;
const lenis = () => (window as Window & { __cpbLenis?: Lenis }).__cpbLenis;

type Props = { counts: Record<string, number>; picks: Record<string, ShelfPick>; headingLevel?: 2 | 1 };

/**
 * The bookshelf. Five books: hover (or focus) pulls one forward with a short description;
 * clicking takes it off the shelf and opens it into a reading view with the newest piece on that shelf.
 * Closing puts it back. On phones it is the same shelf, scaled down.
 */
export default function Shelf({ counts, picks, headingLevel = 2 }: Props) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const stageRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const books = useRef<Record<string, HTMLButtonElement | null>>({});
  const [peek, setPeek] = useState<Category | null>(null);
  const [out, setOut] = useState<Category | null>(null); // book taken off the shelf
  const [reading, setReading] = useState<Category | null>(null); // reading view mounted
  const busy = useRef(false);

  /* ---------- hover / focus peek ---------- */
  const showPeek = (c: Category | null) => {
    if (busy.current) return;
    setPeek(c);
  };
  useEffect(() => {
    const tip = tipRef.current, stage = stageRef.current;
    if (!tip || !stage || !peek) return;
    const b = books.current[peek.id];
    if (!b) return;
    const r = b.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const x = Math.max(4, Math.min(r.left - s.left + r.width / 2 - tip.offsetWidth / 2, s.width - tip.offsetWidth - 4));
    tip.style.left = `${x}px`;
    tip.style.top = `${Math.max(4, r.top - s.top - tip.offsetHeight - 14)}px`;
  }, [peek]);

  /* ---------- open / close ---------- */
  const open = useCallback(async (c: Category) => {
    if (busy.current) return;
    busy.current = true;
    setPeek(null);
    setOut(c);
    await sleep(reduced() ? 0 : 260);
    setReading(c);
    track("shelf_open", { shelf: c.id });
  }, []);

  const closed = useCallback((c: Category) => {
    setReading(null);
    setOut(null);
    busy.current = false;
    books.current[c.id]?.focus({ preventScroll: true });
  }, []);

  const pickOne = () => {
    if (busy.current) return;
    const c = categories[Math.floor(Math.random() * categories.length)];
    track("pick_one", { shelf: c.id });
    const b = books.current[c.id];
    b?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", inline: "center", block: "nearest" });
    setPeek(c);
    window.setTimeout(() => open(c), reduced() ? 0 : 650);
  };

  /* Arrow keys move between books, like the old shelf. */
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const ids = categories.map((c) => c.id);
    const i = ids.findIndex((id) => books.current[id] === document.activeElement);
    const j = (Math.max(i, 0) + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
    books.current[ids[j]]?.focus();
  };

  return (
    <div className="shelfx">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <H className="shelfx-h">Everything I write, on one shelf</H>
          <p className="m-0 max-w-[560px] text-body">
            <span className="hidden sm:inline">Hover over a book to peek. Click to take it down and read.</span>
            <span className="sm:hidden">Tap a book to take it down and read.</span>
          </p>
        </div>
        <button
          type="button"
          onClick={pickOne}
          className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-[18px] font-mono text-[15px] text-ink"
          data-testid="pick-one"
        >
          <Petal size={16} center={null} />
          Pick one for me
        </button>
      </div>

      <div className="shelfx-stage" ref={stageRef}>
        <motion.div
          role="group"
          aria-label="Bookshelf. Use the arrow keys to move between books."
          onKeyDown={onKey}
          className="shelfx-wall"
          data-testid="shelf-row"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.09 } } }}
        >
          {categories.map((c) => {
            const n = counts[c.id] || 0;
            return (
              <motion.div
                key={c.id}
                className="shelfx-slot"
                variants={{ hidden: { opacity: 0, y: 34 }, shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } } }}
              >
                <button
                  ref={(el) => { books.current[c.id] = el; }}
                  type="button"
                  data-spine={c.id}
                  className={`bk3 ${out?.id === c.id ? "is-out" : ""} ${peek?.id === c.id ? "is-peek" : ""} ${c.book.width >= 64 ? "is-thick" : ""}`}
                  style={{ "--w": `${c.book.width}px`, "--h": `${c.book.height}px`, "--c": c.book.cover, "--t": c.book.ink, "--gd": c.book.gilt } as CSSProperties}
                  aria-haspopup="dialog"
                  aria-label={`${c.title}, ${n} ${n === 1 ? "piece" : "pieces"}. Open to read.`}
                  onMouseEnter={() => showPeek(c)}
                  onMouseLeave={() => showPeek(null)}
                  onFocus={() => showPeek(c)}
                  onBlur={() => showPeek(null)}
                  onClick={() => open(c)}
                >
                  <span className="bk3-shadow" aria-hidden="true" />
                  <span className="bk3-pages" aria-hidden="true" />
                  <span className="bk3-spine">
                    <span className="bk3-band" aria-hidden="true" />
                    <span className="bk3-title">{c.title}</span>
                    <span className="bk3-emblem" aria-hidden="true" />
                    <span className="bk3-band" aria-hidden="true" />
                  </span>
                </button>
              </motion.div>
            );
          })}
          <ShelfDecor />
        </motion.div>
        <div className="shelfx-plank" aria-hidden="true" />
        <div className="shelfx-lip" aria-hidden="true" />
        <Ivy />
        <div ref={tipRef} className={`shelfx-tip ${peek ? "on" : ""}`} aria-hidden="true">
          {peek && (
            <>
              <b>{peek.title}</b>
              {peek.desc}
            </>
          )}
        </div>
      </div>

      {reading && (
        <Reader
          cat={reading}
          pick={picks[reading.id] || null}
          count={counts[reading.id] || 0}
          from={books.current[reading.id] || null}
          onClosed={() => closed(reading)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reading view: the book flies from its place on the shelf, opens,   */
/* and closes back into the same spot.                                 */
/* ------------------------------------------------------------------ */

function Reader({ cat, pick, count, from, onClosed }: { cat: Category; pick: ShelfPick; count: number; from: HTMLElement | null; onClosed: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const obRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  useEffect(() => setMounted(true), []);

  /** Where the closed book must sit to cover the spine on the shelf (for the fly-out and fly-back). */
  const spineOffset = useCallback(() => {
    const ob = obRef.current, bk = bookRef.current;
    if (!ob || !bk || !from) return { x: 0, y: 0, sx: 0.3, sy: 0.8 };
    const o = ob.getBoundingClientRect(), r = from.getBoundingClientRect();
    const ax = o.left + bk.offsetLeft + bk.offsetWidth / 2, ay = o.top + bk.offsetTop + bk.offsetHeight / 2;
    return { x: r.left + r.width / 2 - ax, y: r.top + r.height / 2 - ay, sx: r.width / bk.offsetWidth, sy: r.height / bk.offsetHeight };
  }, [from]);

  // Closed book is centred; the open spread is centred too (it grows by one page to the left).
  const half = () => (phone() ? 0 : (bookRef.current?.offsetWidth || 0) / 2);

  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current, bk = bookRef.current, cv = coverRef.current;
    if (!root || !bk || !cv) return;
    const rm = reduced(), d = (s: number) => (rm ? 0 : s);
    const html = document.documentElement;
    lenis()?.stop();
    html.style.overflow = "hidden";
    let alive = true;
    (async () => {
      const s = spineOffset(), h = half();
      animate(root, { opacity: [0, 1] }, { duration: d(0.3) });
      await animate(bk, { x: [s.x, -h], y: [s.y, 0], scaleX: [s.sx, 1], scaleY: [s.sy, 1], opacity: [0.7, 1] }, { duration: d(0.56), ease: EASE_OUT });
      if (!alive) return;
      animate(bk, { x: 0 }, { duration: d(0.8), ease: EASE_BOOK });
      await animate(cv, phone() ? { rotateY: -178, opacity: [1, 1, 0] } : { rotateY: -178 }, { duration: d(0.8), ease: EASE_BOOK });
      if (!alive) return;
      setReady(true);
      closeRef.current?.focus({ preventScroll: true });
    })();
    return () => {
      alive = false;
      lenis()?.start();
      html.style.overflow = "";
    };
    // Runs once when the reading view mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const close = useCallback(async () => {
    const root = rootRef.current, bk = bookRef.current, cv = coverRef.current;
    if (closing.current || !root || !bk || !cv) return;
    closing.current = true;
    const rm = reduced(), d = (s: number) => (rm ? 0 : s);
    setReady(false);
    await sleep(d(0.18) * 1000);
    const h = half();
    animate(bk, { x: -h }, { duration: d(0.65), ease: EASE_BOOK });
    await animate(cv, { rotateY: 0, opacity: 1 }, { duration: d(0.65), ease: EASE_BOOK });
    const s = spineOffset();
    animate(root, { opacity: 0 }, { duration: d(0.45), delay: d(0.15) });
    await animate(bk, { x: s.x, y: s.y, scaleX: s.sx, scaleY: s.sy, opacity: 0.6 }, { duration: d(0.5), ease: [0.4, 0, 0.2, 1] });
    onClosed();
  }, [onClosed, spineOffset]);

  /* Esc closes; Tab stays inside the dialog. */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !rootRef.current) return;
      const f = [...rootRef.current.querySelectorAll<HTMLElement>("a[href], button")].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  if (!mounted) return null;
  const date = pick ? formatDate(pick.date) : "";
  const meta = pick ? `${date} · ${pick.minutes} min read` : "Nothing here yet";
  const style = { "--c": cat.book.cover, "--t": cat.book.ink, "--gd": cat.book.gilt } as CSSProperties;

  return createPortal(
    <div
      ref={rootRef}
      className="rdx"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rdx-title"
      data-lenis-prevent
      data-testid="shelf-reader"
      style={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div ref={obRef} className="rdx-spread">
        <div ref={bookRef} className="rdx-book" style={style}>
          <div className="rdx-page">
            <div className={`rdx-content ${ready ? "on" : ""}`}>
              <p className="rdx-meta rdx-phone-only">{cat.title} · {meta}</p>
              <p className="rdx-desc rdx-phone-only rdx-desc-phone">{cat.desc}</p>
              <h2 id="rdx-title" className="rdx-title">{pick ? pick.title : `${cat.title} is waiting for its first page`}</h2>
              {pick ? (
                <p className={`rdx-sample ${cat.verse ? "is-verse" : ""}`}>{pick.sample}</p>
              ) : (
                <p className="rdx-sample">Nothing on this shelf yet. Soon.</p>
              )}
              <div className="rdx-links">
                {pick && <Link href={`/journal/${pick.slug}`} className="rdx-link">Read the full piece →</Link>}
                <Link href={`/shelf/${cat.id}`} className="rdx-link is-quiet">Browse {cat.title} →</Link>
              </div>
            </div>
            <span className="rdx-folio" aria-hidden="true">p. 1</span>
          </div>
          <div ref={coverRef} className="rdx-cover">
            <div className="rdx-front" aria-hidden="true">
              <span className="rdx-frame" />
              <span className="rdx-front-title">{cat.title}</span>
              <span className="rdx-front-author">{site.author}</span>
            </div>
            <div className="rdx-inside">
              <Petal size={28} />
              <span className="rdx-cat">{cat.title}</span>
              <span className="rdx-meta">
                {count} {count === 1 ? "piece" : "pieces"} on this shelf
                <br />
                {meta}
              </span>
              <span className="rdx-desc">{cat.desc}</span>
            </div>
          </div>
        </div>
      </div>
      <button ref={closeRef} type="button" className="rdx-close icon-btn" aria-label="Close the book" onClick={close}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>,
    document.body,
  );
}

/* ---------- decoration: leaning book, small stack, lavender in a bud vase, trailing ivy ---------- */

function ShelfDecor() {
  const sprigs: [number, number][] = [[20, 22], [40, 12], [50, 36]];
  return (
    <div className="shelfx-decor" aria-hidden="true">
      <span className="shelfx-lean" />
      <span className="shelfx-stack">
        <span style={{ width: 92, background: "#3F5A47" }} />
        <span style={{ width: 102, marginLeft: -5, background: "#C99A9A" }} />
        <span style={{ width: 96, background: "#7B3640" }} />
      </span>
      <svg width="64" height="150" viewBox="0 0 64 150" focusable="false">
        <g fill="none" strokeWidth="1.4" style={{ stroke: "var(--stem)" }}>
          <path d="M32 112 C30 80 26 55 20 22" />
          <path d="M32 112 C33 78 36 50 40 12" />
          <path d="M32 112 C34 85 44 62 50 36" />
        </g>
        {sprigs.map(([x, y]) =>
          [0, 1, 2, 3, 4, 5].map((k) => (
            <ellipse key={`${x}-${k}`} cx={x + (k % 2 ? 2.6 : -2.6) - k * 0.5} cy={y + k * 4.4} rx="2.6" ry="3.6" style={{ fill: "var(--lav)" }} />
          )),
        )}
        <path d="M18 112 h28 l-3 30 q-11 6 -22 0z" fill="#E7DCCB" stroke="#CDBFA9" />
        <path d="M22 112 h20" stroke="#CDBFA9" />
      </svg>
    </div>
  );
}

function Ivy() {
  return (
    <svg className="shelfx-ivy" width="70" height="64" viewBox="0 0 70 64" aria-hidden="true" focusable="false">
      <path d="M8 2 C 10 22, 2 34, 14 52" fill="none" strokeWidth="1.3" style={{ stroke: "var(--stem)" }} />
      <g style={{ fill: "var(--sage)" }}>
        <ellipse cx="10" cy="14" rx="6" ry="3.4" transform="rotate(40 10 14)" />
        <ellipse cx="6" cy="28" rx="6" ry="3.4" transform="rotate(-30 6 28)" />
        <ellipse cx="10" cy="42" rx="5.5" ry="3" transform="rotate(35 10 42)" />
        <ellipse cx="15" cy="53" rx="4.5" ry="2.6" transform="rotate(-20 15 53)" />
      </g>
    </svg>
  );
}
