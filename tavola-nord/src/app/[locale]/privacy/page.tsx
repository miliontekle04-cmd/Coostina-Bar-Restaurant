import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return pageMetadata(locale, "privacy", t.meta.privacyTitle, t.meta.privacyDescription);
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <div className="page pb-16 pt-6">
      <h1 className="display text-[clamp(3rem,8vw,6rem)] leading-none text-tomato">{t.privacy.heading}</h1>
      <p className="field-hint mt-3">{t.privacy.updated}</p>
      <div className="mt-8 max-w-[64ch] space-y-8">
        {t.privacy.sections.map((section) => (
          <section key={section.h}>
            <h2 className="text-xl font-bold">{section.h}</h2>
            <p className="mt-1">{section.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
