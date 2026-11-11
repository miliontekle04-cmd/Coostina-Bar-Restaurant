export const locales = ["nb", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type RouteKey = "home" | "menu" | "book" | "events" | "about" | "privacy";

/** Public addresses. The folder names under app/[locale] use the English slugs. */
export const routes: Record<RouteKey, Record<Locale, string>> = {
  home: { nb: "/", en: "/en" },
  menu: { nb: "/meny", en: "/en/menu" },
  book: { nb: "/bestill-bord", en: "/en/book" },
  events: { nb: "/selskap", en: "/en/events" },
  about: { nb: "/om-oss", en: "/en/about" },
  privacy: { nb: "/personvern", en: "/en/privacy" },
};

const NB_MANAGE = "/bestilling/";
const EN_MANAGE = "/en/reservation/";

export function managePath(locale: Locale, token: string): string {
  return `${locale === "nb" ? NB_MANAGE : EN_MANAGE}${token}`;
}

/** Maps a public Norwegian address to its internal route. Used by src/proxy.ts. */
export function internalPathForNorwegian(pathname: string): string {
  if (pathname.startsWith(NB_MANAGE)) return `/nb/reservation/${pathname.slice(NB_MANAGE.length)}`;
  const entry = (Object.entries(routes) as [RouteKey, Record<Locale, string>][]).find(([, r]) => r.nb === pathname);
  if (!entry) return `/nb${pathname}`;
  return entry[0] === "home" ? "/nb" : `/nb/${routes[entry[0]].en.replace("/en/", "")}`;
}

/** The same page in the other language, for the language switch. */
export function translatePath(pathname: string, target: Locale): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  for (const route of Object.values(routes)) {
    if (route.nb === clean || route.en === clean) return route[target];
  }
  if (clean.startsWith(NB_MANAGE)) return managePath(target, clean.slice(NB_MANAGE.length));
  if (clean.startsWith(EN_MANAGE)) return managePath(target, clean.slice(EN_MANAGE.length));
  return routes.home[target];
}
