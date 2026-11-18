import { expect, test } from "@playwright/test";
import { presetConsent } from "./helpers";

test.describe("navigation and theme", () => {
  test("theme toggle switches and is remembered", async ({ page }) => {
    await presetConsent(page);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByTestId("theme-toggle")).toHaveAttribute("aria-label", "Switch to light mode");
  });

  test("first visit follows the device setting (dark)", async ({ page }) => {
    await presetConsent(page);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/about");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("mobile menu opens, traps focus, closes with Escape", async ({ page }) => {
    await presetConsent(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    const btn = page.getByTestId("menu-button");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    const sheet = page.getByRole("navigation", { name: "Mobile" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Home" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(btn).toBeFocused();
    await btn.click();
    await sheet.getByRole("link", { name: "Journal" }).click();
    await expect(page).toHaveURL(/\/journal$/);
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
  });

  test("keyboard: skip link first, every focused control shows a focus ring", async ({ page }) => {
    await presetConsent(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    const missing: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== "none";
        return { ring, label: `${el.tagName} ${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}` };
      });
      if (info && !info.ring) missing.push(info.label);
    }
    expect(missing).toEqual([]);
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await presetConsent(page);
    await page.goto("/journal");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe("homepage interactions", () => {
  test.beforeEach(async ({ page }) => {
    await presetConsent(page);
    await page.goto("/");
  });

  test("hero: the site name is inked, typewriter ends on 'Imagined Worlds'; heading complete for screen readers", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1.locator(".sr-only")).toHaveText("The Commonplace Book, a living archive by Vandana Basnet: poems, stories and imagined worlds");
    await expect(h1.locator("svg text")).toHaveText("The Commonplace Book");
    await expect(page.getByText("By Vandana Basnet", { exact: true })).toBeVisible();
    await expect(page.locator(".hp")).toHaveCount(12);
    const typed = page.getByTestId("hero-typed");
    await expect.poll(() => typed.textContent(), { timeout: 8000 }).toMatch(/^(P|Po|Poe|Poem|Poems|S)/);
    await expect(typed).toHaveText("Imagined Worlds", { timeout: 15000 });
    await expect(page.getByRole("link", { name: "Read the latest" })).toHaveAttribute("href", "/journal");
    await expect(page.getByRole("link", { name: "About the book" }).first()).toHaveAttribute("href", "/book");
  });

  test("hero plays again on every visit to the homepage", async ({ page }) => {
    await expect(page.getByTestId("hero-typed")).toHaveText("Imagined Worlds", { timeout: 15000 });
    await page.reload();
    const typed = page.getByTestId("hero-typed");
    await expect.poll(() => typed.textContent(), { timeout: 8000 }).toMatch(/^(P|Po|Poe|Poem|Poems|S)/);
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector(".ink-name")!).animationName);
    expect(anim).toBe("ink-draw");
  });

  test("book: paperback and e-book open their shops in a new tab; postcards have no postmark", async ({ page }) => {
    const paper = page.getByRole("link", { name: /^Paperback/ }).first();
    await expect(paper).toHaveAttribute("href", /flipkart\.com/);
    await expect(paper).toHaveAttribute("target", "_blank");
    const ebook = page.getByRole("link", { name: /^E-book/ }).first();
    await expect(ebook).toHaveAttribute("href", "https://ebooks.bookleafpub.com/product-page/things-i-told-the-sky");
    await expect(ebook).toHaveAttribute("target", "_blank");
    await expect(page.getByText("my first published book")).toBeVisible();
    await expect(page.getByTestId("postcard").first()).not.toContainText("THE SKY");
    await expect(page.getByText("Writing is how we teach a fleeting moment to stay.")).toBeVisible();
  });

  test("shelf: five books; a book opens into the reading view and closes back onto the shelf", async ({ page }) => {
    const row = page.getByTestId("shelf-row");
    await row.scrollIntoViewIfNeeded();
    await expect(row.locator("[data-spine]")).toHaveCount(6);
    await expect(row.locator("[data-spine]")).toHaveText(["Micro Poetry", "Long Stanzas", "Short Stories", "Longer Worlds", "After Hours", "Articles"]);
    await expect(page.getByText(/shelves ·/)).toHaveCount(0);
    await expect(page.getByText(/^0\d — /)).toHaveCount(0);
    const thick = await row.locator('[data-spine="longer-worlds"]').evaluate((e) => e.getBoundingClientRect().width);
    const thin = await row.locator('[data-spine="short-stories"]').evaluate((e) => e.getBoundingClientRect().width);
    expect(thick).toBeGreaterThan(thin);
    const book = row.getByRole("button", { name: /^Long Stanzas/ });
    await book.click();
    const reader = page.getByRole("dialog");
    await expect(reader).toBeVisible();
    await expect(reader.getByRole("heading", { name: "The Progeny of Shame" })).toBeVisible();
    await expect(reader).toContainText("I shall not hide the crimson");
    await expect(reader).toContainText("min read");
    await expect(page.getByRole("button", { name: "Close the book" })).toBeFocused({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(reader).toHaveCount(0, { timeout: 5000 });
    await expect(book).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(row.getByRole("button", { name: /^Short Stories/ })).toBeFocused();
  });

  test("shelf: Pick one for me opens a book; its links lead to the piece and the shelf", async ({ page }) => {
    await page.getByTestId("pick-one").scrollIntoViewIfNeeded();
    await page.getByTestId("pick-one").click();
    const reader = page.getByRole("dialog");
    await expect(reader).toBeVisible();
    await reader.getByRole("link", { name: /^Browse / }).click();
    await expect(page).toHaveURL(/\/shelf\/(micro-poetry|long-stanzas|short-stories|longer-worlds|after-hours|articles)$/);
  });

  test("book cover opens on tap to show the back-cover poem", async ({ page }) => {
    const book = page.getByTestId("book-cover");
    await book.scrollIntoViewIfNeeded();
    await expect(book).toHaveAttribute("aria-pressed", "false");
    await book.click();
    await expect(book).toHaveAttribute("aria-pressed", "true");
    await expect(book).toHaveClass(/isopen/);
    await expect(book).toContainText("I hold my silence like a fragile glass");
  });

  test("postcards link to posts and the real poem is listed", async ({ page }) => {
    const cards = page.getByTestId("postcard");
    await expect(cards).toHaveCount(4);
    await page.getByRole("link", { name: /The Progeny of Shame/ }).first().click();
    await expect(page).toHaveURL(/\/journal\/the-progeny-of-shame$/);
    await expect(page.locator("h1")).toHaveText("The Progeny of Shame");
  });

  test("buy link opens Flipkart in a new tab and fires book_link_click", async ({ page, context }) => {
    await page.evaluate(() => { (window as unknown as { gtag: unknown; __ev: unknown[] }).__ev = []; (window as unknown as { gtag: (...a: unknown[]) => void }).gtag = (...a: unknown[]) => (window as unknown as { __ev: unknown[] }).__ev.push(a); });
    await context.route("https://www.flipkart.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>Flipkart</title>" }));
    const link = page.getByRole("link", { name: /^Paperback/ }).first();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    const [popup] = await Promise.all([context.waitForEvent("page"), link.click()]);
    await popup.waitForLoadState();
    expect(popup.url()).toContain("flipkart.com/things-told-sky");
    await popup.close();
    const ev = await page.evaluate(() => (window as unknown as { __ev: unknown[][] }).__ev);
    expect(ev.some((e) => e[0] === "event" && e[1] === "book_link_click")).toBe(true);
  });
});

