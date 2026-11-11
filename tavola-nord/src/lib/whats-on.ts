import { brand, displayTime, type DayHours } from "@/config/brand";
import { addDays, computeAvailability, toMinutes, weekdayOf } from "./booking";
import { getBookingsForDate, isDateClosed } from "./queries";

export type DayStatus = { state: "open"; close: string } | { state: "later"; open: string } | { state: "closed" };

/** Whether the doors are open right now, open later today, or shut for the day. */
export function dayStatus(now: { date: string; minutes: number }, hours: DayHours[] = brand.hours, closedToday = false): DayStatus {
  const day = hours[weekdayOf(now.date)];
  if (!day || closedToday) return { state: "closed" };
  if (now.minutes < toMinutes(day.open)) return { state: "later", open: day.open };
  if (now.minutes < toMinutes(day.close)) return { state: "open", close: displayTime(day.close) };
  return { state: "closed" };
}

/** Up to `count` items spread evenly across the list, so the choices cover early and late. */
export function spread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  if (count <= 1) return items.slice(0, count);
  const step = (items.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => items[Math.round(i * step)] as T);
}

/** The first day within a week that still has free tables for two, with a few times to choose from. */
export async function findFreeTimes(now: { date: string; minutes: number }, count = 4): Promise<{ date: string; times: string[] } | null> {
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(now.date, offset);
    const [bookings, closed] = await Promise.all([getBookingsForDate(date), isDateClosed(date)]);
    const result = computeAvailability({ date, guests: 2, bookings, isClosedDate: closed, now });
    if (result.status !== "ok") continue;
    const free = result.slots.filter((slot) => slot.available).map((slot) => slot.time);
    if (free.length) return { date, times: spread(free, count) };
  }
  return null;
}
