import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimits } from "@/db/schema";
import { sha256 } from "./security";

/** The IP address is only ever stored as a salted hash. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip") || "local";
  if (!process.env.APP_SECRET && process.env.NODE_ENV === "production") {
    console.warn("[rate-limit] APP_SECRET is not set, so IP hashes use a known salt. Set it before going live.");
  }
  return sha256(`${process.env.APP_SECRET ?? "dev-secret"}:${ip}`);
}

/**
 * Fixed-window counter kept in the database, so it also works across serverless instances.
 * Returns true when the request is allowed.
 */
export async function allowRequest(scope: string, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = await getDb();
  // Now and then, clear out counters from past days so the table doesn't keep growing.
  if (Math.random() < 0.01) await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < now() - interval '1 day'`);
  const id = `${scope}:${key}`;
  const expired = sql`${rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds})`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key: id, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${expired} THEN now() ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ count: rateLimits.count });
  return (row?.count ?? 1) <= limit;
}
