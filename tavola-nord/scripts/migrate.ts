import { mkdirSync } from "node:fs";

async function main() {
  if (process.env.DATABASE_URL) {
    const [{ drizzle }, { migrate }, { Pool }] = await Promise.all([
      import("drizzle-orm/node-postgres"),
      import("drizzle-orm/node-postgres/migrator"),
      import("pg"),
    ]);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    await pool.end();
  } else {
    const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
    mkdirSync(dir, { recursive: true });
    const [{ drizzle }, { migrate }, { PGlite }] = await Promise.all([
      import("drizzle-orm/pglite"),
      import("drizzle-orm/pglite/migrator"),
      import("@electric-sql/pglite"),
    ]);
    const client = new PGlite(dir);
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    await client.close();
  }
  console.log("Database is up to date.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
