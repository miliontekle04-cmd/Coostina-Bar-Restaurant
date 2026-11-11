import { expect, test } from "@playwright/test";
import { ADMIN, adminLogin, formAlert, freshIp, guest, nextWednesday, useFreshIp, watchErrors } from "./helpers";

test.describe("event planner", () => {
  test("guests, menus and price stay in step", async ({ page }) => {
    await page.goto("/en/events");
    const summary = page.getByRole("complementary", { name: "Summary" });

    await expect(summary).toContainText("24 guests");
    await expect(summary).toContainText("0 of 24 assigned");
    await expect(summary).toContainText("Choose a menu to see the price");

    await page.getByRole("button", { name: "More: The feast" }).click();
    await page.getByRole("button", { name: "More: The feast" }).click();
    await expect(summary).toContainText("2 of 24 assigned");
    await expect(page.getByTestId("estimate")).toHaveText("1,690 kr");
    await expect(summary).toContainText("22 without a menu");

    // Filling the rest uses up the party, so no menu can take more.
    await page.getByRole("button", { name: "Give the rest this menu" }).first().click();
    await expect(summary).toContainText("24 of 24 assigned");
    await expect(page.getByTestId("estimate")).toHaveText("14,780 kr");
    await expect(page.getByRole("button", { name: "More: From the garden" })).toBeDisabled();

    // Fewer guests takes people off the last menus first.
    await page.getByLabel("Number of guests", { exact: true }).last().fill("10");
    await page.getByLabel("Number of guests", { exact: true }).last().blur();
    await expect(summary).toContainText("10 of 10 assigned");
    await expect(page.getByTestId("estimate")).toHaveText("5,950 kr");

    // More guests than one table holds adds a table to the plan.
    await page.getByLabel("Number of guests", { exact: true }).last().fill("60");
    await page.getByLabel("Number of guests", { exact: true }).last().blur();
    await expect(summary).toContainText("3 long tables");
    await expect(summary.locator("circle.seat")).toHaveCount(60);
  });

  test("a typed guest count outside the range is corrected", async ({ page }) => {
    await page.goto("/en/events");
    const count = page.getByLabel("Number of guests", { exact: true }).last();
    await count.fill("500");
    await count.blur();
    await expect(page.getByRole("complementary", { name: "Summary" })).toContainText("120 guests");
    await count.fill("1");
    await count.blur();
    await expect(page.getByRole("complementary", { name: "Summary" })).toContainText("10 guests");
  });

  test("full journey: enquiry reaches the admin panel with server-calculated prices", async ({ page }) => {
    await useFreshIp(page);
    const errors = watchErrors(page);
    const date = nextWednesday(14);

    await page.goto("/en/events");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(formAlert(page)).toHaveText("Check the marked fields.");
    await expect(page.getByLabel("Date")).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel("Date").fill(date);
    await page.getByLabel("Time").selectOption("18:00");
    await page.getByRole("button", { name: "More: From the fjord" }).click();
    await page.getByRole("button", { name: "Give the rest this menu" }).nth(1).click();
    await page.getByLabel("Name").fill("Ola Enquiry");
    await page.getByLabel("Email").fill(guest.email);
    await page.getByLabel("Phone").fill(guest.phone);

    await page.getByLabel("Invoice to a company").check();
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("Enter the company's name.")).toBeVisible();
    await expect(page.getByText("The organisation number must have 9 digits.")).toBeVisible();

    await page.getByLabel("Company name").fill("Nordmann AS");
    await page.getByLabel("Organisation number").fill("123 456 789");
    await page.getByLabel(/Notes/).fill("A 50th birthday");
    await page.getByRole("button", { name: "Send enquiry" }).click();

    await expect(page.getByRole("heading", { name: "Your enquiry is sent" })).toBeFocused();
    const code = await page.getByTestId("enquiry-code").textContent();
    expect(code).toMatch(/^TS-/);
    expect(errors).toEqual([]);

    await adminLogin(page);
    await expect(page.getByRole("link", { name: /Ola Enquiry/ })).toBeVisible();
    await page.getByRole("link", { name: /Ola Enquiry/ }).click();
    await expect(page.getByText(code!)).toBeVisible();
    await expect(page.getByText("Nordmann AS, org.nr. 123456789")).toBeVisible();
    await expect(page.getByText("A 50th birthday")).toBeVisible();
    // 1 × 745 + 23 × 645
    await expect(page.getByRole("main")).toContainText("15,580 kr");

    await page.getByLabel("Status").selectOption("in_progress");
    await page.getByLabel("Internal note").fill("Called on Monday");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Status")).toHaveValue("in_progress");

    await page.goto("/admin/enquiries?status=in_progress");
    await expect(page.getByRole("link", { name: "Ola Enquiry" })).toBeVisible();
    await page.goto("/admin/enquiries?status=declined");
    await expect(page.getByText("No enquiries with this status.")).toBeVisible();

    await page.goto("/admin/enquiries?status=in_progress");
    await page.getByRole("link", { name: "Ola Enquiry" }).click();
    await page.getByText("Delete this enquiry").click();
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await expect(page).toHaveURL(/\/admin\/enquiries$/);
    await expect(page.getByRole("link", { name: "Ola Enquiry" })).toBeHidden();
  });

  test("the API ignores any price the browser sends and refuses tampered menus", async ({ request }) => {
    const base = { guests: 20, date: nextWednesday(15), ...guest, locale: "en" };
    const headers = { "x-forwarded-for": freshIp() };

    const tampered = await request.post("/api/enquiries", {
      data: { ...base, allocations: [{ menuId: 1, guests: 10, priceNok: 1 }], estimatedTotalNok: 1 },
      headers,
    });
    expect(tampered.status()).toBe(201);
    expect((await tampered.json()).estimatedTotalNok).toBe(5950);

    const missing = await request.post("/api/enquiries", { data: { ...base, allocations: [{ menuId: 9999, guests: 5 }] }, headers });
    expect(missing.status()).toBe(400);

    const tooMany = await request.post("/api/enquiries", { data: { ...base, allocations: [{ menuId: 1, guests: 21 }] }, headers });
    expect(tooMany.status()).toBe(400);

    const tooSoon = await request.post("/api/enquiries", { data: { ...base, date: new Date().toISOString().slice(0, 10) }, headers });
    expect(tooSoon.status()).toBe(400);
    expect((await tooSoon.json()).error).toBe("date_too_soon");
  });
});

