import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { adminUsers, sessions } from "@/db/schema";
import { randomToken, sha256 } from "./security";

const COOKIE = "tn_admin_session";
const SESSION_DAYS = 7;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
  };
}

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.insert(sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  const store = await cookies();
  store.set(COOKIE, token, { ...cookieOptions(), expires: expiresAt });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  store.delete(COOKIE);
}

export async function currentAdmin(): Promise<{ id: string; email: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: adminUsers.id, email: adminUsers.email })
    .from(sessions)
    .innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())));
  return row ?? null;
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
