import { randomBytes } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { adminUsers, eventMenus, menuItems } from "../src/db/schema";
import { hashPassword } from "../src/lib/security";
import { demoEventMenus, demoMenuItems } from "./seed-data";

async function main() {
  const db = await getDb();

  const [items] = await db.select({ value: count() }).from(menuItems);
  if (items?.value === 0) {
    await db.insert(menuItems).values(demoMenuItems.map((item, index) => ({ ...item, sort: index })));
    console.log(`Added ${demoMenuItems.length} menu items.`);
  }

  const [sets] = await db.select({ value: count() }).from(eventMenus);
  if (sets?.value === 0) {
    await db.insert(eventMenus).values(demoEventMenus.map((menu, index) => ({ ...menu, sort: index })));
    console.log(`Added ${demoEventMenus.length} event menus.`);
  }

  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email));
  if (!existing) {
    const provided = process.env.ADMIN_PASSWORD;
    if (provided && provided.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    const password = provided ?? randomBytes(15).toString("base64url");
    await db.insert(adminUsers).values({ email, passwordHash: await hashPassword(password) });
    console.log(`Created admin ${email}.`);
    if (!provided) console.log(`Generated password, shown only once: ${password}`);
  }

  console.log("Seed finished.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