test.describe("journal, shelf and posts", () => {
  test.beforeEach(async ({ page }) => presetConsent(page));

  test("journal filter and search, with an empty state", async ({ page }) => {
    await page.goto("/journal");
    await expect(page.getByTestId("postcard").first()).toBeVisible();
    const all = await page.getByTestId("postcard").count();
    expect(all).toBeGreaterThan(1);
    await page.getByRole("group", { name: "Filter by shelf" }).getByRole("button", { name: "Long Stanzas" }).click();
    await expect(page.getByTestId("postcard")).toHaveCount(1);
    await expect(page).toHaveURL(/shelf=long-stanzas/);
    await page.getByRole("group", { name: "Filter by shelf" }).getByRole("button", { name: "All" }).click();
    await page.getByLabel("Search the journal").fill("crimson");
    await expect(page.getByTestId("postcard")).toHaveCount(1);
    await page.getByLabel("Search the journal").fill("zzzz-nothing");
    await expect(page.getByTestId("empty-state")).toContainText("Nothing matches");
  });

  test("footer and contact: profile links open in a new tab; back to the top works", async ({ page }) => {
    await page.goto("/");
    const contact = page.locator("#contact");
    await expect(contact.getByRole("link", { name: /Read on Substack/ })).toHaveAttribute("target", "_blank");
    await expect(contact.getByRole("link", { name: /Connect on LinkedIn/ })).toHaveAttribute("href", /linkedin\.com\/in\/vandana-basnet/);
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /^RSS/ })).toHaveAttribute("href", "/feed.xml");
    await expect(footer.getByText("Writing is how we teach a fleeting moment to stay.")).toBeVisible();
    await footer.getByRole("button", { name: "Back to the top" }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeLessThan(50);
  });

  test("RSS link opens a readable page that explains how to follow", async ({ page }) => {
    await page.goto("/feed.xml");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Follow The Commonplace Book");
    await expect(page.getByText("How to follow")).toBeVisible();
    await expect(page.getByRole("link", { name: "Subscribe on Substack" })).toHaveAttribute("href", "https://substack.com/@vandanabasnet");
    await expect(page.getByRole("link", { name: "The Progeny of Shame" })).toBeVisible();
  });

  test("shelf page lists pieces; old shelf addresses redirect to the new shelves", async ({ page }) => {
    await page.goto("/shelf/long-stanzas");
    await expect(page.getByTestId("post-row")).toHaveCount(1);
    await page.goto("/shelf/poetry");
    await expect(page).toHaveURL(/\/shelf\/long-stanzas$/);
    await page.goto("/shelf/book-notes");
    await expect(page).toHaveURL(/\/shelf\/after-hours$/);
    await expect(page.locator("h1")).toHaveText("After Hours");
    await page.goto("/journal?shelf=poetry");
    await expect(page.getByRole("button", { name: "Long Stanzas" })).toHaveAttribute("aria-pressed", "true");
  });

  test("unknown shelf is a 404", async ({ page }) => {
    const res = await page.goto("/shelf/cooking");
    expect(res?.status()).toBe(404);
  });

  test("post page: breadcrumbs, related links, prev/next, share, schema", async ({ page }) => {
    await page.goto("/journal/the-progeny-of-shame");
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("link")).toHaveText(["Home", "Shelf", "Long Stanzas"]);
    await expect(crumbs.locator("[aria-current=page]")).toHaveText("The Progeny of Shame");
    await expect(page.getByTestId("related")).toHaveCount(2);
    await expect(page.getByRole("navigation", { name: "More entries" })).toBeVisible();
    const types = await page.$$eval('script[type="application/ld+json"]', (s) => s.flatMap((x) => [JSON.parse(x.textContent || "{}")].flat().map((o) => o["@type"])));
    expect(types).toEqual(expect.arrayContaining(["BlogPosting", "BreadcrumbList", "WebSite", "Person"]));
    await expect(page.locator("verse, .verse p")).toHaveCount(5);
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Copy link" }).click();
    await expect(page.getByText("Link copied").first()).toBeVisible();
  });

  test("post_read fires when the reader reaches the end", async ({ page }) => {
    await page.addInitScript(() => { (window as unknown as { __ev: unknown[] }).__ev = []; (window as unknown as { gtag: (...a: unknown[]) => void }).gtag = (...a: unknown[]) => (window as unknown as { __ev: unknown[] }).__ev.push(a); });
    await page.goto("/journal/the-progeny-of-shame");
    await page.locator("#post-end").scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __ev: unknown[][] }).__ev.some((e) => e[1] === "post_read"))).toBe(true);
  });
});

