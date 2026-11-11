import Link from "next/link";
import type { events } from "@/db/schema";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import { addDays, weekdayOf } from "@/lib/booking";
import type { DayStatus } from "@/lib/whats-on";

export type NightOut = typeof events.$inferSelect;

function bookHref(locale: Locale, date: string, time?: string) {
  const params = new URLSearchParams({ date, ...(time ? { time } : {}) });
  return `${routes.book[locale]}?${params}`;
}

function longDate(date: string, locale: Locale) {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "nb" ? "nb-NO" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** One line in the hero: open now, opening later or closed, plus tonight's events. */
export function TodayStatus({ locale, status, tonight }: { locale: Locale; status: DayStatus; tonight: NightOut[] }) {
  const t = getDictionary(locale).home;
  const text = status.state === "open" ? t.statusOpen(status.close) : status.state === "later" ? t.statusOpensLater(status.open) : t.statusClosed;
  return (
    <p className="mx-auto mt-6 inline-flex flex-col items-center justify-center gap-x-2 gap-y-0.5 rounded-2xl bg-black/40 px-4 py-1.5 text-[0.9375rem] text-mist backdrop-blur-sm sm:flex-row sm:rounded-full">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className={`inline-block size-2.5 rounded-full ${status.state === "open" ? "bg-[#7fbf6a]" : status.state === "later" ? "bg-oil" : "bg-[#e0705f]"}`} />
        {text}
      </span>
      {tonight.length > 0 ? (
        <span>
          <span aria-hidden="true" className="hidden sm:inline">· </span>
          <strong className="font-semibold text-oil">{t.tonight}:</strong> {tonight.map((e) => `${locale === "nb" ? e.titleNb : e.titleEn} ${e.startTime}`).join(", ")}
        </span>
      ) : null}
    </p>
  );
}

/** A handful of free times that open the booking form with the time already picked. */
export function FreeTables({ locale, today, free }: { locale: Locale; today: string; free: { date: string; times: string[] } | null }) {
  const t = getDictionary(locale);
  if (!free) return null;
  const day =
    free.date === today ? t.home.freeToday : free.date === addDays(today, 1) ? t.home.freeTomorrow : t.home.freeOn(t.common.days[weekdayOf(free.date)] ?? "");

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <p className="font-semibold">
        {t.home.freeHeading(day)} <span className="font-normal text-ink-soft">{t.home.freeGuests}</span>
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {free.times.map((time) => (
          <li key={time}>
            <Link
              href={bookHref(locale, free.date, time)}
              aria-label={t.home.freeBookAt(time)}
              className="inline-flex min-h-11 items-center rounded-full border border-tomato/50 px-4 font-semibold text-tomato hover:border-tomato hover:bg-tomato hover:text-paper"
            >
              {time}
            </Link>
          </li>
        ))}
      </ul>
      <Link href={bookHref(locale, free.date)} className="link text-[0.9375rem]">
        {t.home.freeMore}
      </Link>
    </div>
  );
}

/** The next nights out. Hidden until someone adds events in the admin panel. */
export function WhatsOn({ locale, today, items }: { locale: Locale; today: string; items: NightOut[] }) {
  const t = getDictionary(locale).home;
  if (items.length === 0) return null;

  return (
    <section className="on-dark bg-lagoon py-16 text-mist md:py-20" aria-labelledby="whats-on-heading">
      <div className="page">
        <p className="eyebrow text-oil">{t.whatsOnEyebrow}</p>
        <h2 id="whats-on-heading" className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)]">
          {t.whatsOnHeading}
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const when = item.date === today ? t.whatsOnToday : item.date === addDays(today, 1) ? t.whatsOnTomorrow : longDate(item.date, locale);
            const description = locale === "nb" ? item.descriptionNb : item.descriptionEn;
            return (
              <li key={item.id} className="flex flex-col rounded-2xl border border-oil/30 bg-white/5 p-6">
                <p className="eyebrow text-oil">{t.eventKinds[item.kind]}</p>
                <h3 className="display mt-2 text-2xl">{locale === "nb" ? item.titleNb : item.titleEn}</h3>
                <p className="mt-1 font-semibold first-letter:uppercase">
                  <time dateTime={`${item.date}T${item.startTime}`}>
                    {when}, {item.startTime}
                  </time>
                </p>
                {description ? <p className="mt-3 text-mist/85">{description}</p> : null}
                <Link href={bookHref(locale, item.date)} className="link mt-auto self-start pt-5 text-oil">
                  {t.whatsOnBook}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
