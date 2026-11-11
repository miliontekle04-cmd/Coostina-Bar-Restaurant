import { and, asc, count, desc, eq, gte, ne, sum } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db/client";
import { enquiries, reservations } from "@/db/schema";
import { restaurantNow } from "@/lib/booking";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const db = await getDb();
  const today = restaurantNow().date;
  const active = and(eq(reservations.date, today), ne(reservations.status, "cancelled"));

  const [[totals], [newEnquiries], upcoming, latest] = await Promise.all([
    db.select({ bookings: count(), covers: sum(reservations.guests) }).from(reservations).where(active),
    db.select({ value: count() }).from(enquiries).where(eq(enquiries.status, "new")),
    db
      .select()
      .from(reservations)
      .where(and(gte(reservations.date, today), eq(reservations.status, "confirmed")))
      .orderBy(asc(reservations.date), asc(reservations.time))
      .limit(6),
    db.select().from(enquiries).where(eq(enquiries.status, "new")).orderBy(desc(enquiries.createdAt)).limit(5),
  ]);

  const stats = [
    { label: "Bookings today", value: totals?.bookings ?? 0 },
    { label: "Guests today", value: Number(totals?.covers ?? 0) },
    { label: "New enquiries", value: newEnquiries?.value ?? 0 },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold">{formatDate(today, "en")}</h1>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border-2 border-ink bg-paper p-4">
            <dt>{stat.label}</dt>
            <dd className="text-4xl font-bold">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">Next bookings</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2">No upcoming bookings yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {upcoming.map((booking) => (
                <li key={booking.id} className="flex justify-between gap-4 py-2">
                  <Link className="link" href={`/admin/reservations?date=${booking.date}`}>
                    {booking.name}, {booking.guests} guests
                  </Link>
                  <span className="whitespace-nowrap">
                    {booking.date} {booking.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-xl font-bold">New enquiries</h2>
          {latest.length === 0 ? (
            <p className="mt-2">No new enquiries. New ones appear here when guests send the events form.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {latest.map((enquiry) => (
                <li key={enquiry.id} className="flex justify-between gap-4 py-2">
                  <Link className="link" href={`/admin/enquiries/${enquiry.id}`}>
                    {enquiry.name}, {enquiry.guests} guests
                  </Link>
                  <span className="whitespace-nowrap">{enquiry.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
