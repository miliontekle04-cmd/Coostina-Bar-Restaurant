import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { deleteEnquiry, updateEnquiry } from "@/app/admin/actions";
import { SaveButton } from "@/components/admin/SaveButton";
import { getDb } from "@/db/client";
import { enquiries } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { formatNok } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await getDb();
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id));
  if (!row) notFound();

  const allocated = row.allocations.reduce((sum, a) => sum + a.guests, 0);

  return (
    <>
      <Link href="/admin/enquiries" className="link">Back to enquiries</Link>
      <h1 className="mt-3 text-3xl font-bold">
        {row.name}, {row.guests} guests
      </h1>
      <p className="text-ink-soft">{row.code}</p>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <section>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="font-semibold">Date</dt>
            <dd>
              {formatDate(row.date, "en")}
              {row.time ? `, ${row.time}` : ""}
            </dd>
            <dt className="font-semibold">Phone</dt>
            <dd><a className="link font-normal" href={`tel:${row.phone}`}>{row.phone}</a></dd>
            <dt className="font-semibold">Email</dt>
            <dd><a className="link font-normal" href={`mailto:${row.email}`}>{row.email}</a></dd>
            {row.companyInvoice ? (
              <>
                <dt className="font-semibold">Invoice to</dt>
                <dd>
                  {row.companyName}, org.nr. {row.orgNumber}
                </dd>
              </>
            ) : null}
            <dt className="font-semibold">Language</dt>
            <dd>{row.locale === "nb" ? "Norwegian" : "English"}</dd>
            <dt className="font-semibold">Sent</dt>
            <dd>{row.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</dd>
          </dl>
          {row.notes ? (
            <>
              <h2 className="mt-6 text-xl font-bold">Their notes</h2>
              <p className="mt-1 whitespace-pre-wrap">{row.notes}</p>
            </>
          ) : null}

          <h2 className="mt-6 text-xl font-bold">Menus</h2>
          {row.allocations.length === 0 ? (
            <p className="mt-1">No menus chosen yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {row.allocations.map((a) => (
                <li key={a.menuId} className="flex justify-between gap-4 py-1.5">
                  <span>
                    {a.guests} × {a.name} at {formatNok(a.priceNok, "en")}
                  </span>
                  <span>{formatNok(a.guests * a.priceNok, "en")}</span>
                </li>
              ))}
              <li className="flex justify-between gap-4 py-1.5 font-bold">
                <span>Estimate{allocated < row.guests ? ` (${row.guests - allocated} guests without a menu)` : ""}</span>
                <span>{formatNok(row.estimatedTotalNok, "en")}</span>
              </li>
            </ul>
          )}
        </section>

        <section className="self-start rounded-xl border-2 border-ink bg-paper p-5">
          <form action={updateEnquiry} className="space-y-4">
            <input type="hidden" name="id" value={row.id} />
            <div>
              <label htmlFor="status" className="field-label">Status</label>
              <select id="status" name="status" defaultValue={row.status} className="input">
                <option value="new">New</option>
                <option value="in_progress">In progress</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div>
              <label htmlFor="adminNote" className="field-label">Internal note</label>
              <textarea id="adminNote" name="adminNote" rows={4} defaultValue={row.adminNote} maxLength={2000} className="input" />
            </div>
            <SaveButton>Save changes</SaveButton>
          </form>

          <details className="mt-6 border-t border-line pt-4">
            <summary className="link inline-flex min-h-11 items-center">Delete this enquiry</summary>
            <form action={deleteEnquiry} className="mt-2">
              <input type="hidden" name="id" value={row.id} />
              <p>This permanently removes the guest&apos;s details. It can&apos;t be undone.</p>
              <button type="submit" className="btn btn-primary mt-3">Delete permanently</button>
            </form>
          </details>
        </section>
      </div>
    </>
  );
}
