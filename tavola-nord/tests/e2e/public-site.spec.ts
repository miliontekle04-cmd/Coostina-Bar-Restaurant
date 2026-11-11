import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { useFreshIp, watchErrors } from "./helpers";

const pages = [
  { nb: "/", en: "/en", enHeading: /Coostina/ },
  { nb: "/meny", en: "/en/menu", enHeading: "Menu" },
  { nb: "/bestill-bord", en: "/en/book", enHeading: "Book a table" },
  { nb: "/selskap", en: "/en/events", enHeading: "Events" },
  { nb: "/om-oss", en: "/en/about", enHeading: "About" },
  { nb: "/personvern", en: "/en/privacy", enHeading: "Privacy" },
];

test.describe("pages and navigation", () => {
  for (const entry of pages) {
    test(`${entry.en} renders in both languages with SEO tags`, async ({ page }) => {
      const errors = watchErrors(page);

      const english = await page.goto(entry.en);
      expect(english?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(entry.enHeading);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${entry.en}$`));
      await expect(page.locator('link[rel="alternate"][hreflang="nb"]')).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveCount(1);

      const norwegian = await page.goto(entry.nb);
      expect(norwegian?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "nb");

      expect(errors).toEqual([]);
    });
  }

  test("the language switch keeps you on the same page", async ({ page }) => {
    await page.goto("/selskap");
    await page.getByRole("navigation", { name: "Hovedmeny" }).first().getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/events$/);
    await page.getByRole("navigation", { name: "Main menu" }).first().getByRole("link", { name: "Norsk" }).click();
    await expect(page).toHaveURL(/\/selskap$/);
  });

  test("header, dock and footer links go to working pages", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("navigation", { name: "Shortcuts" }).getByRole("link", { name: "Book a table" }).click();
    await expect(page).toHaveURL(/\/en\/book$/);
    await page.getByRole("navigation", { name: "Main menu" }).first().getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/en\/privacy$/);
  });

  test("unknown addresses get a real 404 in the right language", async ({ page }) => {
    const nb = await page.goto("/finnes-ikke");
    expect(nb?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Her er det ikke dekket");
    const en = await page.goto("/en/does-not-exist");
    expect(en?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("No table set here");
  });

  test("the internal /nb address sends people to the public one", async ({ page }) => {
    await page.goto("/nb");
    await expect(page).toHaveURL(/:\d+\/$/);
  });

  test("the sitemap, robots file and structured data are in place", async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/en/events");
    expect(sitemap).toContain("/selskap");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    await page.goto("/en");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe("Restaurant");
    for (const path of ["/", "/en", "/meny", "/en/events"]) {
      await page.goto(path);
      const url = await page.locator('meta[property="og:image"]').first().getAttribute("content");
      const image = await request.get(url!, { maxRedirects: 0 });
      expect(image.status(), path).toBe(200);
      expect(image.headers()["content-type"]).toContain("image/png");
    }
  });

  test("the FAQ opens and closes", async ({ page }) => {
    await page.goto("/en/about");
    const summary = page.getByText("What if I'm running late?");
    const answer = page.getByText("We hold your table for 15 minutes.");
    await expect(answer).toBeHidden();
    await summary.click();
    await expect(answer).toBeVisible();
    await summary.click();
    await expect(answer).toBeHidden();
  });
});

test.describe("menu", () => {
  test("filters by allergen, diet and search, and can be cleared", async ({ page }) => {
    await page.goto("/en/menu");
    const count = page.getByTestId("menu-count");
    await expect(count).toHaveText("34 dishes");

    await page.getByText("Gluten", { exact: true }).click();
    await expect(page).toHaveURL(/without=gluten/);
    const glutenFreeCount = await page.getByTestId("menu-item").count();
    expect(glutenFreeCount).toBeLessThan(34);
    await expect(page.getByRole("heading", { name: "Margherita" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Skrei al Forno" })).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(count).toHaveText("34 dishes");

    await page.getByLabel("Search the menu").fill("reindeer");
    await expect(count).toHaveText("1 of 34 dishes");
    await expect(page.getByRole("heading", { name: "Ragù di Reinsdyr" })).toBeVisible();
  });

  test("shows an empty state that gets you out of it", async ({ page }) => {
    await page.goto("/en/menu");
    await page.getByLabel("Search the menu").fill("zzzz");
    await expect(page.getByText("No dishes match your filters.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await expect(page.getByTestId("menu-count")).toHaveText("34 dishes");
  });

  test("a filtered address can be shared", async ({ page }) => {
    await page.goto("/en/menu?vegetarian=1&without=milk");
    await expect(page.getByLabel("Vegetarian")).toBeChecked();
    await expect(page.getByLabel("Milk")).toBeChecked();
    await expect(page.getByRole("heading", { name: "Burrata e Rabarbra" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Spaghetti Aglio e Olio" })).toBeVisible();
  });
});

test.describe("responsive layout", () => {
  const widths = [320, 390, 768, 1024, 1440];
  const paths = ["/", "/meny", "/bestill-bord", "/selskap", "/om-oss", "/personvern", "/en/events"];

  for (const width of widths) {
    test(`no sideways scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of paths) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test("the dock stays usable on a narrow phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/en");
    const dock = page.getByRole("navigation", { name: "Shortcuts" });
    await expect(dock).toBeInViewport();
    const box = await dock.locator("ul").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  });
});

test.describe("accessibility", () => {
  const paths = ["/", "/en/menu", "/en/book", "/en/events", "/en/about", "/en/privacy", "/finnes-ikke", "/admin/login"];
  for (const path of paths) {
    test(`${path} has no axe violations`, async ({ page }) => {
      await useFreshIp(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
      expect(summary).toEqual([]);
    });
  }

  test("no page breaks the security policy", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { violations: string[] }).violations = [];
      document.addEventListener("securitypolicyviolation", (event) =>
        (window as unknown as { violations: string[] }).violations.push(`${event.violatedDirective} ${event.blockedURI}`),
      );
    });
    for (const path of ["/en", "/en/menu", "/en/book", "/en/events", "/en/about"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => (window as unknown as { violations: string[] }).violations), path).toEqual([]);
    }
    // The form rules load on first submit, so check that step as well.
    await page.goto("/en/events");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("Fill in this field.").first()).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { violations: string[] }).violations)).toEqual([]);
  });

  test("on a phone, the dock steps aside while typing and comes back after", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto("/en/menu");
    const dock = page.getByRole("navigation", { name: "Shortcuts" });
    await expect(dock).toBeVisible();
    await page.getByLabel("Search the menu").focus();
    await expect(dock).toBeHidden();
    await page.getByLabel("Search the menu").blur();
    await expect(dock).toBeVisible();
  });

  test("the skip link is the first thing keyboard users reach", async ({ page }) => {
    await page.goto("/en/menu");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
  });
});
