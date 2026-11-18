"use client";

import { useEffect, type CSSProperties } from "react";
import { motion, useAnimationControls, type Variants } from "framer-motion";

type Kind = "lav" | "flower" | "petal";
// [kind, colour token, x %, y %, final rotation, start delay s, horizontal drift px]
const PIECES: [Kind, string, number, number, number, number, number][] = [
  ["lav", "--hp-lav", 4, 8, -16, 0, 50],
  ["lav", "--hp-lav", 92, 48, 14, 0.9, -60],
  ["flower", "--hp-rose", 87, 7, 15, 0.3, -40],
  ["flower", "--hp-lilac", 5, 64, -10, 0.45, 70],
  ["petal", "--hp-rose2", 14, 86, 20, 0.6, 60],
  ["petal", "--hp-peach", 19, 11, 40, 0.15, -30],
  ["petal", "--hp-lilac", 78, 88, -25, 0.75, 40],
  ["petal", "--hp-rose", 74, 6, 30, 0.2, -70],
  ["petal", "--hp-peach", 94, 87, 5, 1.0, -50],
  ["petal", "--hp-lilac", 2, 37, 60, 0.5, 80],
  ["flower", "--hp-peach", 85, 70, -20, 0.65, -60],
  ["petal", "--hp-rose", 31, 93, -35, 1.1, 30],
];

function Piece({ kind, color }: { kind: Kind; color: string }) {
  if (kind === "lav")
    return (
      <svg width="18" height="58" viewBox="0 0 18 58" aria-hidden="true" focusable="false">
        <line x1="9" y1="14" x2="9" y2="58" strokeWidth="1.5" style={{ stroke: "var(--stem)" }} />
        <path d="M9 40 q-7 -3 -8 -9" fill="none" strokeWidth="1.2" style={{ stroke: "var(--stem)" }} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <circle key={k} cx={k % 2 ? 11.5 : 6.5} cy={4 + k * 3.3} r="3" style={{ fill: `var(${color})` }} />
        ))}
      </svg>
    );
  if (kind === "flower")
    return (
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="17" cy="9" rx="5" ry="8" transform={`rotate(${a} 17 17)`} style={{ fill: `var(${color})` }} />
        ))}
        <circle cx="17" cy="17" r="3.4" style={{ fill: "var(--gold)" }} />
      </svg>
    );
  return (
    <svg width="24" height="15" viewBox="0 0 24 15" aria-hidden="true" focusable="false">
      <ellipse cx="12" cy="7.5" rx="11" ry="5.5" style={{ fill: `var(${color})` }} />
      <line x1="2" y1="7.5" x2="22" y2="7.5" stroke="#fff" strokeOpacity=".45" strokeWidth=".6" />
    </svg>
  );
}

const STARS = [[8, 20], [16, 52], [24, 8], [33, 30], [41, 14], [58, 9], [64, 34], [71, 18], [80, 42], [88, 26], [95, 12], [12, 78], [52, 22], [90, 64]];

type C = { r: number; dx: number; fall: number; d: number; dur: number };
/** Hidden above the hero; a slow, leaf-like drift down (steady fall, soft side-to-side sway); at rest. */
const variants: Variants = {
  hidden: (c: C) => ({ x: c.dx, y: -c.fall, rotate: c.r - 70, opacity: 0 }),
  fall: (c: C) => ({
    x: [c.dx, c.dx * 0.55 + 26, c.dx * 0.2 - 20, 10, 0],
    y: -0,
    rotate: [c.r - 70, c.r + 24, c.r - 14, c.r + 5, c.r],
    opacity: [0, 1, 1],
    transition: {
      delay: c.d,
      y: { duration: c.dur, ease: [0.3, 0.05, 0.25, 1] },
      x: { duration: c.dur, ease: "easeInOut", times: [0, 0.3, 0.58, 0.82, 1] },
      rotate: { duration: c.dur, ease: "easeInOut", times: [0, 0.3, 0.58, 0.82, 1] },
      opacity: { duration: c.dur, times: [0, 0.12, 1] },
    },
  }),
  /** Reduced motion: no falling, the pieces simply fade in where they rest. */
  fade: (c: C) => ({
    x: 0, y: 0, rotate: c.r, opacity: 0.92,
    transition: { x: { duration: 0 }, y: { duration: 0 }, rotate: { duration: 0 }, opacity: { duration: 1.2, delay: c.d * 0.6 } },
  }),
};

/** Pressed petals and lavender that drift down and settle around the hero; tiny stars at night. */
export function HeroPetals() {
  const controls = useAnimationControls();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.start(reduced ? "fade" : "fall");
  }, [controls]);

  return (
    <div className="hero-petals pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="hero-stars">
        {STARS.map(([x, y], i) => (
          <i key={i} className={y > 20 && y < 80 ? "hp-mid" : undefined} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.6}s` }} />
        ))}
      </div>
      {PIECES.map(([kind, color, x, y, r, d, dx], i) => {
        const c: C = { r, dx, d, fall: y * 7 + 140, dur: 4.4 + (i % 4) * 0.4 };
        return (
          <motion.div
            key={i}
            className={y > 25 && y < 80 ? "hp hp-mid" : "hp"}
            style={{ "--x": `${x}%`, "--y-pct": `${y}%` } as CSSProperties}
            custom={c}
            variants={variants}
            initial="hidden"
            animate={controls}
          >
            <div className="sw" style={{ animationDelay: `${c.d + c.dur}s` }}>
              <Piece kind={kind} color={color} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** The site's name, written out in ink with a small lavender flourish underneath. */
export function InkName({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 760 140" className="mx-auto block h-auto w-full max-w-[720px]" aria-hidden="true" focusable="false">
      <text x="380" y="94" textAnchor="middle" fontSize="80" className="ink-name">{name}</text>
      <path d="M230 124 C 320 114, 440 132, 530 118" fill="none" strokeWidth="1.6" strokeLinecap="round" className="ink-line" />
    </svg>
  );
}
