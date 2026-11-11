import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { getDb } from "@/db/client";
import { enquiries, type Allocation } from "@/db/schema";
import { addDays, restaurantNow } from "@/lib/booking";
import { restaurantInbox, sendEmail } from "@/lib/email";
import { jsonError, readJson } from "@/lib/http";
import { summarizeEnquiry } from "@/lib/pricing";
import { getActiveEventMenus, isDateClosed } from "@/lib/queries";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { referenceCode } from "@/lib/security";
import { enquirySchema, fieldErrors } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === undefined) return jsonError("invalid_body", 400);

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return jsonError("validation", 400, fieldErrors(parsed.error));
  const input = parsed.data;

  if (input.website) return NextResponse.json({ code: "TS-OK" }, { status: 201 });

  const today = restaurantNow().date;
  if (input.date < addDays(today, brand.events.minDaysAhead)) return jsonError("date_too_soon", 400);
  if (input.date > addDays(today, brand.events.maxDaysAhead)) return jsonError("validation", 400, { date: "date" });

  try {
    if (!(await allowRequest("enquiry", clientKey(request.headers), 5, 600))) return jsonError("rate_limited", 429);
    if (await isDateClosed(input.date)) return jsonError("closed", 409);

    // The browser sends who wants what. Prices always come from the database.
    const menus = await getActiveEventMenus();
    const chosen = input.allocations.filter((a) => a.guests > 0);
    const summary = summarizeEnquiry(input.guests, chosen, menus);
    if (summary.invalid) return jsonError("validation", 400, { allocations: "allocation" });

    const allocations: Allocation[] = chosen.map((a) => {
      const menu = menus.find((m) => m.id === a.menuId)!;
      return { menuId: menu.id, name: input.locale === "nb" ? menu.nameNb : menu.nameEn, guests: a.guests, priceNok: menu.priceNok };
    });

    const code = referenceCode("TS");
    const db = await getDb();
    await db.insert(enquiries).values({
      code,
      guests: input.guests,
      date: input.date,
      time: input.time || null,
      allocations,
      estimatedTotalNok: summary.totalNok,
      name: input.name,
      email: input.email,
      phone: input.phone,
      companyInvoice: input.companyInvoice,
      companyName: input.companyInvoice ? input.companyName : "",
      orgNumber: input.companyInvoice ? input.orgNumber.replaceAll(" ", "") : "",
      notes: input.notes,
      locale: input.locale,
    });

    const emails = [
      sendEmail({
        to: input.email,
        subject: input.locale === "nb" ? `Vi har fått forespørselen din (${code})` : `We've received your enquiry (${code})`,
        text:
          input.locale === "nb"
            ? `Hei ${input.name},\n\nTakk for forespørselen om selskap for ${input.guests} gjester den ${input.date}. Vi svarer innen to virkedager.\n\nReferanse: ${code}\n\n${brand.name}`
            : `Hi ${input.name},\n\nThanks for your enquiry about an event for ${input.guests} guests on ${input.date}. We'll reply within two working days.\n\nReference: ${code}\n\n${brand.name}`,
      }),
    ];
    const inbox = restaurantInbox();
    if (inbox) {
      emails.push(
        sendEmail({
          to: inbox,
          subject: `Ny selskapsforespørsel ${code}: ${input.date}, ${input.guests} gjester`,
          text: `${input.name}\n${input.phone}\n${input.email}\n\n${input.notes}`,
          replyTo: input.email,
        }),
      );
    }
    await Promise.all(emails);

    return NextResponse.json({ code, estimatedTotalNok: summary.totalNok }, { status: 201 });
  } catch (error) {
    console.error("[enquiries]", error);
    return jsonError("server", 500);
  }
}
