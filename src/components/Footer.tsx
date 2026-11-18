"use client";

import Link from "next/link";
import { FooterSprig, Petal } from "./Flowers";
import ProfileLinks from "./ProfileLinks";
import { openConsentPreferences } from "@/lib/analytics";
import { site } from "@/lib/site";

const EXPLORE: [string, string][] = [
  ["/shelf", "The shelf"],
  ["/journal", "Journal"],
  ["/book", "Things I Told the Sky"],
  ["/about", "About Vandana"],
  ["/contact", "Contact"],
];

function toTop() {
  const lenis = (window as Window & { __cpbLenis?: { scrollTo: (t: number) => void } }).__cpbLenis;
  if (lenis) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  document.querySelector<HTMLElement>("#main, main")?.focus({ preventScroll: true });
}

/** The closing page of the site: a scalloped paper edge, the tagline, where to go next and where else to find her. */
export default function Footer() {
  return (
    <footer className="site-footer">
      <svg className="site-footer-edge" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 24V12 Q 25 0 50 12 T 100 12 T 150 12 T 200 12 T 250 12 T 300 12 T 350 12 T 400 12 T 450 12 T 500 12 T 550 12 T 600 12 T 650 12 T 700 12 T 750 12 T 800 12 T 850 12 T 900 12 T 950 12 T 1000 12 T 1050 12 T 1100 12 T 1150 12 T 1200 12 V24Z" />
      </svg>
      <span className="site-footer-petal is-a" aria-hidden="true"><Petal size={26} /></span>
      <span className="site-footer-petal is-b" aria-hidden="true"><Petal size={18} /></span>

      <div className="container-cpb site-footer-grid">
        <div className="site-footer-brand">
          <FooterSprig />
          <p className="m-0 font-mono text-[22px] text-ink">{site.name}</p>
          <p className="site-footer-tagline">{site.tagline}</p>
        </div>

        <nav aria-label="Footer" className="site-footer-col">
          <p className="site-footer-label">Explore</p>
          <ul className="m-0 list-none p-0">
            {EXPLORE.map(([h, l]) => (
              <li key={h}>
                <Link href={h} className="nl inline-flex min-h-[44px] items-center">{l}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer-col">
          <p className="site-footer-label">Follow along</p>
          <ProfileLinks withRss />
          <button type="button" onClick={toTop} className="site-footer-top">
            Back to the top
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </button>
        </div>
      </div>

      <div className="container-cpb site-footer-base">
        <p className="m-0">© {new Date().getFullYear()} {site.author} · {site.name}</p>
        <button type="button" onClick={openConsentPreferences} className="nl inline-flex min-h-[44px] cursor-pointer items-center border-0 bg-transparent p-0 text-[14px] text-muted">
          Cookie preferences
        </button>
      </div>
    </footer>
  );
}
