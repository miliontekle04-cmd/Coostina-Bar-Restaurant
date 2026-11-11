import { toMinutes } from "./booking";

/** Text in an .ics file escapes backslashes, commas, semicolons and line breaks. */
function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** YYYY-MM-DD + HH:MM + minutes → local "YYYYMMDDTHHMMSS", rolling over midnight. */
function localStamp(date: string, time: string, plusMinutes = 0): string {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  const total = toMinutes(time) + plusMinutes;
  const at = new Date(Date.UTC(y, m - 1, d, 0, total));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}T${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}00`;
}

/**
 * A calendar entry for one booking. Times are on the restaurant's clock (TZID), so the entry
 * lands at the right hour for guests in any time zone.
 */
export function bookingIcs(input: {
  uid: string;
  date: string;
  time: string;
  durationMinutes: number;
  timeZone: string;
  summary: string;
  location: string;
  description: string;
  now?: Date;
}): string {
  const stamp = (input.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coostina//Booking//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escape(input.uid)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${input.timeZone}:${localStamp(input.date, input.time)}`,
    `DTEND;TZID=${input.timeZone}:${localStamp(input.date, input.time, input.durationMinutes)}`,
    `SUMMARY:${escape(input.summary)}`,
    `LOCATION:${escape(input.location)}`,
    `DESCRIPTION:${escape(input.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