test.describe("contact form", () => {
  test.beforeEach(async ({ page }) => presetConsent(page));

  test("validates fields inline", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Please tell me your name.")).toBeVisible();
    await expect(page.getByText("That email doesn't look quite right.")).toBeVisible();
    await expect(page.getByLabel("Your name")).toBeFocused();
    await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  });

  test("successful send: toast, button says Sent, contact_sent fires", async ({ page }) => {
    await page.addInitScript(() => { (window as unknown as { __ev: unknown[] }).__ev = []; (window as unknown as { gtag: (...a: unknown[]) => void }).gtag = (...a: unknown[]) => (window as unknown as { __ev: unknown[] }).__ev.push(a); });
    await page.route("**/api/contact", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Asha");
    await page.getByLabel("Email").fill("asha@example.com");
    await page.getByLabel("Message").fill("I loved The Progeny of Shame.");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Your note is on its way")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sent" })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __ev: unknown[][] }).__ev.some((e) => e[1] === "contact_sent"))).toBe(true);
  });

  test("server error shows an error toast", async ({ page }) => {
    await page.route("**/api/contact", (r) => r.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Messages can\'t be delivered right now."}' }));
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Asha");
    await page.getByLabel("Email").fill("asha@example.com");
    await page.getByLabel("Message").fill("Hello there, a test note.");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Messages can't be delivered right now.")).toBeVisible();
  });

  test("API rejects bad input and quietly drops honeypot bots", async ({ request }) => {
    const bad = await request.post("/api/contact", { data: { name: "A", email: "nope", message: "hi" } });
    expect(bad.status()).toBe(400);
    const bot = await request.post("/api/contact", { data: { name: "Bot", email: "bot@x.com", message: "buy cheap things now", website: "spam" } });
    expect(bot.status()).toBe(200); // bots get a fake "ok" and nothing is sent
  });
});

