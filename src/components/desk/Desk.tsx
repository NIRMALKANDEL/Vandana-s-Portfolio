"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { categories, categoryById, type CategoryId } from "@/lib/site";
import { formatDate, wordCount } from "@/lib/utils";
import { Petal } from "../Flowers";
import ThemeToggle from "../ThemeToggle";
import PwaRegister from "./PwaRegister";

type Streak = { streak: number; wroteToday: boolean };
type SaveState = "saved" | "unsaved" | "saving" | "offline" | "error";
type Draft = { title: string; category: CategoryId; body: string };

const backupKey = (id: string) => `cpb-desk-backup-${id}`;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function Desk({ initialPosts, initialStreak, user, storage }: { initialPosts: Post[]; initialStreak: Streak; user: { email: string; name?: string | null }; storage: "database" | "memory" }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [streak, setStreak] = useState<Streak>(initialStreak);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [save, setSave] = useState<SaveState>("saved");
  const [mobileView, setMobileView] = useState<"list" | "edit">("list");
  const [focus, setFocus] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = useRef<Draft | null>(null);

  const active = posts.find((p) => p.id === activeId) || null;
  const cat = draft ? categoryById(draft.category) : null;

  /* ---------------- open / create ---------------- */
  const open = useCallback((p: Post) => {
    pending.current = null;
    let d: Draft = { title: p.title === "Untitled" ? "" : p.title, category: p.category, body: p.body };
    try {
      const raw = localStorage.getItem(backupKey(p.id));
      if (raw) {
        const b = JSON.parse(raw) as Draft & { at: string };
        if (new Date(b.at) > new Date(p.updatedAt)) {
          d = { title: b.title, category: b.category, body: b.body };
          pending.current = d;
          setSave("unsaved");
          toast("Restored unsaved changes from this device.");
        } else localStorage.removeItem(backupKey(p.id));
      }
    } catch {}
    setActiveId(p.id);
    setDraft(d);
    setScheduleOpen(false);
    setMobileView("edit");
    if (!pending.current) setSave("saved");
    window.setTimeout(() => (d.title ? bodyRef.current : document.getElementById("desk-title"))?.focus(), 50);
  }, []);

  const createNew = useCallback(async () => {
    try {
      const { post } = await api<{ post: Post }>("/api/desk/posts", { method: "POST", body: JSON.stringify({ category: draft?.category || "long-stanzas" }) });
      setPosts((ps) => [post, ...ps]);
      open(post);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [draft?.category, open]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get("new") === "1") { createNew(); history.replaceState(null, "", "/desk"); }
    else if (window.matchMedia("(min-width: 900px)").matches && initialPosts[0]) open(initialPosts[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- autosave ---------------- */
  const flush = useCallback(async () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    const d = pending.current;
    if (!d || !activeId) return true;
    if (!navigator.onLine) { setSave("offline"); return false; }
    setSave("saving");
    try {
      const { post } = await api<{ post: Post }>(`/api/desk/posts/${activeId}`, { method: "PATCH", body: JSON.stringify({ title: d.title.trim() || "Untitled", category: d.category, body: d.body }) });
      if (pending.current === d) { pending.current = null; setSave("saved"); localStorage.removeItem(backupKey(activeId)); }
      setPosts((ps) => ps.map((p) => (p.id === post.id ? post : p)));
      return true;
    } catch {
      setSave("error");
      return false;
    }
  }, [activeId]);

  const change = (patch: Partial<Draft>) => {
    if (!draft || !activeId) return;
    const d = { ...draft, ...patch };
    setDraft(d);
    pending.current = d;
    setSave("unsaved");
    try { localStorage.setItem(backupKey(activeId), JSON.stringify({ ...d, at: new Date().toISOString() })); } catch {}
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 1200);
  };

  useEffect(() => {
    const online = () => pending.current && flush();
    const before = (e: BeforeUnloadEvent) => { if (pending.current) { e.preventDefault(); e.returnValue = ""; } };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); flush().then((ok) => ok && toast("Saved")); }
      if (e.key === "Escape" && focus) setFocus(false);
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", before);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("online", online); window.removeEventListener("beforeunload", before); window.removeEventListener("keydown", key); };
  }, [flush, focus]);

  // Grow the writing area with the text.
  useEffect(() => {
    const t = bodyRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.max(t.scrollHeight, 320)}px`;
  }, [draft?.body, activeId]);

  /* ---------------- status changes ---------------- */
  const setStatus = async (status: Post["status"], publishAt?: string) => {
    if (!activeId || !draft) return;
    if (status !== "draft" && !draft.title.trim()) { toast.error("Give it a title first."); document.getElementById("desk-title")?.focus(); return; }
    if (status !== "draft" && !draft.body.trim()) { toast.error("There's nothing written yet."); return; }
    setBusy(true);
    const ok = await flush();
    if (!ok) { setBusy(false); toast.error("Couldn't save. Check the connection and try again."); return; }
    try {
      const { post, streak: s } = await api<{ post: Post; streak?: Streak }>(`/api/desk/posts/${activeId}`, { method: "PATCH", body: JSON.stringify({ status, publishAt: publishAt ?? null }) });
      setPosts((ps) => ps.map((p) => (p.id === post.id ? post : p)));
      if (s) setStreak(s);
      setScheduleOpen(false);
      if (status === "published") toast.success("Published. It's on the homepage and in the journal.");
      else if (status === "scheduled") toast.success(`Scheduled for ${formatDate(post.publishAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.`);
      else toast("Moved back to drafts.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!activeId || !active) return;
    if (!window.confirm(`Delete "${active.title}"? This can't be undone.`)) return;
    try {
      const { streak: s } = await api<{ streak: Streak }>(`/api/desk/posts/${activeId}`, { method: "DELETE" });
      pending.current = null;
      localStorage.removeItem(backupKey(activeId));
      setPosts((ps) => ps.filter((p) => p.id !== activeId));
      setStreak(s);
      setActiveId(null);
      setDraft(null);
      setMobileView("list");
      toast("Deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  /* ---------------- images ---------------- */
  const upload = async (file: File) => {
    const t = toast.loading("Uploading image…");
    try {
      const sig = await api<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string; allowed_formats: string }>("/api/desk/upload", { method: "POST" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      fd.append("allowed_formats", sig.allowed_formats);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const ta = bodyRef.current;
      const at = ta?.selectionStart ?? draft?.body.length ?? 0;
      const body = draft?.body || "";
      const snippet = `\n\n![${alt}](${json.secure_url})\n\n`;
      change({ body: body.slice(0, at) + snippet + body.slice(at) });
      toast.success("Image added.", { id: t });
    } catch (e) {
      toast.error((e as Error).message, { id: t });
    }
  };

  /* ---------------- derived ---------------- */
  const groups = useMemo(() => {
    const g = { draft: [] as Post[], scheduled: [] as Post[], published: [] as Post[] };
    posts.forEach((p) => g[p.status].push(p));
    return g;
  }, [posts]);
  const words = draft ? wordCount(draft.body) : 0;
  const saveLabel = { saved: "Saved", unsaved: "Unsaved changes", saving: "Saving…", offline: "Offline — kept on this device", error: "Not saved — retrying when you type" }[save];

  /* ---------------- UI ---------------- */
  const statusChip = (p: Post) => {
    const label = p.status === "published" ? "Published" : p.status === "scheduled" ? "Scheduled" : "Draft";
    const bg = p.status === "published" ? "var(--tint-micro-poetry)" : p.status === "scheduled" ? "var(--tint-longer-worlds)" : "var(--card)";
    return <span className="rounded-full px-2 py-0.5 text-[12px]" style={{ background: bg }}>{label}</span>;
  };

  const list = (
    <nav aria-label="Your pages" className={`flex min-h-0 flex-col gap-6 overflow-y-auto ${mobileView === "edit" ? "hidden" : "flex"} min-[900px]:flex`}>
      <button type="button" onClick={createNew} className="btn btn-primary w-full" data-testid="new-page">
        <span aria-hidden="true" className="text-[20px] leading-none">+</span> New page
      </button>
      {(["draft", "scheduled", "published"] as const).map((k) => (
        <section key={k} aria-labelledby={`grp-${k}`}>
          <h2 id={`grp-${k}`} className="m-0 mb-2 font-mono text-[14px] font-normal text-muted">
            {k === "draft" ? "Drafts" : k === "scheduled" ? "Scheduled" : "Published"} · {groups[k].length}
          </h2>
          {groups[k].length === 0 ? (
            <p className="m-0 text-[14px] text-muted">{k === "draft" ? "No drafts. A blank page is one tap away." : k === "scheduled" ? "Nothing waiting." : "Nothing published yet."}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {groups[k].map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={async () => { await flush(); open(p); }}
                    aria-current={p.id === activeId ? "true" : undefined}
                    className="flex min-h-13 w-full cursor-pointer flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left"
                    style={{ background: p.id === activeId ? "var(--surface)" : "transparent", borderColor: p.id === activeId ? "var(--line)" : "transparent", color: "var(--ink)" }}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: `var(--cat-${p.category})` }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-mono text-[15px]">{p.title || "Untitled"}</span>
                      {statusChip(p)}
                    </span>
                    <span className="pl-4.5 text-[12px] text-muted">
                      {p.status === "draft" ? `edited ${formatDate(p.updatedAt, { day: "numeric", month: "short" })}` : formatDate(p.publishAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <PwaRegister />
      {/* Top bar */}
      {!focus && (
        <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
          <div className="mx-auto flex max-w-300 items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              {mobileView === "edit" && (
                <button type="button" className="icon-btn min-[900px]:hidden!" aria-label="Back to your pages" onClick={async () => { await flush(); setMobileView("list"); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M15 18 9 12l6-6" /></svg>
                </button>
              )}
              <Link href="/" className="flex min-h-11 items-center gap-2 font-mono text-[17px] font-bold no-underline" aria-label="View the site">
                <Petal size={22} /> <span className="hidden sm:inline">Writing desk</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[14px]" style={{ background: streak.wroteToday ? "var(--tint-long-stanzas)" : "var(--card)" }} title={streak.wroteToday ? "You published today" : "Publish today to keep it going"} data-testid="streak">
                <Petal size={16} center={streak.wroteToday ? "var(--gold)" : null} fill={streak.wroteToday ? "var(--petal2)" : "var(--muted)"} />
                <span><strong>{streak.streak}</strong>-day streak</span>
              </div>
              <ThemeToggle />
              <button type="button" className="icon-btn" aria-label="Sign out" title={`Signed in as ${user.email}`} onClick={async () => { await flush(); signOut({ callbackUrl: "/" }); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              </button>
            </div>
          </div>
          {storage === "memory" && (
            <p className="m-0 bg-(--tint-after-hours) px-4 py-1.5 text-center text-[13px]">Practice mode: no database connected, so pages reset when the server restarts.</p>
          )}
        </header>
      )}

      <div className={`mx-auto grid w-full max-w-300 flex-1 gap-8 px-4 py-5 sm:px-5 ${focus ? "" : "min-[900px]:grid-cols-[300px_1fr]"}`}>
        {!focus && <aside className="min-[900px]:sticky min-[900px]:top-20 min-[900px]:max-h-[calc(100dvh-100px)]">{list}</aside>}

        <section aria-label="Editor" className={`min-w-0 ${mobileView === "list" && !focus ? "hidden min-[900px]:block" : "block"}`}>
          {!draft || !active ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 text-center" data-testid="desk-empty">
              <Petal size={44} />
              <p className="m-0 font-mono text-[22px]">A blank page is waiting</p>
              <p className="m-0 max-w-90 text-body">Pick a page on the left, or start a new one. Everything saves as you type.</p>
              <button type="button" className="btn btn-primary" onClick={createNew}>Start writing</button>
            </div>
          ) : (
            <div className="mx-auto flex max-w-180 flex-col gap-4 pb-40">
              <div role="radiogroup" aria-label="Shelf" className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.category === c.id}
                    onClick={() => change({ category: c.id })}
                    className="inline-flex min-h-10 flex-none cursor-pointer items-center rounded-full border px-3.5 font-mono text-[14px]"
                    style={{ background: draft.category === c.id ? `var(--cat-${c.id})` : "transparent", color: draft.category === c.id ? "#2A2530" : "var(--ink)", borderColor: draft.category === c.id ? "transparent" : "var(--line)" }}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
              <label htmlFor="desk-title" className="sr-only">Title</label>
              <input
                id="desk-title"
                value={draft.title}
                onChange={(e) => change({ title: e.target.value })}
                placeholder="Title"
                maxLength={200}
                className="w-full border-0 bg-transparent font-mono text-[clamp(26px,5vw,36px)] leading-tight text-ink outline-none placeholder:text-muted focus-visible:outline-none"
                data-testid="desk-title"
              />
              <label htmlFor="desk-body" className="sr-only">Writing</label>
              <textarea
                id="desk-body"
                ref={bodyRef}
                value={draft.body}
                onChange={(e) => change({ body: e.target.value })}
                placeholder={cat?.verse ? "Begin the first line…" : "Begin here…"}
                spellCheck
                className={`w-full resize-none overflow-hidden border-0 bg-transparent text-ink outline-none placeholder:text-muted focus-visible:outline-none ${cat?.verse ? "font-mono text-[19px] leading-[1.85]" : "font-sans text-[18px] leading-[1.8]"}`}
                data-testid="desk-body"
              />
            </div>
          )}
        </section>
      </div>

      {/* Bottom bar: status + actions (thumb-reachable on phones) */}
      {draft && active && (
        <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur ${mobileView === "list" && !focus ? "hidden min-[900px]:block" : ""}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {scheduleOpen && (
            <div className="mx-auto flex max-w-300 flex-wrap items-end gap-3 px-4 pt-3 sm:px-5">
              <div className="field">
                <label htmlFor="desk-when">Publish on</label>
                <input id="desk-when" type="datetime-local" className="input" value={when} min={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} />
              </div>
              <button type="button" className="btn btn-primary" disabled={!when || busy} onClick={() => setStatus("scheduled", new Date(when).toISOString())}>Schedule</button>
              <button type="button" className="btn btn-ghost" onClick={() => setScheduleOpen(false)}>Cancel</button>
            </div>
          )}
          <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:px-5">
            <p className="m-0 flex items-center gap-2 text-[14px] text-muted" aria-live="polite" data-testid="save-state">
              <span className="h-2 w-2 rounded-full" style={{ background: save === "saved" ? "var(--ok)" : save === "error" || save === "offline" ? "var(--danger)" : "var(--gold)" }} aria-hidden="true" />
              {saveLabel} · {words} {words === 1 ? "word" : "words"}
              {active.status === "scheduled" && ` · goes live ${formatDate(active.publishAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="icon-btn" aria-label={focus ? "Leave focus mode" : "Focus mode"} aria-pressed={focus} onClick={() => setFocus((f) => !f)} title="Focus mode (Esc to leave)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{focus ? <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" /> : <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />}</svg>
              </button>
              <button type="button" className="icon-btn" aria-label="Add an image" onClick={() => fileRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              <button type="button" className="icon-btn" aria-label="Delete this page" onClick={remove}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
              </button>
              {active.status !== "draft" && (
                <>
                  {active.status === "published" && <Link href={`/journal/${active.slug}`} target="_blank" className="btn btn-ghost min-h-11! px-4! text-[15px]">View</Link>}
                  <button type="button" className="btn btn-ghost min-h-11! px-4! text-[15px]" disabled={busy} onClick={() => setStatus("draft")}>Unpublish</button>
                </>
              )}
              {active.status === "draft" && (
                <button type="button" className="btn btn-ghost min-h-11! px-4! text-[15px]" disabled={busy} onClick={() => { setWhen(toLocalInput(new Date(Date.now() + 86400000))); setScheduleOpen((o) => !o); }} aria-expanded={scheduleOpen}>
                  Schedule
                </button>
              )}
              <button type="button" className="btn btn-primary min-h-11! px-5! text-[15px]" disabled={busy} onClick={() => setStatus("published")} data-testid="publish">
                {active.status === "published" ? "Update" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
