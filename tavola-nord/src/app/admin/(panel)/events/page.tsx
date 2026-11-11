import { asc, gte } from "drizzle-orm";
import { deleteEvent, toggleEvent } from "@/app/admin/actions";
import { getDb } from "@/db/client";
import { events } from "@/db/schema";
import { getDictionary } from "@/i18n/dictionaries";
import { restaurantNow } from "@/lib/booking";
import { formatDate } from "@/lib/format";
import { EventForm } from "./EventForm";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const kinds = getDictionary("en").home.eventKinds;
  const today = restaurantNow().date;
  const db = await getDb();
  const rows = await db.select().from(events).where(gte(events.date, today)).orderBy(asc(events.date), asc(events.startTime));

  return (
    <>
      <h1 className="text-3xl font-bold">What&apos;s on</h1>
      <p className="mt-2 max-w-prose">
        Karaoke, live music, open mic, matches and other nights out. They show on the home page for the next two weeks, in the
        &ldquo;Tonight&rdquo; line in the hero, in Google search results and in the chat. Past dates disappear by themselves.
      </p>

      <section className="mt-8 border-t-2 border-ink pt-6">
        <h2 className="text-xl font-bold">Add a night</h2>
        <EventForm today={today} />
      </section>

      <section className="mt-12 border-t-2 border-ink pt-6">
        <h2 className="text-xl font-bold">Coming up</h2>
        {rows.length === 0 ? (
          <p className="mt-2">Nothing yet. The What&apos;s on section stays hidden on the site until you add something.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                <span className={row.published ? "" : "text-ink-soft line-through"}>
                  <strong>{formatDate(row.date, "en")}, {row.startTime}</strong> · {kinds[row.kind]} · {row.titleNb}
                  {row.titleEn !== row.titleNb ? ` / ${row.titleEn}` : ""}
                  {row.published ? "" : " (hidden)"}
                </span>
                <span className="flex gap-4">
                  <form action={toggleEvent}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="link min-h-11">{row.published ? "Hide" : "Show"}</button>
                  </form>
                  <form action={deleteEvent}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="link min-h-11 text-tomato">Delete</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
