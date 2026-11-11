import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { reservations } from "@/db/schema";
import { canCancel, restaurantNow } from "@/lib/booking";
import { jsonError, readJson } from "@/lib/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { sha256 } from "@/lib/security";
import { cancelSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = cancelSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("not_found", 404);

  try {
    if (!(await allowRequest("cancel", clientKey(request.headers), 20, 600))) return jsonError("rate_limited", 429);

    const db = await getDb();
    const tokenHash = sha256(parsed.data.token);
    const [booking] = await db.select().from(reservations).where(eq(reservations.manageTokenHash, tokenHash));
    if (!booking) return jsonError("not_found", 404);
    if (booking.status === "cancelled") return NextResponse.json({ status: "cancelled" });
    if (booking.status !== "confirmed" || !canCancel(booking.date, booking.time, restaurantNow())) {
      return jsonError("too_late", 409);
    }

    await db
      .update(reservations)
      .set({ status: "cancelled" })
      .where(and(eq(reservations.id, booking.id), eq(reservations.status, "confirmed")));
    return NextResponse.json({ status: "cancelled" });
  } catch (error) {
    console.error("[reservations/cancel]", error);
    return jsonError("server", 500);
  }
}
