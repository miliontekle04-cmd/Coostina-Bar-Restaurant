import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { getDb } from "@/db/client";
import { reservations } from "@/db/schema";
import { managePath } from "@/i18n/routes";
import { computeAvailability, fits, restaurantNow } from "@/lib/booking";
import { restaurantInbox, sendEmail } from "@/lib/email";
import { jsonError, readJson } from "@/lib/http";
import { getBookingsForDate, isDateClosed } from "@/lib/queries";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { randomToken, referenceCode, sha256 } from "@/lib/security";
import { fieldErrors, reservationSchema } from "@/lib/validation";

class BookingRejected extends Error {}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === undefined) return jsonError("invalid_body", 400);

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) return jsonError("validation", 400, fieldErrors(parsed.error));
  const input = parsed.data;

  // A filled-in honeypot gets a normal-looking reply, so bots don't learn to avoid it.
  if (input.website) return NextResponse.json({ code: "TN-OK", manageUrl: null }, { status: 201 });

  try {
    if (!(await allowRequest("reservation", clientKey(request.headers), 8, 600))) {
      return jsonError("rate_limited", 429);
    }

    const token = randomToken();
    const code = referenceCode("TN");
    const db = await getDb();

    // The lock makes checking and saving a single step per date, so two guests can't both get the last seats.
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`booking:${input.date}`}))`);
      const txDb = tx as unknown as typeof db;
      const bookings = await getBookingsForDate(input.date, txDb);
      const result = computeAvailability({
        date: input.date,
        guests: input.guests,
        bookings,
        isClosedDate: await isDateClosed(input.date, txDb),
        now: restaurantNow(),
      });
      if (result.status !== "ok") throw new BookingRejected("closed");
      const slot = result.slots.find((s) => s.time === input.time);
      if (!slot || !slot.available || !fits(input.time, input.guests, bookings)) throw new BookingRejected("slot_taken");

      await tx.insert(reservations).values({
        code,
        manageTokenHash: sha256(token),
        date: input.date,
        time: input.time,
        guests: input.guests,
        name: input.name,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        locale: input.locale,
      });
    });

    const manageUrl = managePath(input.locale, token);
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const emails = [
      sendEmail({
        to: input.email,
        subject: input.locale === "nb" ? `Bordet ditt hos ${brand.name} (${code})` : `Your table at ${brand.name} (${code})`,
        text:
          input.locale === "nb"
            ? `Hei ${input.name},\n\nDu har bestilt bord for ${input.guests} den ${input.date} kl. ${input.time}.\nReferanse: ${code}\n\nSe eller avbestill: ${site}${manageUrl}\n\n${brand.name}`
            : `Hi ${input.name},\n\nYou've booked a table for ${input.guests} on ${input.date} at ${input.time}.\nReference: ${code}\n\nView or cancel: ${site}${manageUrl}\n\n${brand.name}`,
      }),
    ];
    const inbox = restaurantInbox();
    if (inbox) {
      emails.push(
        sendEmail({
          to: inbox,
          subject: `Ny bordbestilling ${code}: ${input.date} ${input.time}, ${input.guests} gjester`,
          text: `${input.name}\n${input.phone}\n${input.email}\n\n${input.notes}`,
          replyTo: input.email,
        }),
      );
    }
    await Promise.all(emails);

    return NextResponse.json({ code, manageUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingRejected) return jsonError(error.message, 409);
    console.error("[reservations]", error);
    return jsonError("server", 500);
  }
}
