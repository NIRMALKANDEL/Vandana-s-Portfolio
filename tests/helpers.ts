import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const WIDTHS = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];

export const PAGES = [
  { name: "home", path: "/" },
  { name: "shelf", path: "/shelf" },
  { name: "shelf-long-stanzas", path: "/shelf/long-stanzas" },
  { name: "shelf-after-hours", path: "/shelf/after-hours" },
  { name: "journal", path: "/journal" },
  { name: "post-poem", path: "/journal/the-progeny-of-shame" },
  { name: "post-prose", path: "/journal/sample-longer-world" },
  { name: "book", path: "/book" },
  { name: "about", path: "/about" },
  { name: "contact", path: "/contact" },
  { name: "404", path: "/this-page-does-not-exist" },
  { name: "desk-signin", path: "/desk" },
];

/** Skip the cookie banner for layout tests (it is tested on its own). */
export async function presetConsent(page: Page, analytics = false) {
  await page.addInitScript((a) => {
    try { localStorage.setItem("cpb-consent-v1", JSON.stringify({ analytics: a, at: "test" })); } catch {}
  }, analytics);
}

/** Scroll the whole page so lazy images load and reveal animations run. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

export async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const sw = document.documentElement.scrollWidth;
    const scrollers = (el: Element | null): boolean => {
      for (let n = el?.parentElement; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (["auto", "scroll", "hidden", "clip"].includes(s.overflowX)) return true;
      }
      return false;
    };
    const offenders: string[] = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > vw + 1 && !scrollers(el)) {
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : "";
        offenders.push(`${el.tagName.toLowerCase()}${id}${cls} right=${Math.round(r.right)}`);
      }
    });
    return { vw, sw, overflow: sw > vw, offenders: offenders.slice(0, 8) };
  });
}

/** Interactive elements smaller than 44×44 that are not links inside running text. */
export async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll<HTMLElement>("a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=radio], [role=switch]").forEach((el) => {
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none") return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (el.closest(".sr-only, [aria-hidden=true]") || el.classList.contains("skip-link")) return;
      if (el.tabIndex < 0 && el.tagName === "INPUT") return; // honeypot / hidden file input
      if (el.tagName === "INPUT" && (el as HTMLInputElement).type === "checkbox") {
        const label = el.closest("label");
        if (label && label.getBoundingClientRect().height >= 44) return;
      }
      // Inline links in a sentence are exempt (WCAG 2.5.8 inline exception).
      if (el.tagName === "A" && el.closest("p, li p, dd, figcaption") && s.display === "inline") return;
      if (r.height < 43.5 || r.width < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    });
    return out;
  });
}

const LOG = path.join(process.cwd(), "qa", "metrics.jsonl");
export function record(row: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, JSON.stringify(row) + "\n");
}
