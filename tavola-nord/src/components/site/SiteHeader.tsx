"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, translatePath, type Locale } from "@/i18n/routes";

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = getDictionary(locale);
  const other: Locale = locale === "nb" ? "en" : "nb";

  // On phones the dock already has Menu and Events, so the header keeps only what's left.
  const links = [
    { href: routes.menu[locale], label: t.nav.menu, wideOnly: true },
    { href: routes.about[locale], label: t.nav.about, wideOnly: false },
    { href: routes.events[locale], label: t.nav.events, wideOnly: true },
  ];

  return (
    <header className="on-dark sticky top-0 z-30 border-b border-oil/25 bg-lagoon/95 text-mist backdrop-blur">
      <a href="#main" className="btn btn-oil absolute left-3 top-3 z-50 -translate-y-24 focus:translate-y-0">
        {t.nav.skip}
      </a>
      <div className="page flex min-h-[4.25rem] items-center justify-between gap-4">
        <Link href={routes.home[locale]} className="flex items-center gap-3 no-underline">
          <img src="/icon.svg" alt="" className="size-10 sm:size-11" />
          <span className="flex flex-col leading-none">
            <span className="display text-[1.6rem] text-mist sm:text-[1.75rem]">{brand.name}</span>
            <span className="eyebrow mt-1 text-[0.625rem] text-oil">Bar &amp; Restaurant</span>
          </span>
        </Link>
        <nav aria-label={t.nav.main} className="flex items-center gap-1 sm:gap-2">
          <ul className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => (
              <li key={link.href} className={link.wideOnly ? "hidden sm:block" : ""}>
                <Link
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className="eyebrow inline-flex min-h-11 items-center px-2 text-mist/90 underline-offset-8 hover:text-oil aria-[current=page]:text-oil aria-[current=page]:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={translatePath(pathname, other)}
            hrefLang={other}
            lang={other}
            className="inline-flex min-h-11 items-center px-2 text-[0.875rem] text-mist/80 underline underline-offset-4 hover:text-oil"
          >
            {t.nav.switchTo}
          </Link>
          <Link href={routes.book[locale]} className="btn btn-oil eyebrow ml-1 hidden min-h-10 rounded-none px-4 sm:inline-flex">
            {t.nav.book}
          </Link>
        </nav>
      </div>
    </header>
  );
}
