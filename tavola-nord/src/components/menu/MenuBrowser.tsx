"use client";

import { useEffect, useMemo, useState } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { filterMenu, menuCategories, type MenuEntry } from "@/lib/menu-filter";
import { formatNok } from "@/lib/pricing";
import { PlateArt } from "../art/PlateArt";

function readInitialFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get("q") ?? "",
    avoid: params.get("without")?.split(",").filter(Boolean) ?? [],
    vegetarian: params.get("vegetarian") === "1",
    glutenFree: params.get("gluten-free") === "1",
  };
}

export function MenuBrowser({ locale, items }: { locale: Locale; items: MenuEntry[] }) {
  const t = getDictionary(locale);
  const [query, setQuery] = useState("");
  const [avoid, setAvoid] = useState<string[]>([]);
  const [vegetarian, setVegetarian] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);

  // Filters live in the address, so a filtered menu can be shared. Read them after hydration.
  useEffect(() => {
    if (!window.location.search) return;
    const initial = readInitialFilters();
    setQuery(initial.query);
    setAvoid(initial.avoid);
    setVegetarian(initial.vegetarian);
    setGlutenFree(initial.glutenFree);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (avoid.length) params.set("without", avoid.join(","));
    if (vegetarian) params.set("vegetarian", "1");
    if (glutenFree) params.set("gluten-free", "1");
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", next);
  }, [query, avoid, vegetarian, glutenFree]);

  const visible = useMemo(
    () => filterMenu(items, { query, avoid, vegetarian, glutenFree, locale }),
    [items, query, avoid, vegetarian, glutenFree, locale],
  );

  const allergenKeys = Object.keys(t.menu.allergens);
  const hasFilters = Boolean(query || avoid.length || vegetarian || glutenFree);

  function clear() {
    setQuery("");
    setAvoid([]);
    setVegetarian(false);
    setGlutenFree(false);
  }

  function toggleAvoid(key: string) {
    setAvoid((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  const chip =
    "inline-flex min-h-10 cursor-pointer items-center rounded-full border-2 border-ink px-3.5 text-[0.9375rem] font-medium select-none has-[:checked]:bg-ink has-[:checked]:text-mist has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lagoon";

  if (items.length === 0) return <p className="py-10">{t.menu.menuEmpty}</p>;

  const categories = menuCategories.filter((category) => visible.some((item) => item.category === category));

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <div>
          <label htmlFor="menu-search" className="field-label">
            {t.menu.search}
          </label>
          <input id="menu-search" type="search" className="input" placeholder={t.menu.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          <fieldset className="mt-4">
            <legend className="field-label">{t.menu.diet}</legend>
            <div className="flex flex-wrap gap-2">
              <label className={chip}>
                <input type="checkbox" className="sr-only" checked={vegetarian} onChange={(e) => setVegetarian(e.target.checked)} />
                {t.menu.vegetarian}
              </label>
              <label className={chip}>
                <input type="checkbox" className="sr-only" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} />
                {t.menu.glutenFree}
              </label>
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend className="field-label">{t.menu.avoid}</legend>
          <div className="flex flex-wrap gap-2">
            {allergenKeys.map((key) => (
              <label key={key} className={chip}>
                <input type="checkbox" className="sr-only" checked={avoid.includes(key)} onChange={() => toggleAvoid(key)} />
                {t.menu.allergens[key]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <p role="status" className="font-semibold" data-testid="menu-count">
          {t.menu.count(visible.length, items.length)}
        </p>
        {hasFilters ? (
          <button type="button" className="link min-h-11" onClick={clear}>
            {t.menu.clear}
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-ink/40 p-8">
          <p className="text-xl font-bold">{t.menu.empty}</p>
          <p className="mt-1">{t.menu.emptyHelp}</p>
          <button type="button" className="btn btn-ink mt-4" onClick={clear}>
            {t.menu.clear}
          </button>
        </div>
      ) : (
        <>
          <nav aria-label={t.menu.jump} className="no-scrollbar sticky top-0 z-20 -mx-4 mt-6 overflow-x-auto bg-mist px-4 py-2 sm:-mx-8 sm:px-8">
            <ul className="flex w-max gap-1">
              {categories.map((category) => (
                <li key={category}>
                  <a href={`#${category}`} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 font-medium underline-offset-4 hover:bg-ink/10 hover:underline">
                    {t.menu.categories[category]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {categories.map((category) => {
            const rows = visible.filter((item) => item.category === category);
            const note = t.menu.categoryNotes[category];
            return (
              <section key={category} id={category} aria-labelledby={`heading-${category}`} className="scroll-mt-16 grid gap-x-10 gap-y-3 border-t-2 border-ink py-10 lg:grid-cols-[18rem_1fr]">
                <div className="flex items-center gap-4 lg:sticky lg:top-16 lg:block lg:self-start">
                  <PlateArt art={rows[0]?.art ?? "antipasti"} className="size-20 shrink-0 lg:mb-4 lg:size-44" />
                  <div>
                    <h2 id={`heading-${category}`} className="display text-4xl text-tomato lg:text-5xl">
                      {t.menu.categories[category]}
                    </h2>
                    {note ? <p className="field-hint mt-1">{note}</p> : null}
                  </div>
                </div>
                <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                  {rows.map((item) => (
                    <li key={item.id} data-testid="menu-item">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <p className="whitespace-nowrap font-semibold">{formatNok(item.priceNok, locale)}</p>
                      </div>
                      <p className="mt-0.5">{locale === "nb" ? item.descriptionNb : item.descriptionEn}</p>
                      <p className="field-hint mt-1">
                        {item.allergens.length > 0
                          ? `${t.menu.contains}: ${item.allergens.map((key) => (t.menu.allergens[key] ?? key).toLowerCase()).join(", ")}`
                          : t.menu.noAllergens}
                      </p>
                      {item.vegetarian || item.glutenFree ? (
                        <p className="mt-1.5 flex flex-wrap gap-1.5 text-sm font-semibold">
                          {item.vegetarian ? <span className="rounded-full bg-basil px-2.5 py-0.5 text-white">{t.menu.vegetarian}</span> : null}
                          {item.glutenFree ? <span className="rounded-full bg-lagoon px-2.5 py-0.5 text-white">{t.menu.glutenFree}</span> : null}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
