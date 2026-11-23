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

test("pictures: add one, see it as a card, remove it with one tap, undo, then remove for good", async ({ page }) => {
  test.setTimeout(120_000);
  await presetConsent(page);
  // Cloudinary is mocked: the signature endpoint and the upload itself.
  const url = "https://res.cloudinary.com/demo/image/upload/v1/commonplace/test-sky.png";
  const deletes: string[] = [];
  await page.route("**/api/desk/upload", async (route) => {
    if (route.request().method() === "DELETE") { deletes.push(route.request().postData() || ""); return route.fulfill({ json: { ok: true } }); }
    return route.fulfill({ json: { signature: "x", timestamp: 1, apiKey: "k", cloudName: "demo", folder: "commonplace", allowed_formats: "png" } });
  });
  await page.route("https://api.cloudinary.com/**", (route) => route.fulfill({ json: { secure_url: url } }));
  await page.route("https://res.cloudinary.com/**", (route) => route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64") }));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/desk");
  await page.getByTestId("new-page").click();
  await page.getByTestId("desk-title").fill("With a picture");
  await page.getByTestId("desk-body").fill("Above the picture");

  await page.locator('input[type="file"]').setInputFiles({ name: "sky.png", mimeType: "image/png", buffer: Buffer.from("png") });
  const card = page.locator(".desk-figure");
  await expect(card).toHaveCount(1);
  await expect(card.locator("img")).toHaveAttribute("src", /commonplace\/test-sky/);
  // No raw markdown anywhere in the writing boxes.
  for (const v of await page.locator(".desk-editor textarea").evaluateAll((ts) => ts.map((t) => (t as HTMLTextAreaElement).value))) expect(v).not.toContain("![");

  await card.getByPlaceholder(/Describe this picture/).fill("an evening sky");
  await page.getByTestId("preview").click();
  await expect(page.locator(".desk-preview img")).toHaveAttribute("alt", "an evening sky");
  await page.getByRole("button", { name: "Write" }).click();

  // Remove → Undo brings it back in the same place.
  await page.getByTestId("remove-image").click();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(card).toHaveCount(1);
  await expect(page.getByTestId("desk-body")).toHaveValue("Above the picture");

  // Remove for good → once the undo window closes the file is cleaned up.
  await page.getByTestId("remove-image").click();
  await expect(card).toHaveCount(0);
  await expect(page.getByTestId("save-state")).toContainText("Saved", { timeout: 10_000 });
  await expect.poll(() => deletes.length, { timeout: 15_000 }).toBe(1);
  expect(deletes[0]).toContain("test-sky");
});

test("deleting a page asks in the site's own dialog, and 'Keep it' keeps it", async ({ page }) => {
  await presetConsent(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/desk");
  await page.getByTestId("new-page").click();
  await page.getByTestId("desk-title").fill("Delete me maybe");
  await expect(page.getByTestId("save-state")).toContainText("Saved", { timeout: 10_000 });

  let nativeDialog = false;
  page.on("dialog", (d) => { nativeDialog = true; d.dismiss(); });
  await page.getByTestId("delete-page").click();
  await expect(page.getByRole("dialog", { name: "Delete this page?" })).toBeVisible();
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByTestId("desk-title")).toHaveValue("Delete me maybe");

  await page.getByTestId("delete-page").click();
  await page.getByTestId("confirm-delete").click();
  await expect(page.getByText("Page deleted.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Your pages" })).not.toContainText("Delete me maybe");
  expect(nativeDialog).toBe(false);
});

test("easy ways in: /write and /admin lead to the desk", async ({ page }) => {
  await page.goto("/write");
  await expect(page).toHaveURL(/\/desk$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/desk$/);
});
