import { getDb } from "../src/db/client";
import { eventMenus, menuItems } from "../src/db/schema";
import { demoEventMenus, demoMenuItems } from "./seed-data";

/** Replaces the menu and event menus with the ones in seed-data.ts. Bookings, enquiries and admins are kept. */
async function main() {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(menuItems);
    await tx.delete(eventMenus);
    await tx.insert(menuItems).values(demoMenuItems.map((item, index) => ({ ...item, sort: index })));
    await tx.insert(eventMenus).values(demoEventMenus.map((menu, index) => ({ ...menu, sort: index })));
  });
  console.log(`Menu replaced: ${demoMenuItems.length} dishes and ${demoEventMenus.length} event menus.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
