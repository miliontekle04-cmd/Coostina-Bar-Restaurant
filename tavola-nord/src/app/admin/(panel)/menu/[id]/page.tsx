import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMenuItem } from "@/app/admin/actions";
import { getDb } from "@/db/client";
import { menuItems } from "@/db/schema";
import { MenuItemForm } from "../MenuItemForm";

export const dynamic = "force-dynamic";

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!item) notFound();

  return (
    <>
      <Link href="/admin/menu" className="link">Back to the menu</Link>
      <h1 className="mb-6 mt-3 text-3xl font-bold">Edit {item.name}</h1>
      <MenuItemForm item={item} />
      <details className="mt-10 max-w-2xl border-t border-line pt-4">
        <summary className="link inline-flex min-h-11 items-center">Delete this dish</summary>
        <form action={deleteMenuItem} className="mt-2">
          <input type="hidden" name="id" value={item.id} />
          <p>This removes the dish permanently. To take it off the menu for now, hide it instead.</p>
          <button type="submit" className="btn btn-primary mt-3">Delete permanently</button>
        </form>
      </details>
    </>
  );
}
