import { expect, test } from "@playwright/test";
import { PAGES, WIDTHS, overflowReport, presetConsent, record, scrollThrough, smallTargets } from "./helpers";

const SHOT_WIDTHS = [320, 390, 768, 1440];

for (const scheme of ["light", "dark"] as const) {
  for (const p of PAGES) {
    for (const w of WIDTHS) {
      // Dark mode is checked at four representative widths; light at all ten.
      if (scheme === "dark" && !SHOT_WIDTHS.includes(w)) continue;
      test(`${p.name} @ ${w}px (${scheme})`, async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (m) => {
          // The 404 page's own document status is expected; anything else is a real error.
          if (m.type() === "error" && !(p.name === "404" && m.text().includes("404"))) errors.push(m.text());
        });
        page.on("pageerror", (e) => errors.push(e.message));
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: w, height: w < 768 ? 800 : 900 });
        await presetConsent(page);
        const res = await page.goto(p.path, { waitUntil: "networkidle" });
        expect(res?.status()).toBe(p.name === "404" ? 404 : 200);
        await scrollThrough(page);

        const ov = await overflowReport(page);
        const small = await smallTargets(page);
        const html = await page.evaluate(() => document.documentElement.className);
        record({ page: p.name, path: p.path, width: w, scheme, overflow: ov.overflow, scrollWidth: ov.sw, offenders: ov.offenders, smallTargets: small, consoleErrors: errors });

        if (SHOT_WIDTHS.includes(w)) await page.screenshot({ path: `qa/screens/${p.name}-${w}-${scheme}.png`, fullPage: true });

        expect(html.includes("dark")).toBe(scheme === "dark");
        expect(ov.overflow, `horizontal overflow: ${ov.offenders.join(", ")}`).toBe(false);
        expect(small, "touch targets under 44px").toEqual([]);
        expect(errors, "console errors").toEqual([]);
      });
    }
  }
}
