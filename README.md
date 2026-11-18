# The Commonplace Book

Portfolio and journal for the poet **Vandana Basnet**. It holds poems, short stories, letters and essays, her book *Things I Told the Sky*, and a private writing desk at `/desk` where only she can sign in and publish.

**Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS 4, Framer Motion, Lenis, MongoDB Atlas, NextAuth (Google), Cloudinary, Resend, Vercel, GA4 and Search Console.

---

## 1. Run it locally

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local      # then fill in what you have (see section 3)
npm run dev                     # http://localhost:3000
```

**No keys needed to look around.** Without `MONGODB_URI` the site runs on built-in sample pages: the real poem *The Progeny of Shame* plus clearly marked sample pages. The samples disappear once a database is connected.

**Try the desk without Google:** put `DESK_DEV_BYPASS=true` in `.env.local` and open `http://localhost:3000/desk`. This only works with `npm run dev` and is ignored in production. Without a database, desk pages live in memory and reset when the server restarts.

## 2. Pages

| URL | What it is |
|---|---|
| `/` | Home: hero with typewriter, strip, the shelf, Published in print, Selected writing, Postcards from the week, About, To reach out |
| `/shelf`, `/shelf/[micro-poetry · long-stanzas · short-stories · longer-worlds · after-hours]` | The shelf and one page per spine |
| `/journal` | Every published piece as postcards, with shelf filter and search |
| `/journal/[slug]` | A single piece (poems keep their line breaks), share buttons, related pieces, previous/next |
| `/book` | *Things I Told the Sky*: cover, back-cover poem, details, certificate, buy link |
| `/about` | Full bio. Education (B.Sc. Food Science, Psychology elective) appears **only** here |
| `/contact` | "To reach out" form |
| `/desk` | Private writing desk (Google sign-in, Vandana's email only) |
| any other URL | Custom 404 (a book fallen off the shelf) |

Also generated: `/sitemap.xml`, `/robots.txt`, `/feed.xml` (RSS), `/manifest.webmanifest`, `/og/[slug]` (a share image for each post), `/opengraph-image` (the site's default share image), and the favicon and app icons.

## 3. Set up the services (all have free plans)

Add every key to `.env.local` for local work and to **Vercel → Project → Settings → Environment Variables** for the live site. `.env.example` lists every key and what it does.

### MongoDB Atlas (stores her writing)
1. At [cloud.mongodb.com](https://cloud.mongodb.com), create a free **M0** cluster.
2. Under **Database Access**, add a user with a password.
3. Under **Network Access**, allow `0.0.0.0/0` (Vercel's addresses change).
4. Choose **Connect → Drivers** and copy the connection string into `MONGODB_URI`.
5. Import the poems in `content/` (Markdown with front matter):
   ```bash
   npm run import-content
   ```
   To add more, drop a `.md` file into `content/` (with `title:`, `category:` and an optional `date:`) and run it again. Running it twice is safe because it updates by slug.

### Google sign-in for the desk (NextAuth)
1. At [console.cloud.google.com](https://console.cloud.google.com), go to **APIs & Services → OAuth consent screen**. Choose External, name it "The Commonplace Book" and add her email as a test user.
2. Under **Credentials → Create credentials → OAuth client ID**, choose Web application.
   - Authorised JavaScript origins: `http://localhost:3000`, `https://thecommonplacebook.in` and `https://www.thecommonplacebook.in`
   - Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://thecommonplacebook.in/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, plus `DESK_ALLOWED_EMAIL` (her Gmail address).
4. Set `NEXTAUTH_SECRET` (generate it with `openssl rand -base64 32`) and `NEXTAUTH_URL` (the site address).

Any other Google account that tries to sign in is turned away with "That Google account can't open this desk."

### Cloudinary (images inside posts)
At [cloudinary.com](https://cloudinary.com), go to **Dashboard** and copy the Cloud name, API key and API secret into `CLOUDINARY_*`. In the desk, the image button uploads straight to Cloudinary and inserts the picture into the text. Images are served as WebP or AVIF automatically.

### Resend (contact form emails)
1. At [resend.com](https://resend.com), go to **API Keys → Create** and set `RESEND_API_KEY`.
2. Set `CONTACT_TO_EMAIL` to the inbox that should receive the notes.
3. Until the domain is verified, keep `RESEND_FROM=The Commonplace Book <onboarding@resend.dev>`. Resend's test sender only delivers to the email address your Resend account is registered with.
4. In Resend, go to **Domains → Add domain**, enter `thecommonplacebook.in` and add the DNS records it shows (at your domain registrar, or in Vercel if Vercel manages the DNS). Once it says Verified, set `RESEND_FROM=The Commonplace Book <hello@thecommonplacebook.in>` and redeploy.

Replies go straight to the visitor: the `Reply-To` header is set to their email. Messages are also saved in MongoDB (`messages` collection) when a database is connected.

### Google Analytics 4 and Search Console
- In GA4, go to **Admin → Data streams → Web**, copy the Measurement ID (`G-…`) and set it as `NEXT_PUBLIC_GA_ID`.
  GA only loads **after** a visitor accepts analytics in the cookie banner.
- Conversion events sent: `contact_sent`, `book_link_click`, `post_read` (plus `share`, `pick_one` and `shelf_open`). In GA4, go to **Admin → Events** and mark the first three as **key events**.
- In Search Console, add the property, choose **HTML tag**, put the `content` value in `NEXT_PUBLIC_GSC_VERIFICATION`, redeploy, verify, then submit `https://thecommonplacebook.in/sitemap.xml`. (Or choose the **Domain** property type and verify with a DNS TXT record.)

### Optional public details
- `NEXT_PUBLIC_CONTACT_EMAIL`: shown under "To reach out" (hidden when empty).
- `NEXT_PUBLIC_SAME_AS`: comma-separated profile links (LinkedIn, Instagram) added to the Person schema.

## 4. Deploy to Vercel (free)

1. Push this folder to a GitHub repository.
2. At [vercel.com/new](https://vercel.com/new), import the repo. The framework is detected as Next.js and no build settings need changing.
3. Add the environment variables from section 3, with `NEXT_PUBLIC_SITE_URL=https://thecommonplacebook.in` and `NEXTAUTH_URL=https://thecommonplacebook.in`.
4. Deploy, then run `npm run import-content` once (locally, with the production `MONGODB_URI`).

### Connect thecommonplacebook.in
1. **Vercel → Project → Settings → Domains → Add** `thecommonplacebook.in`, and also add `www.thecommonplacebook.in` set to redirect to it.
2. At the registrar where the domain was bought, add the DNS records Vercel shows. Usually that's an **A** record for `@` pointing to `76.76.21.21` and a **CNAME** for `www` pointing to `cname.vercel-dns.com`. Use the exact values Vercel displays. The padlock (HTTPS) is set up automatically once DNS has updated, which can take from a few minutes up to a day.
3. In Google Cloud, make sure the origins and redirect URI from "Google sign-in for the desk" include `https://thecommonplacebook.in`.
4. Verify the domain in Resend (section 3) and switch `RESEND_FROM` to an `@thecommonplacebook.in` address.
5. Add the site in Search Console and submit the sitemap.
6. Redeploy in Vercel so the new environment variables take effect.

Old shelf links (for example `/shelf/poetry`) redirect permanently to the new shelves.

## 5. How Vandana uses the desk

- Open `https://<site>/desk` on her phone and choose **Sign in with Google**.
- **Install it as an app:** in Chrome on Android use **⋮ → Add to Home screen**; in Safari on iPhone use **Share → Add to Home Screen**. It opens straight to the desk.
- **New page** → pick a shelf (Micro Poetry, Long Stanzas, Short Stories, Longer Worlds, After Hours) → title → write. It **saves as she types** (and keeps a copy on the phone if the connection drops).
- **Publish** puts it live at once as a postcard on the homepage and in the Journal. **Schedule** picks a date and time; it goes live then (pages refresh within about 5 minutes).
- **Unpublish** moves it back to drafts. **Focus mode** hides everything except the words (Esc to leave).
- The petal counter at the top is her **streak**: consecutive days with something published.
- Formatting: an empty line starts a new stanza or paragraph, `*italics*`, `**bold**`, `> ` for a quote. Images come from the picture button.

## 6. Updating the site's text and images

- Most text (name, tagline, book details, shelf descriptions) lives in `src/lib/site.ts`.
- **Her photo:** replace `public/images/vandana.jpg` with a sharper portrait (about 4:5). The current one is low resolution; the frame is already sized for a better one.
- Book images are in `public/images/` (`book-cover.jpg`, `back-cover.jpg`, `publication-certificate.jpg`).
- Colours (light and dark) are the CSS variables at the top of `src/app/globals.css`, taken from the approved style tile.
- To regenerate the app icons after changing the flower, run `npm run icons`.

## 7. Built in

- Light and dark mode: follows the phone's setting on the first visit, then remembers the choice, with a 400 ms cross-fade.
- Reduced motion: every animation, the typewriter, Lenis smooth scroll and page transitions switch off when the device asks for it.
- Accessibility: skip link, visible focus rings, 44 px touch targets, keyboard-operable shelf (arrow keys), menu and cookie dialog (focus trapped, Esc closes).
- SEO: unique titles and descriptions, canonical links, Open Graph and Twitter cards, an auto-generated share image per post, an XML sitemap, robots.txt, RSS, Schema.org (Person, WebSite, Book, BlogPosting, BreadcrumbList), breadcrumbs, and related-post links.
- Performance: next/image (AVIF/WebP, lazy below the fold), self-hosted fonts via `next/font` (Courier Prime and DM Sans, no Google Fonts requests), and static pages with 5-minute revalidation.
- Security: strict Content-Security-Policy, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, `noindex` on the desk, a same-origin check plus session check on every desk API call, a contact form honeypot and a per-IP rate limit.
- Loading skeletons (journal, posts, shelves, desk), empty states, and toast notifications.

## 8. Tests

```bash
npm run build && npm start -- -p 3100        # terminal 1 (production build)
npx playwright install chromium              # first time only
npx playwright test                          # starts a dev server on :3200 for the desk tests
```

The tests cover the following. See `TEST-REPORT.md` for the latest results.
- every page at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px in light mode, and at 4 widths in dark mode: no horizontal overflow, touch targets of at least 44 px, no console errors, with screenshots
- interactions, keyboard and focus, cookie consent, reduced motion, SEO, schema, headers and images
- the full desk flow: write, autosave, publish, schedule, focus mode and streak

## Project layout

```
src/app/(site)/        public pages (home, shelf, journal, book, about, contact)
src/app/desk/          the writing desk
src/app/api/           contact, desk posts, Cloudinary signature, NextAuth
src/components/        UI (Header, Shelf, BookCover, Cards, ContactForm, CookieConsent, desk/…)
src/lib/               site config, posts store (MongoDB or sample), auth, schema, OG images
content/               Markdown pieces for `npm run import-content`
tests/                 Playwright tests
```
