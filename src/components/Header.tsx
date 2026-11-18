"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Petal } from "./Flowers";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/shelf", label: "Shelf" },
  { href: "/#work", label: "Writing" },
  { href: "/book", label: "Book" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
      if (e.key === "Tab" && sheetRef.current) {
        const f = [...sheetRef.current.querySelectorAll<HTMLElement>("a,button")];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = (href: string) => (href === path || (href !== "/" && !href.includes("#") && path.startsWith(href)) ? "page" : undefined);

  return (
    <header className="container-cpb relative z-40 py-5 sm:py-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex min-h-[44px] min-w-0 items-center gap-2 font-mono text-[15px] font-bold leading-tight no-underline min-[400px]:gap-2.5 min-[400px]:text-[18px] sm:text-[20px]" aria-label="The Commonplace Book, home">
          <Petal size={26} className="flex-none" />
          <span>The Commonplace Book</span>
        </Link>
        <div className="flex items-center gap-3 lg:gap-5">
          <nav aria-label="Main" className="hidden items-center gap-7 font-mono text-[16px] min-[960px]:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="nl" aria-current={current(l.href)}>{l.label}</Link>
            ))}
            <Link href="/contact" className="btn btn-primary !min-h-[44px] !px-[18px] font-mono !font-normal" aria-current={current("/contact")}>Say hello</Link>
          </nav>
          <ThemeToggle />
          <button
            ref={btnRef}
            type="button"
            className="icon-btn min-[960px]:!hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            data-testid="menu-button"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={sheetRef}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 top-[84px] z-40 overflow-y-auto bg-bg px-5 pb-10 min-[960px]:hidden"
          >
            <nav aria-label="Mobile" className="mx-auto flex max-w-[600px] flex-col gap-1 rounded-2xl border border-card bg-surface p-6 font-mono text-[22px]">
              <Link href="/" className="flex min-h-[48px] items-center no-underline" aria-current={current("/")}>Home</Link>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="flex min-h-[48px] items-center no-underline" aria-current={current(l.href)}>{l.label}</Link>
              ))}
              <Link href="/contact" className="btn btn-primary mt-3 self-start font-mono !text-[18px] !font-normal">Say hello</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
