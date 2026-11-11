import type { Metadata } from "next";
import { EventPlanner } from "@/components/events/EventPlanner";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { addDays, restaurantNow } from "@/lib/booking";
import { getActiveEventMenus } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return pageMetadata(locale, "events", t.meta.eventsTitle, t.meta.eventsDescription);
}

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const today = restaurantNow().date;
  const menus = await getActiveEventMenus();

  return (
    <div className="page pb-16 pt-6">
      <h1 className="display text-[clamp(3.5rem,10vw,7rem)] leading-none text-tomato">{t.events.heading}</h1>
      <p className="mt-4 max-w-[60ch] text-lg">{t.events.lead}</p>
      <p className="mb-10 mt-1 max-w-[60ch] text-lg">
        {t.events.invoiceNote}{" "}
        <a className="link" href={brand.eventsPhone.href}>
          {brand.eventsPhone.display}
        </a>
      </p>
      <EventPlanner
        locale={locale}
        minDate={addDays(today, brand.events.minDaysAhead)}
        maxDate={addDays(today, brand.events.maxDaysAhead)}
        menus={menus.map((menu) => ({
          id: menu.id,
          name: locale === "nb" ? menu.nameNb : menu.nameEn,
          priceNok: menu.priceNok,
          starter: menu.starter,
          main: menu.main,
          dessert: menu.dessert,
        }))}
      />
    </div>
  );
}
