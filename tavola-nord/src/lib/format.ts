import type { Locale } from "@/i18n/routes";

/** Formats a YYYY-MM-DD date without letting the time zone move it to another day. */
export function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "nb" ? "nb-NO" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
