import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self'",
  "connect-src 'self' https://api.cloudinary.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self'",
  ...(isDev || !(process.env.NEXT_PUBLIC_SITE_URL || "").startsWith("https") ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Lets the test dev server (port 3200) build into its own folder without touching the production build.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/**"],
    "/og/[slug]": ["./assets/**"],
  },
  // Old shelf addresses (before the five-book shelf) point to their new homes.
  async redirects() {
    const moved: Record<string, string> = {
      poetry: "long-stanzas", microfiction: "micro-poetry", letters: "after-hours", essays: "articles", "book-notes": "after-hours",
    };
    // Easy ways into the writing desk: /write, /admin, /login, /dashboard and desk.thecommonplacebook.in.
    const toDesk = ["/write", "/admin", "/login", "/dashboard"].map((source) => ({ source, destination: "/desk", permanent: false }));
    const deskHost = { source: "/:path*", has: [{ type: "host" as const, value: "desk.thecommonplacebook.in" }], destination: "https://thecommonplacebook.in/desk", permanent: false };
    return [
      ...Object.entries(moved).map(([from, to]) => ({ source: `/shelf/${from}`, destination: `/shelf/${to}`, permanent: true })),
      ...toDesk,
      deskHost,
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/desk/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/desk", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
};

export default nextConfig;
