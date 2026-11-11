import type { Metadata } from "next";
import { BookingForm } from "@/components/booking/BookingForm";
import { PlateArt } from "@/components/art/PlateArt";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { addDays, computeAvailability, isValidDate, restaurantNow } from "@/lib/booking";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return pageMetadata(locale, "book", t.meta.bookTitle, t.meta.bookDescription);
}

/** Starts on the next day the restaurant has times left, so the guest sees options straight away. */
function nextBookableDate(now: { date: string; minutes: number }): string {
  for (let offset = 0; offset < 14; offset++) {
    const date = addDays(now.date, offset);
    const result = computeAvailability({ date, guests: 2, bookings: [], isClosedDate: false, now });
    if (result.status === "ok") return date;
  }
  return now.date;
}

export default async function BookPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const t = getDictionary(locale);
  const now = restaurantNow();
  const maxDate = addDays(now.date, brand.booking.maxDaysAhead);

  // Links such as /bestill-bord?date=2026-11-07&time=19:00 open the form with that sitting picked.
  const askedDate = typeof query.date === "string" && isValidDate(query.date) && query.date >= now.date && query.date <= maxDate ? query.date : null;
  const askedTime = typeof query.time === "string" && /^\d{2}:\d{2}$/.test(query.time) ? query.time : "";

  return (
    <div className="page grid gap-10 pb-16 pt-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <h1 className="display text-[clamp(3rem,8vw,6rem)] leading-none text-tomato">{t.book.heading}</h1>
        <p className="mb-10 mt-4 max-w-[56ch] text-lg">{t.book.intro}</p>
        <BookingForm
          locale={locale}
          initialDate={askedDate ?? nextBookableDate(now)}
          initialTime={askedDate ? askedTime : ""}
          minDate={now.date}
          maxDate={maxDate}
        />
      </div>
      <PlateArt art="pizza" className="hidden w-full self-start lg:block" />
    </div>
  );
}
