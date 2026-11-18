"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * A paragraph that shows in full on tablets and laptops. On phones it is cut to a few lines,
 * with "Show more" / "See less" to open and close it.
 */
export default function BioText({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`bio ${className}`}>
      <p id={id} className={`bio-text m-0 text-body ${open ? "is-open" : ""}`}>{children}</p>
      <button type="button" className="bio-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? "See less" : "Show more"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .25s ease" }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
