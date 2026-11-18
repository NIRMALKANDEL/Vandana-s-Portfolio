"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { OPEN_PREFS_EVENT, readConsent, writeConsent } from "@/lib/analytics";
import { toast } from "sonner";

/** Cookie banner + preferences panel. Analytics stay off until the visitor says yes. */
export default function CookieConsent() {
  const [banner, setBanner] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const c = readConsent();
    if (!c) setBanner(true);
    else setAnalytics(c.analytics);
    const open = () => {
      lastFocus.current = document.activeElement as HTMLElement;
      setAnalytics(!!readConsent()?.analytics);
      setPrefs(true);
    };
    window.addEventListener(OPEN_PREFS_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, open);
  }, []);

  useEffect(() => {
    if (!prefs) return;
    const el = dialogRef.current;
    el?.querySelector<HTMLElement>("input,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && el) {
        const f = [...el.querySelectorAll<HTMLElement>("button, input")];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [prefs]);

  const close = () => {
    setPrefs(false);
    lastFocus.current?.focus?.();
  };

  const decide = (value: boolean, quiet = false) => {
    writeConsent(value);
    setAnalytics(value);
    setBanner(false);
    setPrefs(false);
    if (!quiet) toast(value ? "Thanks. Analytics are on." : "Only essential cookies are used.");
  };

  return (
    <>
      <AnimatePresence>
        {banner && !prefs && (
          <motion.section
            role="region"
            aria-label="Cookie consent"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[720px] rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_40px_rgba(46,42,51,.16)] sm:inset-x-6 sm:bottom-6"
            data-testid="cookie-banner"
          >
            <p className="m-0 font-mono text-[17px]">A small note about cookies</p>
            <p className="mt-2 mb-4 text-[15px] text-body">
              This site uses one essential setting to remember your light or dark choice. With your permission it also uses Google Analytics to see which pieces people read. Nothing is shared for ads.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary" onClick={() => decide(true)}>Accept analytics</button>
              <button className="btn btn-ghost" onClick={() => decide(false)}>Essential only</button>
              <button
                className="btn"
                style={{ textDecoration: "underline", textUnderlineOffset: 4, padding: "0 12px" }}
                onClick={() => { lastFocus.current = document.activeElement as HTMLElement; setPrefs(true); }}
              >
                Preferences
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prefs && (
          <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(28,26,32,.45)] p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && close()}>
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-title"
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              className="max-h-[90vh] w-full max-w-[520px] overflow-auto rounded-2xl border border-line bg-surface p-6"
            >
              <h2 id="cookie-title" className="m-0 font-mono text-2xl font-normal">Cookie preferences</h2>
              <p className="mt-2 text-[15px] text-body">Choose what this site may store on your device. You can change this any time from the footer.</p>
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4 rounded-xl border border-line p-4">
                  <div>
                    <p className="m-0 font-medium">Essential</p>
                    <p className="m-0 text-[14px] text-muted">Remembers your theme and this choice. Always on.</p>
                  </div>
                  <span className="text-[14px] text-muted">On</span>
                </div>
                <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-4">
                  <span>
                    <span className="block font-medium">Analytics</span>
                    <span className="block text-[14px] text-muted">Google Analytics 4: anonymous page views and which pieces are read.</span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={analytics}
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-1 h-6 w-6 flex-none accent-[var(--accent)]"
                  />
                </label>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn btn-primary" onClick={() => decide(analytics)}>Save choices</button>
                <button className="btn btn-ghost" onClick={close}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