test.describe("cookie consent", () => {
  test("banner on first visit; analytics only after consent; preferences reopen", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByTestId("cookie-banner");
    await expect(banner).toBeVisible();
    expect(await page.locator('script[src*="googletagmanager"]').count()).toBe(0);
    await banner.getByRole("button", { name: "Essential only" }).click();
    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cpb-consent-v1") || "{}").analytics)).toBe(false);
    expect(await page.locator('script[src*="googletagmanager"]').count()).toBe(0);

    await page.getByRole("button", { name: "Cookie preferences" }).click();
    const dialog = page.getByRole("dialog", { name: "Cookie preferences" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.route("https://www.googletagmanager.com/**", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
    await page.getByRole("button", { name: "Cookie preferences" }).click();
    await dialog.getByRole("switch").check();
    await dialog.getByRole("button", { name: "Save choices" }).click();
    await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(1);
  });

  test("banner does not return after a choice", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cookie-banner").getByRole("button", { name: "Accept analytics" }).click();
    await page.reload();
    await expect(page.getByTestId("cookie-banner")).toHaveCount(0);
  });
});

test.describe("reduced motion", () => {
  test("nothing moves around: petals fade in where they rest; the title is still inked and the words still type", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await presetConsent(page);
    await page.goto("/");
    const petal = page.locator(".hp").first();
    await page.waitForTimeout(400);
    const a = await petal.boundingBox();
    await page.waitForTimeout(500);
    const b = await petal.boundingBox();
    expect(Math.round(a!.y)).toBe(Math.round(b!.y));
    await expect(page.getByTestId("hero-typed")).toHaveText("Imagined Worlds", { timeout: 12000 });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("footer svg")!).animationName)).toBe("none");
  });
});

