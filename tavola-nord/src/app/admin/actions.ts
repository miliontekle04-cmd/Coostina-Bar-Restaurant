"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { adminUsers, closedDates, enquiries, eventKinds, eventMenus, events, menuItems, reservations } from "@/db/schema";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { addDays, isValidDate } from "@/lib/booking";
import { menuCategories } from "@/lib/menu-filter";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/security";

export type LoginState = { error?: string };

// Checking this when the email is unknown keeps the response time the same either way.
const dummyHash = hashPassword("not-a-real-password");

export async function login(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const requestHeaders = await headers();
  if (!(await allowRequest("login", clientKey(requestHeaders), 8, 900))) {
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }

  const db = await getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid) return { error: "That email and password don't match." };

  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

const reservationStatus = z.enum(["confirmed", "cancelled", "completed", "no_show"]);

export async function setReservationStatus(form: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(form.get("id"));
  const status = reservationStatus.parse(form.get("status"));
  const db = await getDb();
  await db.update(reservations).set({ status }).where(eq(reservations.id, id));
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}

export async function addClosedDate(form: FormData) {
  await requireAdmin();
  const date = String(form.get("date") ?? "");
  if (!isValidDate(date)) return;
  const reason = String(form.get("reason") ?? "").trim().slice(0, 200);
  const db = await getDb();
  await db.insert(closedDates).values({ date, reason }).onConflictDoUpdate({ target: closedDates.date, set: { reason } });
  revalidatePath("/admin/reservations");
}

export async function removeClosedDate(form: FormData) {
  await requireAdmin();
  const date = String(form.get("date") ?? "");
  if (!isValidDate(date)) return;
  const db = await getDb();
  await db.delete(closedDates).where(eq(closedDates.date, date));
  revalidatePath("/admin/reservations");
}

const enquiryUpdate = z.object({
  id: z.uuid(),
  status: z.enum(["new", "in_progress", "confirmed", "declined"]),
  adminNote: z.string().max(2000),
});

export async function updateEnquiry(form: FormData) {
  await requireAdmin();
  const { id, status, adminNote } = enquiryUpdate.parse(Object.fromEntries(form));
  const db = await getDb();
  await db.update(enquiries).set({ status, adminNote }).where(eq(enquiries.id, id));
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin");
}

export async function deleteEnquiry(form: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(form.get("id"));
  const db = await getDb();
  await db.delete(enquiries).where(eq(enquiries.id, id));
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries");
}

const menuItemInput = z.object({
  category: z.enum(menuCategories),
  name: z.string().trim().min(1).max(120),
  descriptionNb: z.string().trim().max(500),
  descriptionEn: z.string().trim().max(500),
  priceNok: z.coerce.number().int().min(0).max(100000),
  art: z.string().max(30),
});

export type MenuItemState = { error?: string };

export async function saveMenuItem(_state: MenuItemState, form: FormData): Promise<MenuItemState> {
  await requireAdmin();
  const parsed = menuItemInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check the name, category and price." };

  const values = {
    ...parsed.data,
    allergens: form.getAll("allergens").map(String),
    vegetarian: form.get("vegetarian") === "on",
    glutenFree: form.get("glutenFree") === "on",
    featured: form.get("featured") === "on",
    available: form.get("available") === "on",
  };
  const db = await getDb();
  const id = Number(form.get("id"));
  if (id) await db.update(menuItems).set(values).where(eq(menuItems.id, id));
  else await db.insert(menuItems).values({ ...values, sort: 1000 });
  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

export async function toggleMenuItem(form: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().parse(form.get("id"));
  const db = await getDb();
  await db.update(menuItems).set({ available: form.get("available") === "true" }).where(eq(menuItems.id, id));
  revalidatePath("/admin/menu");
}

export async function deleteMenuItem(form: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().parse(form.get("id"));
  const db = await getDb();
  await db.delete(menuItems).where(eq(menuItems.id, id));
  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

const eventMenuInput = z.object({
  id: z.coerce.number().int().positive(),
  nameNb: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80),
  priceNok: z.coerce.number().int().min(0).max(100000),
  starter: z.string().trim().min(1).max(120),
  main: z.string().trim().min(1).max(120),
  dessert: z.string().trim().min(1).max(120),
});

export async function saveEventMenu(form: FormData) {
  await requireAdmin();
  const parsed = eventMenuInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  const { id, ...values } = parsed.data;
  const db = await getDb();
  await db.update(eventMenus).set({ ...values, active: form.get("active") === "on" }).where(eq(eventMenus.id, id));
  revalidatePath("/admin/menu");
}

const eventInput = z.object({
  kind: z.enum(eventKinds),
  titleNb: z.string().trim().min(1).max(80),
  titleEn: z.string().trim().max(80),
  descriptionNb: z.string().trim().max(300),
  descriptionEn: z.string().trim().max(300),
  date: z.string().refine(isValidDate),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  /** Extra weekly copies, for a night that repeats. */
  repeatWeeks: z.coerce.number().int().min(0).max(26),
});

export type EventState = { error?: string; saved?: number };

export async function addEvent(_state: EventState, form: FormData): Promise<EventState> {
  await requireAdmin();
  const parsed = eventInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check the fields: a Norwegian title, a date and a start time are required." };
  const { repeatWeeks, date, ...values } = parsed.data;
  // English falls back to the Norwegian text, so the English site never shows an empty card.
  const row = { ...values, titleEn: values.titleEn || values.titleNb, descriptionEn: values.descriptionEn || values.descriptionNb };
  const rows = Array.from({ length: repeatWeeks + 1 }, (_, week) => ({ ...row, date: addDays(date, week * 7) }));
  const db = await getDb();
  await db.insert(events).values(rows);
  revalidatePath("/admin/events");
  revalidatePath("/", "layout");
  return { saved: rows.length };
}

export async function toggleEvent(form: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(form.get("id"));
  const db = await getDb();
  const [row] = await db.select({ published: events.published }).from(events).where(eq(events.id, id));
  if (!row) return;
  await db.update(events).set({ published: !row.published }).where(eq(events.id, id));
  revalidatePath("/admin/events");
  revalidatePath("/", "layout");
}

export async function deleteEvent(form: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(form.get("id"));
  const db = await getDb();
  await db.delete(events).where(eq(events.id, id));
  revalidatePath("/admin/events");
  revalidatePath("/", "layout");
}
