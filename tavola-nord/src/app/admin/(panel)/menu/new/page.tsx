import Link from "next/link";
import { MenuItemForm } from "../MenuItemForm";

export default function NewMenuItemPage() {
  return (
    <>
      <Link href="/admin/menu" className="link">Back to the menu</Link>
      <h1 className="mb-6 mt-3 text-3xl font-bold">Add a dish</h1>
      <MenuItemForm />
    </>
  );
}
