import { brand, type DayHours } from "@/config/brand";

export type BookingRules = typeof brand.booking;
export type ExistingBooking = { time: string; guests: number };
export type Slot = { time: string; available: boolean };

export type AvailabilityResult =
  | { status: "ok"; slots: Slot[] }
  | { status: "closed" | "past" | "too_far" };

export function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Day of the week for a YYYY-MM-DD string, independent of the server's time zone. */
export function weekdayOf(date: string): number {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** Current date and time on the restaurant's clock, wherever the server runs. */
export function restaurantNow(at: Date = new Date(), timeZone = brand.timeZone): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** All sitting times on a day with these opening hours. */
export function slotTimes(hours: DayHours, rules: BookingRules = brand.booking): string[] {
  if (!hours) return [];
  const first = toMinutes(hours.open);
  const last = toMinutes(hours.close) - rules.lastSeatingBeforeClose;
  const times: string[] = [];
  for (let t = first; t <= last; t += rules.slotMinutes) times.push(fromMinutes(t));
  return times;
}

/** The busiest moment during a sitting that starts at `start`. */
export function peakCovers(start: number, bookings: ExistingBooking[], rules: BookingRules = brand.booking): number {
  let peak = 0;
  for (let tick = start; tick < start + rules.seatingMinutes; tick += rules.slotMinutes) {
    let covers = 0;
    for (const booking of bookings) {
      const begins = toMinutes(booking.time);
      if (tick >= begins && tick < begins + rules.seatingMinutes) covers += booking.guests;
    }
    peak = Math.max(peak, covers);
  }
  return peak;
}

export function fits(time: string, guests: number, bookings: ExistingBooking[], rules: BookingRules = brand.booking): boolean {
  return peakCovers(toMinutes(time), bookings, rules) + guests <= rules.capacity;
}

export function computeAvailability(input: {
  date: string;
  guests: number;
  bookings: ExistingBooking[];
  isClosedDate: boolean;
  now: { date: string; minutes: number };
  hours?: DayHours[];
  rules?: BookingRules;
}): AvailabilityResult {
  const { date, guests, bookings, isClosedDate, now } = input;
  const rules = input.rules ?? brand.booking;
  const hours = input.hours ?? brand.hours;

  if (date < now.date) return { status: "past" };
  if (date > addDays(now.date, rules.maxDaysAhead)) return { status: "too_far" };

  const day = hours[weekdayOf(date)] ?? null;
  if (isClosedDate || !day) return { status: "closed" };

  const times = slotTimes(day, rules).filter(
    (time) => date !== now.date || toMinutes(time) >= now.minutes + rules.minLeadMinutes,
  );
  // Later today with nothing left to book reads the same as closed for the guest.
  if (times.length === 0) return { status: "closed" };

  return { status: "ok", slots: times.map((time) => ({ time, available: fits(time, guests, bookings, rules) })) };
}

/** A guest can cancel their own booking until the sitting starts. */
export function canCancel(date: string, time: string, now: { date: string; minutes: number }): boolean {
  if (date !== now.date) return date > now.date;
  return toMinutes(time) > now.minutes;
}

export function isOpenNow(now: { date: string; minutes: number }, hours: DayHours[] = brand.hours): boolean {
  const day = hours[weekdayOf(now.date)];
  if (!day) return false;
  return now.minutes >= toMinutes(day.open) && now.minutes < toMinutes(day.close);
}
