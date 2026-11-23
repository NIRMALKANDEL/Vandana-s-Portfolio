"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import CookieConsent from "./CookieConsent";
import Analytics from "./Analytics";

function SmoothScroll() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/desk")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -16 }, lerp: 0.12 });
    // Shared so dialogs (the shelf's reading view) can pause page scrolling while open.
    (window as Window & { __cpbLenis?: Lenis }).__cpbLenis = lenis;
    return () => {
      lenis.destroy();
      delete (window as Window & { __cpbLenis?: Lenis }).__cpbLenis;
    };
  }, [path]);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  // The writing desk is private and runs no analytics, so it doesn't need the cookie banner.
  const onDesk = usePathname().startsWith("/desk");
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="cpb-theme">
      <MotionConfig reducedMotion="user">
        <SmoothScroll />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: "var(--btn)", color: "var(--btn-text)", border: "none", borderRadius: 999, fontFamily: "var(--font-dm)", fontSize: 15 },
          }}
        />
        {!onDesk && <CookieConsent />}
        <Analytics />
      </MotionConfig>
    </ThemeProvider>
  );
}
