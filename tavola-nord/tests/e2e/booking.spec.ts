import { expect, test } from "@playwright/test";
import { adminLogin, formAlert, freshIp, guest, nextWednesday, useFreshIp, watchErrors } from "./helpers";

test.describe("booking a table", () => {
  test("full journey: book, open the manage link, cancel, and the table is free again", async ({ page, request }) => {
    await useFreshIp(page);
    const errors = watchErrors(page);
    const date = nextWednesday(7);

    await page.goto("/en/book");
    await page.getByLabel("Date").fill(date);
    await page.getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("spinbutton", { name: "Number of guests" })).toHaveValue("3");

    // No details form until a time has been chosen.
    await expect(page.getByLabel("Name")).toBeHidden();
    await page.getByRole("radio", { name: "18:00" }).check();

    await page.getByLabel("Name").fill(guest.name);
    await page.getByLabel("Email").fill(guest.email);
    await page.getByLabel("Phone").fill(guest.phone);
    await page.getByLabel(/Notes/).fill("Window table if possible");
    await page.getByRole("button", { name: "Book the table" }).click();

    await expect(page.getByRole("heading", { name: "Your table is booked" })).toBeFocused();
    await expect(page.getByTestId("booking-code")).toHaveText(/^TN-[A-Z2-9]{6}$/);
    // The confirmation isn't left cut off at the top of the screen.
    const confirmationTop = (await page.getByRole("heading", { name: "Your table is booked" }).boundingBox())!.y;
    expect(confirmationTop).toBeGreaterThan(0);

    const before = await (await request.get(`/api/availability?date=${date}&guests=2`)).json();
    expect(before.status).toBe("ok");

    await page.getByRole("link", { name: "View or cancel this booking" }).click();
    await expect(page).toHaveURL(/\/en\/reservation\//);
    await expect(page.getByRole("heading", { name: "Your booking" })).toBeVisible();
    await expect(page.getByText(guest.name)).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    await page.getByRole("button", { name: "Cancel the table" }).click();
    await page.getByRole("button", { name: "No, keep the table" }).click();
    await page.getByRole("button", { name: "Cancel the table" }).click();
    await page.getByRole("button", { name: "Yes, cancel" }).click();
    await expect(page.getByText("Your booking is cancelled.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("This booking has been cancelled.")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows clear errors for missing and invalid details", async ({ page }) => {
    await useFreshIp(page);
    await page.goto("/en/book");
    await page.getByLabel("Date").fill(nextWednesday(8));
    await page.getByRole("radio", { name: "19:00" }).check();
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Phone").fill("123");
    await page.getByRole("button", { name: "Book the table" }).click();

    await expect(formAlert(page)).toHaveText("Check the marked fields.");
    await expect(page.getByText("Fill in this field.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Enter a valid phone number")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-describedby", /error/);

    await page.getByLabel("Email").fill(guest.email);
    await expect(page.getByText("Enter a valid email address")).toBeHidden();
  });

  test("explains closed days", async ({ page }) => {
    // Coostina is open every day, so close a date in the admin panel first.
    await useFreshIp(page);
    const date = nextWednesday(49);
    await adminLogin(page);
    await page.goto("/admin/reservations");
    await page.getByLabel("Date").nth(1).fill(date);
    await page.getByLabel("Reason").fill("Closed for test");
    await page.getByRole("button", { name: "Close this date" }).click();
    await expect(page.getByText("Closed for test")).toBeVisible();

    await page.goto("/en/book");
    await page.getByLabel("Date").fill(date);
    await expect(page.getByText("No times are available that day.")).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);

    await page.goto("/admin/reservations");
    await page.getByRole("button", { name: "Reopen" }).click();
    await expect(page.getByText("Closed for test")).toBeHidden();
  });

  test("shows a loading state, then recovers from a failed request with a retry", async ({ page }) => {
    await page.goto("/en/book");
    await page.getByRole("radio").first().waitFor();

    let fail = true;
    await page.route("**/api/availability**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (fail) await route.abort();
      else await route.continue();
    });

    await page.getByLabel("Date").fill(nextWednesday(9));
    await expect(page.locator('fieldset[aria-busy="true"]')).toBeVisible();
    await expect(page.getByText("We couldn't load the free times.")).toBeVisible();

    fail = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("radio").first()).toBeVisible();
  });

  test("a network failure while booking keeps what you typed", async ({ page }) => {
    await useFreshIp(page);
    await page.goto("/en/book");
    await page.getByLabel("Date").fill(nextWednesday(10));
    await page.getByRole("radio", { name: "18:30" }).check();
    await page.getByLabel("Name").fill(guest.name);
    await page.getByLabel("Email").fill(guest.email);
    await page.getByLabel("Phone").fill(guest.phone);

    await page.route("**/api/reservations", (route) => route.abort());
    await page.getByRole("button", { name: "Book the table" }).click();
    await expect(formAlert(page)).toContainText("We can't reach the server.");
    await expect(page.getByLabel("Name")).toHaveValue(guest.name);

    await page.unroute("**/api/reservations");
    await page.getByRole("button", { name: "Book the table" }).click();
    await expect(page.getByRole("heading", { name: "Your table is booked" })).toBeVisible();
  });

  test("parties over 10 are pointed to the events page", async ({ page }) => {
    await page.goto("/en/book");
    await page.getByRole("main").getByRole("link", { name: "Go to events" }).click();
    await expect(page).toHaveURL(/\/en\/events$/);
  });
});

test.describe("booking API", () => {
  const body = (date: string, overrides = {}) => ({ date, time: "18:00", guests: 2, ...guest, locale: "en", ...overrides });

  test("never overbooks when guests race for the last seats", async ({ request }) => {
    const date = nextWednesday(21);
    // Capacity is 40. Fill 36 seats, leaving room for exactly two parties of 2.
    for (let i = 0; i < 6; i++) {
      const filled = await request.post("/api/reservations", {
        data: body(date, { guests: 6 }),
        headers: { "x-forwarded-for": freshIp() },
      });
      expect(filled.status()).toBe(201);
    }

    const race = await Promise.all(
      Array.from({ length: 8 }, () =>
        request.post("/api/reservations", { data: body(date), headers: { "x-forwarded-for": freshIp() } }),
      ),
    );
    const statuses = race.map((response) => response.status()).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(2);
    expect(statuses.filter((s) => s === 409)).toHaveLength(6);

    const availability = await (await request.get(`/api/availability?date=${date}&guests=2`)).json();
    expect(availability.slots.find((s: { time: string }) => s.time === "18:00").available).toBe(false);
  });

  test("the page handles losing the race to the last table", async ({ page, request }) => {
    await useFreshIp(page);
    const date = nextWednesday(28);
    await page.goto("/en/book");
    await page.getByLabel("Date").fill(date);
    await page.getByRole("radio", { name: "17:00" }).check();
    await page.getByLabel("Name").fill(guest.name);
    await page.getByLabel("Email").fill(guest.email);
    await page.getByLabel("Phone").fill(guest.phone);

    for (let i = 0; i < 4; i++) {
      await request.post("/api/reservations", {
        data: body(date, { time: "17:00", guests: 10 }),
        headers: { "x-forwarded-for": freshIp() },
      });
    }

    await page.getByRole("button", { name: "Book the table" }).click();
    await expect(formAlert(page)).toContainText("Someone else just took this table.");
    await expect(page.getByRole("radio", { name: /17:00/ })).toBeDisabled();
  });

  test("rejects bad input", async ({ request }) => {
    const headers = { "x-forwarded-for": freshIp() };
    const date = nextWednesday(30);
    const invalid = await request.post("/api/reservations", { data: body(date, { guests: 11, email: "x" }), headers });
    expect(invalid.status()).toBe(400);
    expect((await invalid.json()).fields).toMatchObject({ guests: "guests", email: "email" });

    const notJson = await request.post("/api/reservations", { data: "{oops", headers: { ...headers, "content-type": "application/json" } });
    expect(notJson.status()).toBe(400);

    const huge = await request.post("/api/reservations", { data: body(date, { notes: "x".repeat(20_000) }), headers });
    expect(huge.status()).toBe(400);

    const past = await request.post("/api/reservations", { data: body("2020-01-01"), headers });
    expect(past.status()).toBe(409);

    const midnight = await request.post("/api/reservations", { data: body(date, { time: "03:00" }), headers });
    expect(midnight.status()).toBe(409);

    const badDate = await request.get("/api/availability?date=2026-02-31&guests=2");
    expect(badDate.status()).toBe(400);
  });

  test("quietly ignores bots that fill in the hidden field", async ({ request }) => {
    const date = nextWednesday(31);
    const response = await request.post("/api/reservations", {
      data: body(date, { website: "http://spam.example", guests: 10 }),
      headers: { "x-forwarded-for": freshIp() },
    });
    expect(response.status()).toBe(201);
    const availability = await (await request.get(`/api/availability?date=${date}&guests=10`)).json();
    expect(availability.slots.every((s: { available: boolean }) => s.available)).toBe(true);
  });

  test("rate limits repeated requests from one address", async ({ request }) => {
    const headers = { "x-forwarded-for": freshIp() };
    const date = nextWednesday(32);
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) {
      const response = await request.post("/api/reservations", { data: body(date, { time: `${14 + i}:00` }), headers });
      statuses.push(response.status());
    }
    expect(statuses.slice(0, 8).every((s) => s === 201)).toBe(true);
    expect(statuses[8]).toBe(429);
  });

  test("cancelling needs the real token", async ({ request }) => {
    const headers = { "x-forwarded-for": freshIp() };
    const response = await request.post("/api/reservations/cancel", { data: { token: "x".repeat(43) }, headers });
    expect(response.status()).toBe(404);
  });

  test("an invalid manage link shows a helpful page", async ({ page }) => {
    await page.goto("/en/reservation/not-a-real-token-at-all-000000000");
    await expect(page.getByRole("heading", { name: "We can't find this booking" })).toBeVisible();
    await page.goto("/bestilling/not-a-real-token-at-all-000000000");
    await expect(page.getByRole("heading", { name: "Vi finner ikke denne bestillingen" })).toBeVisible();
  });
});
