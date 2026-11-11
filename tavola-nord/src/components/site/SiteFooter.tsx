import Link from "next/link";
import { brand, displayTime } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const links: { key: keyof typeof routes; label: string }[] = [
    { key: "menu", label: t.nav.menu },
    { key: "about", label: t.nav.about },
    { key: "events", label: t.nav.events },
    { key: "book", label: t.nav.book },
  ];
  const weekday = brand.hours[1];
  const weekend = brand.hours[5];

  return (
    <footer className="on-dark mt-auto bg-lagoon text-mist">
      <div className="page grid gap-10 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <p className="display text-4xl text-mist">{brand.name}</p>
          <p className="eyebrow mt-1 text-oil">Bar &amp; Restaurant</p>
          <p className="mt-5 max-w-[32ch] text-mist/80">{t.footer.tagline}</p>
        </div>
        <nav aria-label={t.nav.main}>
          <h2 className="eyebrow mb-3 text-oil">{t.footer.explore}</h2>
          <ul className="space-y-1.5">
            {links.map((link) => (
              <li key={link.key}>
                <Link href={routes[link.key][locale]} className="link font-normal no-underline hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="eyebrow mb-3 text-oil">{t.home.contactHeading}</h2>
          <address className="not-italic">
            {brand.address.street}
            <br />
            {brand.address.postalCode} {brand.address.city}
          </address>
          <p className="mt-3 space-y-1.5">
            <a className="link block font-normal" href={brand.phone.href}>
              {brand.phone.display}
            </a>
            {brand.email ? (
              <a className="link block font-normal" href={`mailto:${brand.email}`}>
                {brand.email}
              </a>
            ) : null}
          </p>
          <SocialLinks locale={locale} className="mt-5" />
        </div>
        <div>
          <h2 className="eyebrow mb-3 text-oil">{t.home.hoursHeading}</h2>
          {weekday && weekend ? (
            <p>
              {t.footer.weekdays}: {weekday.open}–{displayTime(weekday.close)}
              <br />
              {t.footer.weekend}: {weekend.open}–{displayTime(weekend.close)}
            </p>
          ) : null}
          <p className="mt-2 text-mist/80">{t.footer.openDaily}</p>
        </div>
      </div>
      {/* The bottom padding leaves room for the floating dock on phones. */}
      <div className="page flex flex-wrap justify-between gap-x-8 gap-y-2 border-t border-oil/25 pb-24 pt-5 text-[0.9375rem] text-mist/75 sm:pb-6">
        <p>
          © {new Date().getFullYear()} {brand.legalName}
          {brand.orgNumber ? `, org.nr. ${brand.orgNumber}` : ""}
        </p>
        <Link href={routes.privacy[locale]} className="link font-normal">
          {t.nav.privacy}
        </Link>
        {brand.isDemo ? <p className="basis-full">{t.common.demoNotice}</p> : null}
      </div>
    </footer>
  );
}
