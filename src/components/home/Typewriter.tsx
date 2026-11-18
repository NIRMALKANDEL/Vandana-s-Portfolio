"use client";

import { useEffect, useState } from "react";

const PHRASES = ["Poems", "Stories", "Imagined Worlds"];
const LAST = PHRASES[PHRASES.length - 1];
/** Starts once her title is inked (see the hero timeline in globals.css). */
const START_MS = 3100;

/**
 * Types "Poems", rubs it out, "Stories", rubs it out, then stays on "Imagined Worlds".
 * Plays on every visit to the homepage. Typing is not motion, so it also runs for reduced-motion
 * visitors (it just starts sooner, since the rest of the hero appears without the drawing delay).
 */
export default function Typewriter() {
  const [text, setText] = useState(LAST);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    setText("");
    (async () => {
      await wait(reduced ? 900 : START_MS);
      for (let p = 0; p < PHRASES.length && alive; p++) {
        const w = PHRASES[p];
        for (let i = 1; i <= w.length && alive; i++) { setText(w.slice(0, i)); await wait(80); }
        if (p === PHRASES.length - 1) break;
        await wait(1200);
        for (let i = w.length - 1; i >= 0 && alive; i--) { setText(w.slice(0, i)); await wait(40); }
        await wait(250);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <p className="hero-typed m-0 min-h-[1.6em] font-mono text-[clamp(20px,3.4vw,28px)] leading-[1.6] text-ink" aria-hidden="true" data-testid="hero-typed">
      <span style={{ background: "var(--hl)", padding: "0 8px", borderRadius: 4 }}>{text}</span>
      <span className="cursor-blink" style={{ display: "inline-block", width: 3, height: "0.95em", background: "var(--cursor)", marginLeft: 4, verticalAlign: "-0.12em" }} />
    </p>
  );
}
