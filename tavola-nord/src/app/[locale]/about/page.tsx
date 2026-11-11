import type { Metadata } from "next";
import Image from "next/image";
import { PlateArt } from "@/components/art/PlateArt";
import { OpeningHours } from "@/components/site/OpeningHours";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { jsonLdString, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return pageMetadata(locale, "about", t.meta.aboutTitle, t.meta.aboutDescription);
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.about.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="page pb-16 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }} />
      <h1 className="display text-[clamp(3.5rem,10vw,7rem)] leading-none text-tomato">{t.about.heading}</h1>
      <p className="mt-4 max-w-[34ch] text-[clamp(1.4rem,2.6vw,2rem)] font-semibold leading-snug">{t.about.lead}</p>

      <div className="mt-14 grid gap-10 md:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="text-2xl font-bold">{t.about.storyHeading}</h2>
          {t.about.story.map((paragraph) => (
            <p key={paragraph} className="mt-3 max-w-[62ch]">
              {paragraph}
            </p>
          ))}
          <h2 className="mt-10 text-2xl font-bold">{t.about.roomHeading}</h2>
          <p className="mt-3 max-w-[62ch]">{t.about.room}</p>
        </section>
        {brand.photos[0] ? (
          <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden md:max-w-none">
            <Image src={brand.photos[0].src} alt={brand.photos[0].alt[locale]} fill sizes="(min-width: 768px) 20rem, 24rem" className="object-cover" />
          </div>
        ) : (
          <PlateArt art="soup" className="w-48 md:w-full" />
        )}
      </div>

      {brand.photos.length > 1 ? (
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {brand.photos.slice(1).map((photo) => (
            <div key={photo.src} className="relative aspect-[4/3] overflow-hidden">
              <Image src={photo.src} alt={photo.alt[locale]} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      <section className="mt-16 grid gap-10 border-t-2 border-ink pt-10 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-bold">{t.home.hoursHeading}</h2>
          <OpeningHours locale={locale} />
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-bold">{t.home.contactHeading}</h2>
          <address className="not-italic">
            {brand.address.street}, {brand.address.postalCode} {brand.address.city}
          </address>
          <p className="mt-3">
            {t.nav.book}:{" "}
            <a className="link" href={brand.phone.href}>
              {brand.phone.display}
            </a>
            <br />
            {t.nav.events}:{" "}
            <a className="link" href={brand.eventsPhone.href}>
              {brand.eventsPhone.display}
            </a>
            {brand.email ? (
              <>
                <br />
                {t.common.email}:{" "}
                <a className="link" href={`mailto:${brand.email}`}>
                  {brand.email}
                </a>
              </>
            ) : null}
          </p>
          {brand.mapsUrl ? (
            <p className="mt-2">
              <a className="link" href={brand.mapsUrl} rel="noopener noreferrer">
                {t.home.directions}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="display text-[clamp(2.25rem,5vw,3.75rem)] text-lagoon">
          {t.about.faqHeading}
        </h2>
        <div className="mt-6 max-w-3xl border-b-2 border-ink">
          {t.about.faq.map((item) => (
            <details key={item.q} className="border-t-2 border-ink">
              <summary className="flex min-h-14 items-center justify-between gap-4 py-3 text-lg font-semibold">
                {item.q}
                <span aria-hidden="true" className="faq-mark text-2xl leading-none">
                  +
                </span>
              </summary>
              <p className="max-w-[62ch] pb-5">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
