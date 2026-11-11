import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db/client";
import { enquiries } from "@/db/schema";
import { formatNok } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const filters = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
];

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active = filters.some((f) => f.value === status) ? status! : "all";
  const db = await getDb();
  const query = db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(200).$dynamic();
  const rows = await (active === "all" ? query : query.where(eq(enquiries.status, active)));

  return (
    <>
      <h1 className="text-3xl font-bold">Event enquiries</h1>
      <nav aria-label="Filter by status" className="mt-4">
        <ul className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <li key={filter.value}>
              <Link
                href={filter.value === "all" ? "/admin/enquiries" : `/admin/enquiries?status=${filter.value}`}
                aria-current={active === filter.value ? "page" : undefined}
                className="inline-flex min-h-10 items-center rounded-full border-2 border-ink px-3.5 no-underline aria-[current=page]:bg-ink aria-[current=page]:text-mist"
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border-2 border-dashed border-ink/40 p-6">No enquiries with this status.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4">Event date</th>
                <th scope="col" className="py-2 pr-4">Name</th>
                <th scope="col" className="py-2 pr-4">Guests</th>
                <th scope="col" className="py-2 pr-4">Estimate</th>
                <th scope="col" className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line">
                  <td className="py-2 pr-4">{row.date}</td>
                  <td className="py-2 pr-4">
                    <Link className="link" href={`/admin/enquiries/${row.id}`}>{row.name}</Link>
                  </td>
                  <td className="py-2 pr-4">{row.guests}</td>
                  <td className="py-2 pr-4">{row.estimatedTotalNok ? formatNok(row.estimatedTotalNok, "en") : "None yet"}</td>
                  <td className="py-2">{filters.find((f) => f.value === row.status)?.label ?? row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
