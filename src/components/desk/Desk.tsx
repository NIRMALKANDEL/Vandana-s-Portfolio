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
import PostBody from "../PostBody";
import PwaRegister from "./PwaRegister";
import BlockEditor, { type BlockEditorHandle } from "./BlockEditor";
import DeskDialog from "./DeskDialog";

type Streak = { streak: number; wroteToday: boolean };
type SaveState = "saved" | "unsaved" | "saving" | "offline" | "error";
type Draft = { title: string; category: CategoryId; body: string };
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const backupKey = (id: string) => `cpb-desk-backup-${id}`;
const MAX_IMAGE_MB = 10;

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

function greeting(name?: string | null) {
  const h = new Date().getHours();
  const part = h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = (name || "").split(" ")[0];
  return first ? `${part}, ${first}` : part;
}

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONS = {
  image: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM21 16l-5-5-9 9",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  focus: "M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6",
  unfocus: "M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  quote: "M7 7h4v4c0 3-2 5-4 5M14 7h4v4c0 3-2 5-4 5",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  back: "M15 18 9 12l6-6",
  site: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  install: "M12 3v12M7 10l5 5 5-5M5 21h14",
};

export default function Desk({ initialPosts, initialStreak, user, storage }: { initialPosts: Post[]; initialStreak: Streak; user: { email: string; name?: string | null }; storage: "database" | "memory" }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [streak, setStreak] = useState<Streak>(initialStreak);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [save, setSave] = useState<SaveState>("saved");
  const [mobileView, setMobileView] = useState<"list" | "edit">("list");
  const [focus, setFocus] = useState(false);
  const [preview, setPreview] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [hello, setHello] = useState("");
  const timer = useRef<number | null>(null);
  const editor = useRef<BlockEditorHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = useRef<Draft | null>(null);
  const draftRef = useRef<Draft | null>(null);
  draftRef.current = draft;

  const active = posts.find((p) => p.id === activeId) || null;
  const cat = draft ? categoryById(draft.category) : null;

  useEffect(() => setHello(greeting(user.name)), [user.name]);

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
    setPreview(false);
    setMobileView("edit");
    if (!pending.current) setSave("saved");
    window.setTimeout(() => (d.title ? editor.current?.focusEnd() : document.getElementById("desk-title")?.focus()), 60);
  }, []);

  const createNew = useCallback(async () => {
    try {
      const { post } = await api<{ post: Post }>("/api/desk/posts", { method: "POST", body: JSON.stringify({ category: draftRef.current?.category || "long-stanzas" }) });
      setPosts((ps) => [post, ...ps]);
      setQuery("");
      open(post);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [open]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get("new") === "1") { createNew(); history.replaceState(null, "", "/desk"); }
    else if (window.matchMedia("(min-width: 900px)").matches && initialPosts[0]) open(initialPosts[0]);
    const onPrompt = (e: Event) => { e.preventDefault(); setInstall(e as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
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

  const flushRef = useRef(flush);
  flushRef.current = flush;

  const change = useCallback((patch: Partial<Draft>) => {
    const cur = draftRef.current;
    if (!cur || !activeId) return;
    const d = { ...cur, ...patch };
    draftRef.current = d;
    setDraft(d);
    pending.current = d;
    setSave("unsaved");
    try { localStorage.setItem(backupKey(activeId), JSON.stringify({ ...d, at: new Date().toISOString() })); } catch {}
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => flushRef.current(), 1200);
  }, [activeId]);

  const onBody = useCallback((body: string) => change({ body }), [change]);

  useEffect(() => {
    const online = () => pending.current && flush();
    const before = (e: BeforeUnloadEvent) => { if (pending.current) { e.preventDefault(); e.returnValue = ""; } };
    const key = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); flush().then((ok) => ok && toast("Saved")); }
      if (mod && e.key.toLowerCase() === "b" && draftRef.current && !preview) { e.preventDefault(); editor.current?.format("bold"); }
      if (mod && e.key.toLowerCase() === "i" && draftRef.current && !preview) { e.preventDefault(); editor.current?.format("italic"); }
      if (e.key === "Escape" && focus) setFocus(false);
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", before);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("online", online); window.removeEventListener("beforeunload", before); window.removeEventListener("keydown", key); };
  }, [flush, focus, preview]);

  /* ---------------- status changes ---------------- */
  const setStatus = async (status: Post["status"], publishAt?: string) => {
    if (!activeId || !draft) return;
    if (status !== "draft" && !draft.title.trim()) { toast.error("Give it a title first."); setPreview(false); document.getElementById("desk-title")?.focus(); return; }
    if (status !== "draft" && !draft.body.trim()) { toast.error("There's nothing written yet."); return; }
    setBusy(true);
    const ok = await flush();
    if (!ok) { setBusy(false); toast.error("Couldn't save. Check the connection and try again."); return; }
    try {
      const { post, streak: s } = await api<{ post: Post; streak?: Streak }>(`/api/desk/posts/${activeId}`, { method: "PATCH", body: JSON.stringify({ status, publishAt: publishAt ?? null }) });
      setPosts((ps) => ps.map((p) => (p.id === post.id ? post : p)));
      if (s) setStreak(s);
      setScheduleOpen(false);
      if (status === "published") toast.success(active?.status === "published" ? "Updated on the site." : "Published. It's on the homepage and in the journal.");
      else if (status === "scheduled") toast.success(`Scheduled for ${formatDate(post.publishAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.`);
      else toast("Moved back to drafts. Readers can't see it now.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!activeId || !active) return;
    setConfirmDelete(false);
    try {
      const { streak: s } = await api<{ streak: Streak }>(`/api/desk/posts/${activeId}`, { method: "DELETE" });
      pending.current = null;
      localStorage.removeItem(backupKey(activeId));
      setPosts((ps) => ps.filter((p) => p.id !== activeId));
      setStreak(s);
      setActiveId(null);
      setDraft(null);
      setMobileView("list");
      toast("Page deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  /* ---------------- pictures ---------------- */
  const uploadOne = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error(`${file.name} isn't a picture.`); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`${file.name} is over ${MAX_IMAGE_MB} MB. Try a smaller photo or a screenshot of it.`); return; }
    setUploading((n) => n + 1);
    const t = toast.loading("Adding the picture…");
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
      setPreview(false);
      editor.current?.addImage({ url: json.secure_url, alt: "" });
      toast.success("Picture added. Add a short description under it.", { id: t });
    } catch (e) {
      toast.error((e as Error).message, { id: t });
    } finally {
      setUploading((n) => n - 1);
    }
  };
  const upload = async (files: File[]) => { for (const f of files) await uploadOne(f); };

  /** Picture taken out of the page: offer Undo, and clear it from storage once it's really gone. */
  const onImageRemoved = useCallback((url: string, undo: () => void) => {
    let undone = false;
    const cleanup = async () => {
      if (undone) return;
      await flushRef.current();
      if (draftRef.current?.body.includes(url)) return; // added back in the meantime
      api("/api/desk/upload", { method: "DELETE", body: JSON.stringify({ url }) }).catch(() => {});
    };
    toast("Picture removed.", {
      duration: 7000,
      action: { label: "Undo", onClick: () => { undone = true; undo(); toast.success("Picture is back."); } },
      onAutoClose: cleanup,
      onDismiss: cleanup,
    });
  }, []);

  const doInstall = async () => {
    if (!install) return;
    await install.prompt();
    await install.userChoice.catch(() => null);
    setInstall(null);
  };

  /* ---------------- derived ---------------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? posts.filter((p) => `${p.title} ${p.body}`.toLowerCase().includes(q)) : posts;
  }, [posts, query]);
  const groups = useMemo(() => {
    const g = { draft: [] as Post[], scheduled: [] as Post[], published: [] as Post[] };
    filtered.forEach((p) => g[p.status].push(p));
    return g;
  }, [filtered]);
  const words = draft ? wordCount(draft.body.replace(/!\[[^\]]*\]\([^)]*\)/g, "")) : 0;
  const saveLabel = { saved: "Saved", unsaved: "Unsaved changes", saving: "Saving…", offline: "Offline — kept on this device", error: "Not saved — retrying when you type" }[save];

  /* ---------------- UI ---------------- */
  const statusChip = (p: Post) => {
    const label = p.status === "published" ? "Live" : p.status === "scheduled" ? "Scheduled" : "Draft";
    const bg = p.status === "published" ? "var(--tint-micro-poetry)" : p.status === "scheduled" ? "var(--tint-longer-worlds)" : "var(--card)";
    return <span className="rounded-full px-2 py-0.5 text-[12px]" style={{ background: bg }}>{label}</span>;
  };

  const statusNote = active && (
    <p className="desk-status" data-status={active.status}>
      {active.status === "draft" && <>Draft · only you can see this page.</>}
      {active.status === "scheduled" && <>Scheduled · goes live {formatDate(active.publishAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.</>}
      {active.status === "published" && (
        <>Live on the site · changes appear after you press <strong>Update</strong>. <Link href={`/journal/${active.slug}`} target="_blank" className="underline underline-offset-2">Open it</Link></>
      )}
    </p>
  );

  const list = (
    <nav aria-label="Your pages" className={`flex min-h-0 flex-col gap-5 overflow-y-auto pb-6 ${mobileView === "edit" ? "hidden" : "flex"} min-[900px]:flex`}>
      <div>
        <p className="m-0 font-mono text-[22px]" suppressHydrationWarning>{hello || "Welcome back"}</p>
        <p className="m-0 mt-1 text-[14px] text-muted">{posts.length === 0 ? "Your first page is one tap away." : `${posts.length} ${posts.length === 1 ? "page" : "pages"} on your desk.`}</p>
      </div>
      <button type="button" onClick={createNew} className="btn btn-primary w-full" data-testid="new-page">
        <span aria-hidden="true" className="text-[20px] leading-none">+</span> New page
      </button>
      {posts.length > 5 && (
        <div className="relative">
          <label htmlFor="desk-search" className="sr-only">Find a page</label>
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"><Icon d={ICONS.search} size={16} /></span>
          <input id="desk-search" type="search" className="input min-h-11! rounded-full! pl-10!" placeholder="Find a page" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}
      {query && filtered.length === 0 && <p className="m-0 text-[14px] text-muted">Nothing matches “{query}”.</p>}
      {(["draft", "scheduled", "published"] as const).map((k) => (query && groups[k].length === 0 ? null : (
        <section key={k} aria-labelledby={`grp-${k}`}>
          <h2 id={`grp-${k}`} className="m-0 mb-2 font-mono text-[14px] font-normal text-muted">
            {k === "draft" ? "Drafts" : k === "scheduled" ? "Scheduled" : "Live on the site"} · {groups[k].length}
          </h2>
          {groups[k].length === 0 ? (
            <p className="m-0 text-[14px] text-muted">{k === "draft" ? "No drafts. A blank page is one tap away." : k === "scheduled" ? "Nothing waiting." : "Nothing published yet."}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {groups[k].map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={async () => { if (p.id !== activeId) { await flush(); open(p); } else setMobileView("edit"); }}
                    aria-current={p.id === activeId ? "true" : undefined}
                    className="desk-item"
                  >
                    <span className="flex w-full items-center gap-2">
                      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: `var(--cat-${p.category})` }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-mono text-[15px]">{p.title || "Untitled"}</span>
                      {statusChip(p)}
                    </span>
                    <span className="pl-4.5 text-[12px] text-muted">
                      {categoryById(p.category)?.title} · {p.status === "draft" ? `edited ${formatDate(p.updatedAt, { day: "numeric", month: "short" })}` : formatDate(p.publishAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )))}
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
                  <Icon d={ICONS.back} size={20} />
                </button>
              )}
              <span className="flex min-h-11 items-center gap-2 font-mono text-[17px] font-bold">
                <Petal size={22} /> <span className={mobileView === "edit" ? "hidden sm:inline" : ""}>Writing desk</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden min-h-10 items-center gap-1.5 rounded-full px-3 text-[14px] min-[420px]:flex" style={{ background: streak.wroteToday ? "var(--tint-long-stanzas)" : "var(--card)" }} title={streak.wroteToday ? "You published today" : "Publish today to keep it going"} data-testid="streak">
                <Petal size={16} center={streak.wroteToday ? "var(--gold)" : null} fill={streak.wroteToday ? "var(--petal2)" : "var(--muted)"} />
                <span><strong>{streak.streak}</strong>-day streak</span>
              </div>
              <Link href="/" target="_blank" className="icon-btn" aria-label="Open the site in a new tab" title="View the site"><Icon d={ICONS.site} /></Link>
              <button type="button" className="icon-btn" aria-label="How the desk works" title="Help" onClick={() => setHelpOpen(true)}><Icon d={ICONS.help} /></button>
              <ThemeToggle />
              <button type="button" className="icon-btn" aria-label="Sign out" title={`Signed in as ${user.email}`} onClick={async () => { await flush(); signOut({ callbackUrl: "/" }); }}>
                <Icon d={ICONS.out} />
              </button>
            </div>
          </div>
          {storage === "memory" && (
            <p className="m-0 bg-(--tint-after-hours) px-4 py-1.5 text-center text-[13px]">Practice mode: no database connected, so pages reset when the server restarts.</p>
          )}
          {install && (
            <div className="flex items-center justify-center gap-3 bg-(--tint-longer-worlds) px-4 py-1.5 text-[13px]">
              <span>Keep the desk on your home screen, like an app.</span>
              <button type="button" className="font-medium underline underline-offset-2" onClick={doInstall}>Install</button>
              <button type="button" className="text-muted" aria-label="Not now" onClick={() => setInstall(null)}>✕</button>
            </div>
          )}
        </header>
      )}

      <div className={`mx-auto grid w-full max-w-300 flex-1 grid-cols-[minmax(0,1fr)] gap-8 px-4 py-5 sm:px-5 ${focus ? "" : "min-[900px]:grid-cols-[300px_minmax(0,1fr)]"}`}>
        {!focus && <aside className="min-w-0 min-[900px]:sticky min-[900px]:top-20 min-[900px]:max-h-[calc(100dvh-100px)]">{list}</aside>}

        <section aria-label="Editor" className={`min-w-0 ${mobileView === "list" && !focus ? "hidden min-[900px]:block" : "block"}`}>
          {!draft || !active ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 text-center" data-testid="desk-empty">
              <Petal size={44} />
              <p className="m-0 font-mono text-[22px]">A blank page is waiting</p>
              <p className="m-0 max-w-90 text-body">Pick a page on the left, or start a new one. Everything saves as you type.</p>
              <button type="button" className="btn btn-primary" onClick={createNew}>Start writing</button>
            </div>
          ) : (
            <div className="mx-auto flex max-w-180 flex-col gap-4 pb-44">
              {!focus && (
                <>
                  <div>
                    <p className="m-0 mb-2 text-[13px] text-muted">Which shelf does it belong on?</p>
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
                  </div>
                  {statusNote}
                </>
              )}

              {/* Write / Preview + formatting */}
              <div className="desk-tools" role="toolbar" aria-label="Writing tools">
                <div className="desk-seg" role="group" aria-label="View">
                  <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}><Icon d={ICONS.pen} size={15} /> Write</button>
                  <button type="button" aria-pressed={preview} onClick={async () => { await flush(); setPreview(true); }} data-testid="preview"><Icon d={ICONS.eye} size={15} /> Preview</button>
                </div>
                {!preview && (
                  <div className="flex items-center gap-1.5">
                    <button type="button" className="desk-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.current?.format("bold")} aria-label="Bold" title="Bold (Ctrl+B)"><strong className="font-mono">B</strong></button>
                    <button type="button" className="desk-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.current?.format("italic")} aria-label="Italic" title="Italic (Ctrl+I)"><em className="font-mono">I</em></button>
                    <button type="button" className="desk-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.current?.format("quote")} aria-label="Quote" title="Quote"><Icon d={ICONS.quote} size={15} /></button>
                    <button type="button" className="desk-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()} disabled={uploading > 0} data-testid="add-image">
                      <Icon d={ICONS.image} size={15} /> {uploading ? "Adding…" : "Picture"}
                    </button>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const fs = Array.from(e.target.files || []); if (fs.length) upload(fs); e.target.value = ""; }} />

              {preview ? (
                <article className="desk-preview" aria-label="Preview">
                  <p className="m-0 mb-1 text-[13px] text-muted">This is how readers will see it.</p>
                  <h1 className="m-0 mb-6 font-mono text-[clamp(26px,5vw,36px)] leading-tight font-normal">{draft.title || "Untitled"}</h1>
                  {draft.body.trim() ? <PostBody body={draft.body} verse={Boolean(cat?.verse)} /> : <p className="text-muted">Nothing written yet.</p>}
                </article>
              ) : (
                <>
                  <label htmlFor="desk-title" className="sr-only">Title</label>
                  <input
                    id="desk-title"
                    value={draft.title}
                    onChange={(e) => change({ title: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editor.current?.focusEnd(); } }}
                    placeholder="Title"
                    maxLength={200}
                    className="w-full border-0 bg-transparent font-mono text-[clamp(26px,5vw,36px)] leading-tight text-ink outline-none placeholder:text-muted focus-visible:outline-none"
                    data-testid="desk-title"
                  />
                  <BlockEditor
                    key={activeId}
                    ref={editor}
                    body={draft.body}
                    verse={Boolean(cat?.verse)}
                    onChange={onBody}
                    onImageRemoved={onImageRemoved}
                    onFiles={upload}
                  />
                </>
              )}
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
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="desk-action" aria-label={focus ? "Leave focus mode" : "Focus mode"} aria-pressed={focus} onClick={() => setFocus((f) => !f)} title="Focus mode (Esc to leave)">
                <Icon d={focus ? ICONS.unfocus : ICONS.focus} /> <span>{focus ? "Leave focus" : "Focus"}</span>
              </button>
              <button type="button" className="desk-action is-danger" onClick={() => setConfirmDelete(true)} data-testid="delete-page">
                <Icon d={ICONS.trash} /> <span>Delete</span>
              </button>
              {active.status !== "draft" && (
                <button type="button" className="btn btn-ghost min-h-11! px-4! text-[15px]" disabled={busy} onClick={() => setStatus("draft")}>Unpublish</button>
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

      <DeskDialog
        open={confirmDelete}
        title="Delete this page?"
        labelledBy="delete-title"
        onClose={() => setConfirmDelete(false)}
        actions={
          <>
            <button type="button" className="btn btn-ghost min-h-11!" onClick={() => setConfirmDelete(false)} autoFocus>Keep it</button>
            <button type="button" className="btn min-h-11! text-white" style={{ background: "var(--danger)", color: "var(--bg)" }} onClick={remove} data-testid="confirm-delete">Delete page</button>
          </>
        }
      >
        <p className="m-0">“{active?.title || "Untitled"}” will be gone for good{active?.status === "published" ? ", and taken off the site" : ""}. This can’t be undone.</p>
        {active?.status === "published" && <p className="m-0 mt-2 text-muted">Only want to hide it for now? Use <strong>Unpublish</strong> instead; it stays in your drafts.</p>}
      </DeskDialog>

      <DeskDialog
        open={helpOpen}
        title="How the desk works"
        labelledBy="help-title"
        onClose={() => setHelpOpen(false)}
        actions={<button type="button" className="btn btn-primary min-h-11!" onClick={() => setHelpOpen(false)}>Got it</button>}
      >
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          <li><strong>It saves by itself</strong> as you type, even offline. The dot at the bottom turns green when it’s safe.</li>
          <li><strong>Drafts are private.</strong> Nothing reaches readers until you press <strong>Publish</strong>. <strong>Unpublish</strong> hides it again.</li>
          <li><strong>A blank line</strong> starts a new stanza or paragraph.</li>
          <li><strong>Pictures:</strong> press <em>Picture</em>, drop a photo onto the page, or paste one. Use the buttons under a picture to move it or remove it.</li>
          <li><strong>B</strong> / <em>I</em> make selected words bold or italic; the quote button sets lines apart.</li>
          <li><strong>Preview</strong> shows exactly how the page will look on the site.</li>
          <li><strong>Getting back here:</strong> open <strong>thecommonplacebook.in/desk</strong> (or <em>/write</em>), or tap <em>Writing desk</em> at the very bottom of any page.{" "}
            {install ? <button type="button" className="underline underline-offset-2" onClick={doInstall}>Install it as an app</button> : <>On a phone, use <em>Add to Home Screen</em> to keep it as an app.</>}
          </li>
        </ul>
      </DeskDialog>
    </div>
  );
}