test.describe("SEO and metadata", () => {
  const pages = ["/", "/shelf", "/shelf/long-stanzas", "/journal", "/journal/the-progeny-of-shame", "/book", "/about", "/contact"];

  test("unique titles, meta descriptions, canonicals and Open Graph on every page", async ({ page }) => {
    const titles = new Set<string>();
    const descs = new Set<string>();
    for (const p of pages) {
      await page.goto(p);
      const title = await page.title();
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
      const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
      expect(title.length, p).toBeGreaterThan(10);
      expect(desc && desc.length > 50, `${p} description`).toBe(true);
      expect(canonical, p).toMatch(new RegExp(`${p === "/" ? "/?" : p}$`));
      expect(ogTitle, p).toBeTruthy();
      expect(ogImage, p).toBeTruthy();
      titles.add(title);
      descs.add(desc!);
      expect(await page.locator("h1").count(), `${p} h1 count`).toBe(1);
    }
    expect(titles.size).toBe(pages.length);
    expect(descs.size).toBe(pages.length);
  });

  test("schema: Person + WebSite + Book on home, Book on /book", async ({ page }) => {
    const types = async () => page.$$eval('script[type="application/ld+json"]', (s) => s.flatMap((x) => [JSON.parse(x.textContent || "{}")].flat().map((o) => o["@type"])));
    await page.goto("/");
    expect(await types()).toEqual(expect.arrayContaining(["WebSite", "Person", "Book"]));
    await page.goto("/book");
    expect(await types()).toEqual(expect.arrayContaining(["Book", "BreadcrumbList"]));
  });

  test("robots, sitemap, RSS, manifest, OG image, icons", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /desk");
    expect(robots).toContain("Sitemap:");
    const sm = await (await request.get("/sitemap.xml")).text();
    expect(sm).toContain("/journal/the-progeny-of-shame");
    expect(sm).not.toContain("sample-");
    expect(sm).toContain("/shelf/long-stanzas");
    const rss = await request.get("/feed.xml");
    expect(rss.headers()["content-type"]).toContain("xml");
    const body = await rss.text();
    expect(body).toContain('<?xml-stylesheet href="/feed.xsl"');
    expect(body).toContain("<rss version=\"2.0\"");
    expect((await request.get("/feed.xsl")).status()).toBe(200);
    const mf = await (await request.get("/manifest.webmanifest")).json();
    expect(mf.start_url).toBe("/desk");
    expect(mf.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    const og = await request.get("/og/the-progeny-of-shame");
    expect(og.headers()["content-type"]).toBe("image/png");
    for (const u of ["/favicon.ico", "/icon.svg", "/apple-icon.png", "/icon-192.png", "/icon-512.png", "/sw.js", "/opengraph-image"]) {
      expect((await request.get(u)).status(), u).toBe(200);
    }
  });

  test("security headers", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"]).toContain("max-age");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["x-powered-by"]).toBeUndefined();
    expect((await request.get("/desk")).headers()["x-robots-tag"]).toContain("noindex");
  });

  test("images: AVIF/WebP from next/image, below-the-fold images lazy", async ({ page, request }) => {
    const avif = await request.get("/_next/image?url=%2Fimages%2Fbook-cover.jpg&w=640&q=75", { headers: { Accept: "image/avif,image/webp,*/*" } });
    expect(avif.headers()["content-type"]).toBe("image/avif");
    const webp = await request.get("/_next/image?url=%2Fimages%2Fbook-cover.jpg&w=640&q=75", { headers: { Accept: "image/webp,*/*" } });
    expect(webp.headers()["content-type"]).toBe("image/webp");
    await presetConsent(page);
    await page.goto("/book");
    await expect(page.getByAltText(/Back cover/)).toHaveAttribute("loading", "lazy");
    await page.goto("/");
    await expect(page.getByAltText(/Vandana Basnet smiling/)).toHaveAttribute("loading", "lazy");
  });

  test("fonts are self-hosted via next/font (no Google Fonts requests)", async ({ page }) => {
    const ext: string[] = [];
    page.on("request", (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) ext.push(r.url()); });
    await presetConsent(page);
    await page.goto("/");
    expect(ext).toEqual([]);
    const fam = await page.evaluate(() => getComputedStyle(document.querySelector(".h-section")!).fontFamily);
    expect(fam).toMatch(/courier/i);
    const name = await page.evaluate(() => getComputedStyle(document.querySelector(".ink-name")!).fontFamily);
    expect(name).toMatch(/script/i);
  });
});

test.describe("writing desk (production, signed out)", () => {
  test("desk shows the sign-in screen and the API is locked", async ({ page, request }) => {
    await presetConsent(page);
    await page.goto("/desk");
    await expect(page.getByRole("heading", { name: "The writing desk" })).toBeVisible();
    await expect(page.getByTestId("google-signin")).toBeVisible();
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    expect((await request.get("/api/desk/posts")).status()).toBe(401);
    expect((await request.post("/api/desk/posts", { data: {} })).status()).toBe(401);
    expect((await request.patch("/api/desk/posts/x", { data: { status: "published" } })).status()).toBe(401);
    expect((await request.post("/api/desk/upload")).status()).toBe(401);
  });

  test("an access-denied return shows a clear message", async ({ page }) => {
    await presetConsent(page);
    await page.goto("/desk?error=AccessDenied");
    await expect(page.getByText("That Google account can't open this desk")).toContainText("Only Vandana's account can sign in");
  });
});
