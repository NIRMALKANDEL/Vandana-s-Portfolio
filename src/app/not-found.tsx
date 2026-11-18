import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** A fallen book on the shelf and a way home. */
export default function NotFound() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main" className="container-cpb flex flex-col items-center gap-6 py-16 text-center">
        <svg viewBox="0 0 360 200" className="h-auto w-full max-w-[360px]" aria-hidden="true">
          <rect x="40" y="40" width="34" height="130" rx="3" style={{ fill: "var(--cat-long-stanzas)" }} />
          <rect x="80" y="56" width="34" height="114" rx="3" style={{ fill: "var(--cat-short-stories)" }} />
          <rect x="120" y="70" width="34" height="100" rx="3" style={{ fill: "var(--cat-short-stories)" }} />
          <g style={{ transformOrigin: "200px 170px", transform: "rotate(-14deg)" }}>
            <rect x="166" y="70" width="34" height="100" rx="3" style={{ fill: "var(--cat-after-hours)" }} />
          </g>
          <rect x="196" y="140" width="110" height="30" rx="3" style={{ fill: "var(--cat-micro-poetry)" }} />
          <rect x="20" y="170" width="320" height="12" rx="3" style={{ fill: "var(--plank)" }} />
          <g style={{ fill: "var(--petal)" }}>
            <ellipse cx="320" cy="150" rx="5" ry="9" transform="rotate(30 320 150)" />
            <ellipse cx="300" cy="120" rx="4" ry="7" transform="rotate(-20 300 120)" />
          </g>
        </svg>
        <p className="eyebrow">404 — a book fell off the shelf</p>
        <h1 className="m-0 font-mono text-[clamp(32px,5vw,48px)] font-normal leading-[1.15]">This page isn&apos;t here</h1>
        <p className="m-0 max-w-[460px] text-body">It may have moved, or it was never written. The rest of the shelf is just where it should be.</p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <Link href="/" className="btn btn-primary">Take me home</Link>
          <Link href="/journal" className="btn btn-ghost">Open the journal</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
