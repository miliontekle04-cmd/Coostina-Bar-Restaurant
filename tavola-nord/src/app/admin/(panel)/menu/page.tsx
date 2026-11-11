import { asc } from "drizzle-orm";
import Link from "next/link";
import { saveEventMenu, toggleMenuItem } from "@/app/admin/actions";
import { SaveButton } from "@/components/admin/SaveButton";
import { getDb } from "@/db/client";
import { eventMenus, menuItems } from "@/db/schema";
import { getDictionary } from "@/i18n/dictionaries";
import { menuCategories } from "@/lib/menu-filter";
import { formatNok } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const t = getDictionary("en");
  const db = await getDb();
  const [items, sets] = await Promise.all([
    db.select().from(menuItems).orderBy(asc(menuItems.sort), asc(menuItems.id)),
    db.select().from(eventMenus).orderBy(asc(eventMenus.sort), asc(eventMenus.id)),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Menu</h1>
        <Link href="/admin/menu/new" className="btn btn-primary">Add a dish</Link>
      </div>

      {items.length === 0 ? <p className="mt-4">No dishes yet. Add the first one to fill the public menu.</p> : null}

      {menuCategories.map((category) => {
        const rows = items.filter((item) => item.category === category);
        if (rows.length === 0) return null;
        return (
          <section key={category} className="mt-8">
            <h2 className="border-b-2 border-ink pb-1 text-xl font-bold">{t.menu.categories[category]}</h2>
            <ul className="divide-y divide-line">
              {rows.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 py-1.5">
                  <span className={item.available ? "" : "text-ink-soft line-through"}>
                    <Link className="link" href={`/admin/menu/${item.id}`}>{item.name}</Link>
                    <span className="ml-3">{formatNok(item.priceNok, "en")}</span>
                  </span>
                  <form action={toggleMenuItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="available" value={String(!item.available)} />
                    <button type="submit" className="link min-h-11 font-normal">
                      {item.available ? `Hide ${item.name}` : `Show ${item.name}`}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-14 border-t-2 border-ink pt-6">
        <h2 className="text-2xl font-bold">Event menus</h2>
        <p className="mt-1 max-w-prose">Price changes apply to new enquiries. Enquiries already sent keep the price they were sent with.</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {sets.map((set) => (
            <form key={set.id} action={saveEventMenu} className="grid gap-3 rounded-xl border-2 border-ink bg-paper p-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={set.id} />
              {[
                { name: "nameNb", label: "Name (Norwegian)", value: set.nameNb },
                { name: "nameEn", label: "Name (English)", value: set.nameEn },
                { name: "starter", label: "Starter", value: set.starter },
                { name: "main", label: "Main", value: set.main },
                { name: "dessert", label: "Dessert", value: set.dessert },
              ].map((field) => (
                <div key={field.name}>
                  <label htmlFor={`${field.name}-${set.id}`} className="field-label">{field.label}</label>
                  <input id={`${field.name}-${set.id}`} name={field.name} defaultValue={field.value} required className="input" />
                </div>
              ))}
              <div>
                <label htmlFor={`price-${set.id}`} className="field-label">Price per person (kr)</label>
                <input id={`price-${set.id}`} name="priceNok" type="number" min={0} defaultValue={set.priceNok} required className="input" />
              </div>
              <label className="flex min-h-11 items-center gap-2">
                <input type="checkbox" name="active" defaultChecked={set.active} className="size-5" />
                Offer this menu
              </label>
              <div className="self-end sm:text-right">
                <SaveButton>Save {set.nameEn}</SaveButton>
              </div>
            </form>
          ))}
        </div>
      </section>
    </>
  );
}
