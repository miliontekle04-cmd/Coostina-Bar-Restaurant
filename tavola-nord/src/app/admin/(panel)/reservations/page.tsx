import { asc, eq, gte } from "drizzle-orm";
import { addClosedDate, removeClosedDate, setReservationStatus } from "@/app/admin/actions";
import { SaveButton } from "@/components/admin/SaveButton";
import { getDb } from "@/db/client";
import { closedDates, reservations } from "@/db/schema";
import { isValidDate, restaurantNow } from "@/lib/booking";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const statuses = [
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: requested } = await searchParams;
  const today = restaurantNow().date;
  const date = requested && isValidDate(requested) ? requested : today;
  const db = await getDb();
  const [rows, closed] = await Promise.all([
    db.select().from(reservations).where(eq(reservations.date, date)).orderBy(asc(reservations.time)),
    db.select().from(closedDates).where(gte(closedDates.date, today)).orderBy(asc(closedDates.date)),
  ]);
  const covers = rows.filter((row) => row.status !== "cancelled").reduce((sum, row) => sum + row.guests, 0);

  return (
    <>
      <h1 className="text-3xl font-bold">Reservations</h1>
      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="date" className="field-label">
            Date
          </label>
          <input id="date" name="date" type="date" defaultValue={date} className="input" />
        </div>
        <button type="submit" className="btn btn-ink">
          Show date
        </button>
      </form>

      <h2 className="mt-8 text-xl font-bold">{formatDate(date, "en")}</h2>
      <p>
        {rows.length} {rows.length === 1 ? "booking" : "bookings"}, {covers} guests
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border-2 border-dashed border-ink/40 p-6">No bookings on this date.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4">Time</th>
                <th scope="col" className="py-2 pr-4">Guests</th>
                <th scope="col" className="py-2 pr-4">Name</th>
                <th scope="col" className="py-2 pr-4">Contact</th>
                <th scope="col" className="py-2 pr-4">Notes</th>
                <th scope="col" className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-b border-line align-top ${row.status === "cancelled" ? "text-ink-soft" : ""}`}>
                  <td className="py-2 pr-4 font-semibold">{row.time}</td>
                  <td className="py-2 pr-4">{row.guests}</td>
                  <td className="py-2 pr-4">
                    {row.name}
                    <br />
                    <span className="text-[0.9375rem] text-ink-soft">{row.code}</span>
                  </td>
                  <td className="py-2 pr-4 text-[0.9375rem]">
                    <a className="link font-normal" href={`tel:${row.phone}`}>{row.phone}</a>
                    <br />
                    <a className="link font-normal" href={`mailto:${row.email}`}>{row.email}</a>
                  </td>
                  <td className="max-w-56 py-2 pr-4 text-[0.9375rem]">{row.notes}</td>
                  <td className="py-2">
                    <form action={setReservationStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      <select name="status" defaultValue={row.status} aria-label={`Status for ${row.name}`} className="input min-h-10 py-1">
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <SaveButton className="btn btn-outline min-h-10 px-3 py-1">Save</SaveButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-12 border-t-2 border-ink pt-6">
        <h2 className="text-xl font-bold">Closed dates</h2>
        <p className="mt-1 max-w-prose">Guests can&apos;t book a table or send an event enquiry for these dates. Existing bookings aren&apos;t changed.</p>
        <form action={addClosedDate} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="closed-date" className="field-label">Date</label>
            <input id="closed-date" name="date" type="date" min={today} required className="input" />
          </div>
          <div>
            <label htmlFor="closed-reason" className="field-label">Reason</label>
            <input id="closed-reason" name="reason" className="input" maxLength={200} />
          </div>
          <button type="submit" className="btn btn-ink">Close this date</button>
        </form>
        {closed.length === 0 ? (
          <p className="mt-4">No upcoming closed dates.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {closed.map((row) => (
              <li key={row.date} className="flex items-center justify-between gap-4 py-2">
                <span>
                  {formatDate(row.date, "en")}
                  {row.reason ? `: ${row.reason}` : ""}
                </span>
                <form action={removeClosedDate}>
                  <input type="hidden" name="date" value={row.date} />
                  <button type="submit" className="link min-h-11">Reopen</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
