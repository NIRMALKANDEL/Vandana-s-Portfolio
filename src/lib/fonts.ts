import localFont from "next/font/local";

// Self-hosted via next/font (no request to Google at runtime, no layout shift).
export const courier = localFont({
  variable: "--font-courier",
  display: "swap",
  src: [
    { path: "../fonts/courier-prime-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/courier-prime-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/courier-prime-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["Courier New", "monospace"],
});

export const dmSans = localFont({
  variable: "--font-dm",
  display: "swap",
  src: [
    { path: "../fonts/dm-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/dm-sans-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/dm-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/dm-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["system-ui", "sans-serif"],
});

// Handwritten script used only for her name in the hero (drawn in ink).
export const script = localFont({
  variable: "--font-script",
  display: "swap",
  src: [{ path: "../fonts/dancing-script-latin-500-normal.woff2", weight: "500", style: "normal" }],
  fallback: ["cursive"],
});

// Literary serif for the bookshelf: section heading, spine titles and the reading view.
export const serif = localFont({
  variable: "--font-serif",
  display: "swap",
  src: [
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  fallback: ["Georgia", "serif"],
  preload: false, // only used below the fold, so it does not hold up the first paint
});
