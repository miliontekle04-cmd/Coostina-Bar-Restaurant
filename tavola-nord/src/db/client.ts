import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const [{ drizzle }, { Pool }] = await Promise.all([import("drizzle-orm/node-postgres"), import("pg")]);
    return drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_EMBEDDED_DB !== "1") {
    throw new Error("DATABASE_URL is required in production. Set ALLOW_EMBEDDED_DB=1 to use the embedded database.");
  }
  const [{ drizzle }, { PGlite }] = await Promise.all([import("drizzle-orm/pglite"), import("@electric-sql/pglite")]);
  const client = new PGlite(process.env.PGLITE_DIR ?? "./.data/pglite");
  await client.waitReady;
  // The two drivers expose the same query API, so the rest of the app only sees one type.
  return drizzle(client, { schema }) as unknown as Db;
}

/** One shared connection per process, which also survives hot reloads in development. */
export function getDb(): Promise<Db> {
  globalForDb.__db ??= connect();
  return globalForDb.__db;
}