test.describe("admin", () => {
  test("every admin page needs a login", async ({ page, request }) => {
    for (const path of ["/admin", "/admin/reservations", "/admin/enquiries", "/admin/menu", "/admin/menu/new"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/admin\/login$/);
    }
    const response = await request.get("/admin", { maxRedirects: 0 });
    expect([302, 303, 307]).toContain(response.status());
  });

  test("wrong passwords are refused, then rate limited", async ({ page }) => {
    await useFreshIp(page);
    await page.goto("/admin/login");
    for (let i = 0; i < 9; i++) {
      await page.getByLabel("Email").fill(ADMIN.email);
      await page.getByLabel("Password").fill(`wrong-password-${i}`);
      // Wait for the answer, because the alert from the previous attempt is still on screen.
      const answered = page.waitForResponse((response) => response.request().method() === "POST");
      await page.getByRole("button", { name: "Log in" }).click();
      await answered;
      await expect(formAlert(page)).toHaveText(
        i < 8 ? "That email and password don't match." : "Too many attempts. Wait 15 minutes and try again.",
      );
    }
    await expect(page).toHaveURL(/\/admin\/login$/);
    // The form keeps what was typed, so people only need to fix the password.
    await expect(page.getByLabel("Email")).toHaveValue(ADMIN.email);
  });

  test("the session cookie is locked down, and logging out ends it", async ({ page, context }) => {
    await useFreshIp(page);
    await adminLogin(page);
    const cookie = (await context.cookies()).find((c) => c.name === "tn_admin_session");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");

    const stolen = cookie!;
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);

    // Replaying the old cookie must not work: the session is gone from the database.
    await context.addCookies([stolen]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("hiding, editing, adding and deleting dishes changes the public menu", async ({ page }) => {
    await useFreshIp(page);
    await adminLogin(page);

    await page.goto("/admin/menu");
    await page.getByRole("button", { name: "Hide Margherita" }).click();
    await expect(page.getByRole("button", { name: "Show Margherita" })).toBeVisible();
    await page.goto("/en/menu");
    await expect(page.getByRole("heading", { name: "Margherita" })).toBeHidden();

    await page.goto("/admin/menu");
    await page.getByRole("button", { name: "Show Margherita" }).click();
    await expect(page.getByRole("button", { name: "Hide Margherita" })).toBeVisible();

    await page.getByRole("link", { name: "Add a dish" }).click();
    await page.locator('input[name="name"]').fill("Test Lasagne");
    await page.getByLabel("Category").selectOption("pasta");
    await page.getByLabel("Price (kr)").fill("301");
    await page.getByLabel("Description (English)").fill("A dish added in a test.");
    await page.getByLabel("Gluten", { exact: true }).check();
    await page.getByRole("button", { name: "Add dish" }).click();
    await expect(page).toHaveURL(/\/admin\/menu$/);

    await page.goto("/en/menu");
    await expect(page.getByRole("heading", { name: "Test Lasagne" })).toBeVisible();
    await expect(page.getByText("301 kr")).toBeVisible();

    await page.goto("/admin/menu");
    await page.getByRole("link", { name: "Test Lasagne" }).click();
    await page.getByLabel("Price (kr)").fill("305");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/admin\/menu$/);
    await page.goto("/en/menu");
    await expect(page.getByText("305 kr")).toBeVisible();

    await page.goto("/admin/menu");
    await page.getByRole("link", { name: "Test Lasagne" }).click();
    await page.getByText("Delete this dish").click();
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await expect(page).toHaveURL(/\/admin\/menu$/);
    await page.goto("/en/menu");
    await expect(page.getByRole("heading", { name: "Test Lasagne" })).toBeHidden();
  });

  test("changing an event menu price reaches the planner", async ({ page }) => {
    await useFreshIp(page);
    await adminLogin(page);
    await page.goto("/admin/menu");
    await page.getByLabel("Price per person (kr)").first().fill("600");
    await page.getByRole("button", { name: "Save The wood oven" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

    await page.goto("/en/events");
    await page.getByRole("button", { name: "More: The wood oven" }).click();
    await expect(page.getByTestId("estimate")).toHaveText("600 kr");

    await page.goto("/admin/menu");
    await page.getByLabel("Price per person (kr)").first().fill("595");
    await page.getByRole("button", { name: "Save The wood oven" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  });

  test("closing a date stops bookings, and reopening restores them", async ({ page, request }) => {
    await useFreshIp(page);
    const date = nextWednesday(35);
    await adminLogin(page);
    await page.goto("/admin/reservations");
    await page.getByLabel("Date").nth(1).fill(date);
    await page.getByLabel("Reason").fill("Private hire");
    await page.getByRole("button", { name: "Close this date" }).click();
    await expect(page.getByText("Private hire")).toBeVisible();

    const closed = await (await request.get(`/api/availability?date=${date}&guests=2`)).json();
    expect(closed.status).toBe("closed");
    const refused = await request.post("/api/reservations", {
      data: { date, time: "18:00", guests: 2, ...guest },
      headers: { "x-forwarded-for": freshIp() },
    });
    expect(refused.status()).toBe(409);

    await page.getByRole("button", { name: "Reopen" }).click();
    await expect(page.getByText("Private hire")).toBeHidden();
    const open = await (await request.get(`/api/availability?date=${date}&guests=2`)).json();
    expect(open.status).toBe("ok");
  });

  test("staff can see a booking and mark it, which frees the seats when cancelled", async ({ page, request }) => {
    await useFreshIp(page);
    const date = nextWednesday(42);
    const created = await request.post("/api/reservations", {
      data: { date, time: "18:00", guests: 10, ...guest, name: "Staff Test", notes: "Nut allergy" },
      headers: { "x-forwarded-for": freshIp() },
    });
    expect(created.status()).toBe(201);

    await adminLogin(page);
    await page.goto(`/admin/reservations?date=${date}`);
    await expect(page.getByRole("cell", { name: /Staff Test/ })).toBeVisible();
    await expect(page.getByText("Nut allergy")).toBeVisible();
    await expect(page.getByText("1 booking, 10 guests")).toBeVisible();

    await page.getByLabel("Status for Staff Test").selectOption("cancelled");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("1 booking, 0 guests")).toBeVisible();

    await page.goto("/admin/reservations?date=not-a-date");
    await expect(page.getByRole("heading", { name: "Reservations" })).toBeVisible();
    await page.goto("/admin/enquiries/not-a-uuid");
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});
