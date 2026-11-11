import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@example.com", password: "e2e-admin-password" };

let ipCounter = 0;

/** A fresh client address per test, so tests don't use up each other's rate limits. */
export function freshIp(): string {
  ipCounter += 1;
  return `10.${process.pid % 250}.${Math.floor(Math.random() * 250)}.${ipCounter}`;
}

export async function useFreshIp(page: Page): Promise<string> {
  const ip = freshIp();
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
  return ip;
}

/** The first date at least `minDays` ahead that falls on a Wednesday, when the restaurant is always open. */
export function nextWednesday(minDays: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + minDays);
  while (date.getUTCDay() !== 3) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function nextMonday(minDays: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + minDays);
  while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

export async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

export const guest = { name: "Kari Nordmann", email: "kari@example.com", phone: "+47 900 00 000" };

/** The form's own alert. Next.js also adds an empty route announcer with the same role to every page. */
export function formAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
