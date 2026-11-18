import { expect, test } from "@playwright/test";
import { presetConsent } from "./helpers";

// Runs against the dev server with DESK_DEV_BYPASS=true (in-memory store, no Google).
test.describe.configure({ mode: "serial" });

test("phone: write a poem, autosave, publish; it appears as a postcard and the streak updates", async ({ page }) => {
  test.setTimeout(120_000);
  await presetConsent(page);
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/desk");
  const before = Number(await page.getByTestId("streak").locator("strong").textContent());

  await page.getByTestId("new-page").click();
  await expect(page.getByTestId("desk-title")).toBeVisible();
  await page.getByRole("radio", { name: "Micro Poetry" }).click();
  await page.getByTestId("desk-title").fill("Tea at the window");
  await page.getByTestId("desk-body").fill("The kettle hums a small song\nthe rain keeps time\n\nand I keep the cup warm\nfor someone who isn't coming");
  await expect(page.getByTestId("save-state")).toContainText("Saved", { timeout: 10_000 });
  await expect(page.getByTestId("save-state")).toContainText("21 words");

  // Thumb-reachable action bar stays inside a 375px screen.
  const bar = await page.getByTestId("publish").boundingBox();
  expect(bar!.x + bar!.width).toBeLessThanOrEqual(375);
  expect(bar!.height).toBeGreaterThanOrEqual(44);

  await page.getByTestId("publish").click();
  await expect(page.getByText("Published. It's on the homepage")).toBeVisible();
  await expect(page.getByTestId("publish")).toHaveText("Update");
  const after = Number(await page.getByTestId("streak").locator("strong").textContent());
  expect(after).toBeGreaterThanOrEqual(Math.max(1, before));

  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(noOverflow).toBe(true);

  await page.goto("/journal");
  await expect(page.getByTestId("postcard").first()).toContainText("Tea at the window");
  await page.goto("/");
  await expect(page.getByTestId("postcard").first()).toContainText("Tea at the window");
  await page.getByTestId("postcard").first().click();
  await expect(page.locator("h1")).toHaveText("Tea at the window");
  await expect(page.locator(".verse p")).toHaveCount(2);
});

test("desktop: schedule a page for tomorrow; it stays off the public site", async ({ page }) => {
  await presetConsent(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/desk");
  await page.getByTestId("new-page").click();
  await page.getByRole("radio", { name: "After Hours" }).click();
  await page.getByTestId("desk-title").fill("A letter for next spring");
  await page.getByTestId("desk-body").fill("Dear sky, I'll write again when the mango trees flower.");
  await expect(page.getByTestId("save-state")).toContainText("Saved", { timeout: 10_000 });
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(page.getByLabel("Publish on")).toBeVisible();
  // The confirm button sits in the panel, above the action row.
  await page.getByRole("button", { name: "Schedule", exact: true }).first().click();
  await expect(page.getByText(/Scheduled for/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Scheduled · 1/ })).toBeVisible();
  await page.goto("/journal");
  await expect(page.getByText("A letter for next spring")).toHaveCount(0);
});

test("autosave keeps a local copy and focus mode hides the chrome", async ({ page }) => {
  await presetConsent(page);
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/desk");
  await page.getByTestId("new-page").click();
  await page.getByTestId("desk-title").fill("Draft kept safe");
  await page.getByTestId("desk-body").fill("one line");
  const backup = await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("cpb-desk-backup-")));
  expect(backup).toBe(true);
  await expect(page.getByTestId("save-state")).toContainText("Saved", { timeout: 10_000 });
  await page.getByRole("button", { name: "Focus mode" }).click();
  await expect(page.getByTestId("streak")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("streak")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Drafts ·/ })).toBeVisible();
});

test("publishing without a title is blocked with a toast", async ({ page }) => {
  await presetConsent(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/desk");
  await page.getByTestId("new-page").click();
  await page.getByTestId("desk-body").fill("words without a name");
  await page.getByTestId("publish").click();
  await expect(page.getByText("Give it a title first.")).toBeVisible();
  await expect(page.getByTestId("desk-title")).toBeFocused();
});
