import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { brand } from "@/config/brand";
import { getDb } from "@/db/client";
import { reservations } from "@/db/schema";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import { canCancel, restaurantNow } from "@/lib/booking";
import { formatDate } from "@/lib/format";
import { sha256 } from "@/lib/security";

export const dynamic = "force-dynamic";

// The address holds a private token, so keep it out of search engines and referrer headers.
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer", title: brand.name };

export default async function ManageReservationPage({ params }: { params: Promise<{ locale: Locale; token: string }> }) {
  const { locale, token } = await params;
  const t = getDictionary(locale);
  const db = await getDb();
  const [booking] = await db.select().from(reservations).where(eq(reservations.manageTokenHash, sha256(token)));

  if (!booking) {
    return (
      <div className="page max-w-2xl pb-16 pt-6">
        <h1 className="display text-5xl text-tomato">{t.manage.invalidHeading}</h1>
        <p className="mt-4">{t.manage.invalidBody}</p>
        <p className="mt-4">
          <a className="link" href={brand.phone.href}>
            {brand.phone.display}
          </a>
        </p>
        <Link href={routes.book[locale]} className="btn btn-primary mt-6">
          {t.manage.bookNew}
        </Link>
      </div>
    );
  }

  return (
    <div className="page pb-16 pt-6">
      <h1 className="display text-[clamp(2.75rem,7vw,5rem)] leading-none text-tomato">{t.manage.heading}</h1>
      <dl className="my-8 grid max-w-xl gap-x-8 gap-y-2 text-lg sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">{t.book.reference}</dt>
        <dd className="font-bold tracking-wide">{booking.code}</dd>
        <dt className="font-semibold">{t.book.when}</dt>
        <dd>
          {formatDate(booking.date, locale)}, {booking.time}
        </dd>
        <dt className="font-semibold">{t.book.party}</dt>
        <dd>{t.common.guests(booking.guests)}</dd>
        <dt className="font-semibold">{t.common.name}</dt>
        <dd>{booking.name}</dd>
      </dl>
      <ManageBooking
        locale={locale}
        token={token}
        initialStatus={booking.status}
        cancellable={booking.status === "confirmed" && canCancel(booking.date, booking.time, restaurantNow())}
      />
    </div>
  );
}
