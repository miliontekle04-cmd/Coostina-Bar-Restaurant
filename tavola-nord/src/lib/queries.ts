import { and, asc, eq, gte, lte, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { closedDates, eventMenus, events, menuItems, reservations } from "@/db/schema";

export async function getAvailableMenu() {
  const db = await getDb();
  return db.select().from(menuItems).where(eq(menuItems.available, true)).orderBy(asc(menuItems.sort), asc(menuItems.id));
}

/** Dishes for the carousel on the home page. */
export async function getFeaturedMenu() {
  const db = await getDb();
  return db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.available, true), eq(menuItems.featured, true)))
    .orderBy(asc(menuItems.sort))
    .limit(12);
}

export async function getActiveEventMenus() {
  const db = await getDb();
  return db.select().from(eventMenus).where(eq(eventMenus.active, true)).orderBy(asc(eventMenus.sort), asc(eventMenus.id));
}

export async function getBookingsForDate(date: string, tx?: Awaited<ReturnType<typeof getDb>>) {
  const db = tx ?? (await getDb());
  return db
    .select({ time: reservations.time, guests: reservations.guests })
    .from(reservations)
    .where(and(eq(reservations.date, date), ne(reservations.status, "cancelled")));
}

export async function isDateClosed(date: string, tx?: Awaited<ReturnType<typeof getDb>>) {
  const db = tx ?? (await getDb());
  const rows = await db.select({ date: closedDates.date }).from(closedDates).where(eq(closedDates.date, date));
  return rows.length > 0;
}

/** Published nights out between two dates (both included), soonest first. */
export async function getUpcomingEvents(from: string, to: string, limit = 12) {
  const db = await getDb();
  return db
    .select()
    .from(events)
    .where(and(eq(events.published, true), gte(events.date, from), lte(events.date, to)))
    .orderBy(asc(events.date), asc(events.startTime))
    .limit(limit);
}
