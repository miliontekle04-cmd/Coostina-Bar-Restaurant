import type { Metadata } from "next";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { getAvailableMenu } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return pageMetadata(locale, "menu", t.meta.menuTitle, t.meta.menuDescription);
}

export default async function MenuPage({ params }: Props) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const items = await getAvailableMenu();

  return (
    <div className="page pb-10 pt-6">
      <h1 className="display text-[clamp(3.5rem,10vw,7rem)] leading-none text-tomato">{t.menu.heading}</h1>
      <p className="mb-8 mt-3 max-w-[60ch] text-lg">{t.menu.intro}</p>
      <MenuBrowser locale={locale} items={items} />
    </div>
  );
}
