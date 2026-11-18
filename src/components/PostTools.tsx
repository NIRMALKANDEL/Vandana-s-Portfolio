"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

/** Thin reading-progress bar at the top of a post. */
export function ReadingProgress({ color }: { color: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-[3px]">
      <div className="h-[3px] w-full origin-left" style={{ background: color, transform: `scaleX(${p})` }} />
    </div>
  );
}

/** Fires post_read once a reader reaches the end of the piece (or stays 45 s). */
export function ReadTracker({ slug, category }: { slug: string; category: string }) {
  const sent = useRef(false);
  useEffect(() => {
    const end = document.getElementById("post-end");
    const fire = () => {
      if (sent.current) return;
      sent.current = true;
      track("post_read", { slug, category });
    };
    const timer = window.setTimeout(fire, 45000);
    const io = end ? new IntersectionObserver((e) => e[0].isIntersecting && fire(), { threshold: 0.1 }) : null;
    if (end && io) io.observe(end);
    return () => { window.clearTimeout(timer); io?.disconnect(); };
  }, [slug, category]);
  return null;
}

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      track("share", { method: "copy", url });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. You can copy the address bar instead.");
    }
  };
  const text = encodeURIComponent(`${title} by Vandana Basnet`);
  const u = encodeURIComponent(url);
  const pill = "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-[18px] text-[15px] no-underline";
  return (
    <div className="mt-14 flex flex-wrap gap-3 border-t border-line pt-6" aria-label="Share this piece" role="group">
      <button type="button" onClick={copy} className={`${pill} cursor-pointer border-ink bg-transparent font-sans text-ink`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a className={pill} href={`https://wa.me/?text=${text}%20${u}`} target="_blank" rel="noopener noreferrer" onClick={() => track("share", { method: "whatsapp" })}>Share on WhatsApp</a>
      <a className={pill} href={`https://x.com/intent/post?text=${text}&url=${u}`} target="_blank" rel="noopener noreferrer" onClick={() => track("share", { method: "x" })}>Share on X</a>
    </div>
  );
}
