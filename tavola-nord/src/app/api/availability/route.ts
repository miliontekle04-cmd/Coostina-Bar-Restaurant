import { NextResponse, type NextRequest } from "next/server";
import { computeAvailability, restaurantNow } from "@/lib/booking";
import { jsonError } from "@/lib/http";
import { getBookingsForDate, isDateClosed } from "@/lib/queries";
import { availabilityQuerySchema, fieldErrors } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return jsonError("validation", 400, fieldErrors(parsed.error));

  const { date, guests } = parsed.data;
  try {
    const [bookings, isClosedDate] = await Promise.all([getBookingsForDate(date), isDateClosed(date)]);
    const result = computeAvailability({ date, guests, bookings, isClosedDate, now: restaurantNow() });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[availability]", error);
    return jsonError("server", 500);
  }
}
