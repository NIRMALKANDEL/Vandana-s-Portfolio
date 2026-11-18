# Test report — The Commonplace Book

Run on 17 November 2026 with Playwright 1.63 (Chromium), against a production build (`next build && next start`) and, for the writing desk, the dev server with the desk login bypass.

**Result: 202 tests, 202 passed, 0 failed.**

## 1. Layout at 10 widths

Each cell means the page loaded and, after scrolling through it, had **no horizontal overflow**, **no tappable element under 44×44 px** (links inside sentences excepted, per WCAG 2.5.8), and **no console errors**. Light mode was checked at all 10 widths and dark mode at 320, 390, 768 and 1440.

| Page | URL | 320 | 360 | 375 | 390 | 430 | 768 | 1024 | 1280 | 1440 | 1920 | dark 320/390/768/1440 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| shelf | `/shelf` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| shelf-poetry | `/shelf/poetry` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| shelf-empty | `/shelf/book-notes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| journal | `/journal` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| post-poem | `/journal/the-progeny-of-shame` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| post-prose | `/journal/sample-essay` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| book | `/book` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| about | `/about` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| contact | `/contact` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| 404 | `/this-page-does-not-exist` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |
| desk-signin | `/desk` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ✅ ✅ ✅ |

Totals: 168 page×width×theme checks · overflow 0 · undersized targets 0 · console errors 0.

## 2. Behaviour (`tests/interactions.spec.ts`)

| Area | What was checked | Result |
|---|---|---|
| Theme | Toggle switches light/dark, choice survives reload; first visit follows the device's dark setting | ✅ |
| Mobile menu | Opens as a sheet, focus moves in and is trapped, Esc closes and returns focus, links navigate and close it | ✅ |
| Keyboard | Skip link is first and visible; 30 Tab stops on the homepage all show a focus ring; skip link jumps to main | ✅ |
| Typewriter | Phrases type and rewrite; the full sentence is in the heading for screen readers | ✅ |
| Shelf | Click pulls a spine out (aria-pressed), the preview changes, arrow keys move between spines, "Pick one for me" picks another, "Browse this shelf" opens the shelf page | ✅ |
| Book | Cover opens on tap to show the back-cover poem | ✅ |
| Buy link | Opens Flipkart in a new tab (`noopener`) and sends `book_link_click` | ✅ |
| Journal | Shelf filter (updates the URL), search, "nothing matches" empty state | ✅ |
| Shelves | Category page lists pieces; empty shelf shows an empty state; unknown shelf returns 404 | ✅ |
| Post page | Breadcrumbs, related posts, previous/next, copy link with toast, stanzas kept, BlogPosting + BreadcrumbList schema | ✅ |
| post_read | Sent when the reader reaches the end of a piece | ✅ |
| Contact | Inline validation (focus moves to the first error, aria-invalid); success: toast, button says "Sent", `contact_sent` sent; server error: error toast; API returns 400 on bad input; honeypot bots get a fake "ok" | ✅ |
| Cookie consent | Banner on first visit; no GA script before consent; "Essential only" stored; preferences panel reopens from the footer and closes with Esc; GA loads only after analytics is switched on; banner doesn't return | ✅ |
| Reduced motion | Typewriter holds still, CSS animations are off | ✅ |
| SEO | Unique title and description, canonical, og:title and og:image on 8 pages, one h1 each; Person, WebSite and Book schema on home, Book on /book | ✅ |
| Files | robots.txt (desk blocked), sitemap (real posts only, no samples), RSS, manifest (start_url /desk, 192 and 512 icons), per-post OG PNG, favicon, apple icon, sw.js | ✅ |
| Security headers | CSP with frame-ancestors 'none', X-Frame-Options DENY, nosniff, Referrer-Policy, HSTS, Permissions-Policy, no X-Powered-By, noindex on /desk | ✅ |
| Images | next/image serves AVIF and WebP; below-the-fold images are lazy | ✅ |
| Fonts | Self-hosted through next/font, no requests to Google Fonts, Courier Prime headings | ✅ |
| Desk (signed out) | Sign-in screen, noindex, every desk API returns 401, access-denied message | ✅ |

## 3. Writing desk (`tests/desk.spec.ts`, dev server with login bypass)

| Flow | Result |
|---|---|
| On a 375 px phone: new page → Poetry → title and two stanzas → autosaves ("Saved · 21 words") → Publish → toast, button becomes "Update", streak updates, no overflow, action buttons fit the screen and are at least 44 px tall | ✅ |
| The new poem is the first postcard in the Journal and on the homepage, and its page keeps both stanzas | ✅ |
| On desktop: schedule a letter for tomorrow; it appears under "Scheduled" and stays off the public Journal | ✅ |
| A local backup is written while typing; focus mode hides everything else, Esc restores it | ✅ |
| Publishing without a title is blocked with a toast and focus moves to the title | ✅ |

## 4. Fixed during testing

- Short links ("Book", "RSS", breadcrumb "Home") were narrower than 44 px. Nav, footer and breadcrumb links now have a 44×44 minimum.
- The desk crashed in production when `NEXTAUTH_SECRET` wasn't set. It now shows the sign-in screen with a "not configured yet" note.
- /about had no share image. It now uses the site's share image.
- Long poem lines wrapped awkwardly on phones. Verse is now sized for small screens and wrapped lines get a hanging indent.
- The skills strip showed separator dots at the start of lines on phones. The dots now show only on wider screens.
- A local-network setting (`upgrade-insecure-requests`) is only added when the site runs over HTTPS.

## 5. Not covered by these tests (need live keys)

- Real Google sign-in, MongoDB Atlas writes, Cloudinary uploads and Resend delivery. The code paths are in place; check them once after adding the keys (README, section 3).
- Lighthouse scores and real-device Safari/iOS: worth a pass after the first deploy.

Screenshots of every page at 320, 390, 768 and 1440 px (light and dark) are in `qa-screens/` (JPEG, desktop shots scaled to 720 px wide).
