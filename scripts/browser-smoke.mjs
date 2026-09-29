import { access, mkdir, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

let executablePath = process.env.BROWSER_EXECUTABLE;
if (!executablePath) {
  for (const candidate of [
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ]) {
    try {
      await access(candidate);
      executablePath = candidate;
      break;
    } catch {
      /* Use bundled Chromium if neither is installed. */
    }
  }
}
const browser = await chromium.launch({ executablePath, headless: true });
const snapshot = JSON.parse(
  await readFile(new URL("../src/data/repos.json", import.meta.url), "utf8"),
);
const countLabel = (count) => count.toString().padStart(2, "0");
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      failedRequests.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5173/", {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".repo-row")).toHaveCount(snapshot.repos.length);
  await expect(page.locator(".repo-row").first()).toContainText(
    "Instagram Friendship Graph",
  );
  const forks = snapshot.repos.filter((repo) => repo.fork);
  const originals = snapshot.repos.filter((repo) => !repo.fork);
  if (forks.length) {
    await page
      .getByRole("button", { name: `Forks ${countLabel(forks.length)}` })
      .click();
    await expect(page.locator(".repo-row")).toHaveCount(forks.length);
    const forkLinks = await page
      .locator(".repo-row")
      .evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
    assert.deepEqual(
      new Set(forkLinks),
      new Set(forks.map((repo) => repo.html_url)),
    );
    await page
      .getByRole("button", {
        name: `Originals ${countLabel(originals.length)}`,
      })
      .click();
    await expect(page.locator(".repo-row")).toHaveCount(originals.length);
  }
  await page
    .getByRole("button", {
      name: `Selected ${countLabel(snapshot.repos.length)}`,
    })
    .click();
  await page.getByLabel("Repository sort order").selectOption("recent");
  const activity = await page
    .locator(".repo-row")
    .evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
  const updatedByUrl = new Map(
    snapshot.repos.map((repo) => [repo.html_url, repo.updated_at]),
  );
  for (let i = 1; i < activity.length; i++)
    assert.ok(
      updatedByUrl.get(activity[i - 1]) >= updatedByUrl.get(activity[i]),
      "Recent activity ordering",
    );
  await page.getByLabel("Repository sort order").selectOption("aura");
  for (const name of [
    "django-server",
    "openclaw",
    "streamlit-example",
    "calpeptides",
    "health-helper-v1",
  ]) {
    await expect(
      page.locator(`.repo-row[href="https://github.com/nimalp123/${name}"]`),
    ).toHaveCount(0);
  }
  await expect(page.locator(".rb-build")).toHaveCount(8);
  await expect(
    page.getByRole("link", {
      name: "Open the live Rayaboy website in a new tab",
    }),
  ).toHaveAttribute("href", "https://rayaboy.com");
  await expect(page.locator(".rb-open-site")).toContainText(
    "Open the live site",
  );
  await page.locator(".rb-screenshot img").scrollIntoViewIfNeeded();
  await page.locator(".rb-screenshot img").evaluate((image) => image.decode());
  await page.getByRole("button", { name: "1st degree", exact: true }).click();
  await expect(page.locator(".network-node")).toHaveCount(13);
  await page
    .getByRole("button", { name: "Inspect Alex, degree 1", exact: true })
    .click();
  await expect(page.locator(".network-inspector strong")).toHaveText("Alex");
  await page.getByRole("button", { name: "3rd degree", exact: true }).click();
  await expect(page.locator(".network-node")).toHaveCount(193);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Reset graph view" }).click();
  await expect(page.locator(".network-inspector strong")).toHaveText(
    "It’s a small world.",
  );
  await page.getByRole("button", { name: "Pause graph animation" }).click();
  await expect(page.locator(".network")).not.toHaveClass(/network-playing/);
  await page.getByRole("button", { name: "Play graph animation" }).click();
  const graphButton = page.getByRole("button", {
    name: "See the published graph",
  });
  await graphButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".graph-dialog img").evaluate((image) => image.decode());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(graphButton).toBeFocused();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  console.log(
    "Accessibility findings:",
    JSON.stringify(
      accessibility.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      null,
      2,
    ),
  );
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    assert.equal(
      dimensions.scroll,
      dimensions.viewport,
      `Horizontal overflow at ${width}px`,
    );
    console.log(`Responsive layout: ${width}px OK`);
  }
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: /python3 -m friendship_graph demo/ })
    .click();
  await expect(page.getByRole("button", { name: /COPIED/ })).toBeVisible();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    "python3 -m friendship_graph demo",
  );
  await page.evaluate(() => {
    window.getSelection()?.removeAllRanges();
    scrollTo(0, 0);
  });
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.screenshot({
    path: "artifacts/social-card.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, [], "Browser runtime errors");
  assert.deepEqual(failedRequests, [], "Failed asset requests");
  assert.deepEqual(accessibility.violations, [], "Accessibility violations");
  console.log(
    "PASS: repository filters and ordering, graph controls, modal and focus, clipboard, accessibility, responsive layouts, and assets.",
  );
} finally {
  await browser.close();
}
