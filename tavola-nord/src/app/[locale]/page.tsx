import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PlateArt } from "@/components/art/PlateArt";
import { OpeningHours } from "@/components/site/OpeningHours";
import { HeroSlides } from "@/components/site/HeroSlides";
import { SocialLinks } from "@/components/site/SocialLinks";
import { FreeTables, TodayStatus, WhatsOn } from "@/components/site/WhatsOn";
import { brand, displayTime } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import { addDays, restaurantNow } from "@/lib/booking";
import { formatNok } from "@/lib/pricing";
import { getActiveEventMenus, getFeaturedMenu, getUpcomingEvents, isDateClosed } from "@/lib/queries";
import { eventsJsonLd, jsonLdString, pageMetadata } from "@/lib/seo";
import { dayStatus, findFreeTimes } from "@/lib/whats-on";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return pageMetadata(locale, "home", t.meta.homeTitle, t.meta.homeDescription);
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const now = restaurantNow();
  const [featured, eventMenus, upcoming, closedToday, free] = await Promise.all([
    getFeaturedMenu(),
    getActiveEventMenus(),
    getUpcomingEvents(now.date, addDays(now.date, 13), 6),
    isDateClosed(now.date),
    findFreeTimes(now),
  ]);
  const tonight = upcoming.filter((item) => item.date === now.date);
  const lowestEventPrice = eventMenus.length ? Math.min(...eventMenus.map((menu) => menu.priceNok)) : null;
  const weekday = brand.hours[1];
  const weekend = brand.hours[5];

  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-lagoon text-mist">
        <HeroSlides locale={locale} />
        <div className="page relative flex min-h-[min(88svh,52rem)] flex-col items-center justify-center py-20 text-center">
          <img src="/brand/coostina-logo-light.svg" alt="" className="mb-8 w-[min(24rem,78vw)] drop-shadow-[0_2px_12px_#0008]" />
          <p className="eyebrow text-oil">
            {brand.address.area} · {brand.address.city}
          </p>
          <h1 className="display mx-auto mt-4 max-w-[20ch] text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.1]">{t.home.heading}</h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-lg text-mist/90 sm:text-xl">{t.home.intro}</p>
          <TodayStatus locale={locale} status={dayStatus(now, brand.hours, closedToday)} tonight={tonight} />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={routes.book[locale]} className="btn btn-oil eyebrow rounded-none px-7">
              {t.home.ctaBook}
            </Link>
            <Link href={routes.menu[locale]} className="btn btn-outline eyebrow rounded-none px-7">
              {t.home.ctaMenu}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-paper">
        <div className="page flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-5 text-center">
          <p className="display text-2xl text-tomato">{t.home.openDaily}</p>
          {weekday && weekend ? (
            <p className="text-ink-soft">{t.home.openSummary(weekday.open, displayTime(weekday.close), displayTime(weekend.close))}</p>
          ) : null}
        </div>
        {free ? (
          <div className="page border-t border-line py-4">
            <FreeTables locale={locale} today={now.date} free={free} />
          </div>
        ) : null}
      </section>

      <WhatsOn locale={locale} today={now.date} items={upcoming} />
      {upcoming.length > 0 ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(eventsJsonLd(locale, upcoming)) }} /> : null}

      <section className="py-20 md:py-28" aria-labelledby="menu-heading">
        <div className="page text-center">
          <p className="eyebrow text-tomato">{t.home.menuEyebrow}</p>
          <h2 id="menu-heading" className="display mx-auto mt-3 max-w-[20ch] text-[clamp(2.25rem,5vw,3.75rem)]">
            {t.home.menuHeading}
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-lg">{t.home.menuBody}</p>
          <Link href={routes.menu[locale]} className="btn btn-ink eyebrow mt-8 rounded-none px-7">
            {t.home.menuLink}
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="no-scrollbar mt-14 overflow-x-auto">
            <ul className="marquee gap-6 px-3">
              {/* The second copy makes the loop seamless and is hidden from screen readers. */}
              {[...featured, ...featured].map((item, index) => (
                <li key={`${item.id}-${index}`} aria-hidden={index >= featured.length ? true : undefined} className="w-56 shrink-0 text-center sm:w-64">
                  <div className="flex aspect-square items-center justify-center bg-lagoon">
                    <PlateArt art={item.art} className="w-4/5" />
                  </div>
                  <h3 className="display mt-4 text-xl">{item.name}</h3>
                  <p className="mt-1 text-ink-soft">{formatNok(item.priceNok, locale)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="on-dark bg-tomato text-mist" aria-labelledby="bar-heading">
        <div className="page grid gap-12 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="eyebrow text-oil">{t.home.barEyebrow}</p>
            <h2 id="bar-heading" className="display mt-3 text-[clamp(2.25rem,5vw,3.75rem)]">
              {t.home.barHeading}
            </h2>
            <p className="mt-5 max-w-[46ch] text-lg text-mist/90">{t.home.barBody}</p>
          </div>
          <ul className="grid content-center gap-6">
            {t.home.barPoints.map((point) => (
              <li key={point.h} className="border-t border-oil/40 pt-5">
                <h3 className="display text-2xl text-oil">{point.h}</h3>
                <p className="mt-1 text-mist/90">{point.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="on-dark bg-lagoon py-20 text-mist md:py-28" aria-labelledby="fun-heading">
        <div className="page">
          <div className="text-center">
            <p className="eyebrow text-oil">{t.home.funEyebrow}</p>
            <h2 id="fun-heading" className="display mx-auto mt-3 max-w-[22ch] text-[clamp(2.25rem,5vw,3.75rem)]">
              {t.home.funHeading}
            </h2>
            <p className="mx-auto mt-5 max-w-[58ch] text-lg text-mist/85">{t.home.funBody}</p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.funItems.map((item) => (
              <li key={item.h} className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden p-6">
                <Image
                  src={item.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: item.focus }}
                />
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#1c181400_30%,#1c1814f2_85%)]" />
                <h3 className="display text-3xl">{item.h}</h3>
                <p className="mt-2 text-mist/90">{item.p}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center">
            <Link href={routes.events[locale]} className="btn btn-oil eyebrow rounded-none px-7">
              {t.home.funCta}
            </Link>
          </p>
        </div>
      </section>

      {brand.promoVideo ? (
        <section className="bg-paper py-20 md:py-28" aria-labelledby="video-heading">
          <div className="page text-center">
            <p className="eyebrow text-tomato">{t.home.videoEyebrow}</p>
            <h2 id="video-heading" className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)]">
              {t.home.videoHeading}
            </h2>
            <video
              className="mx-auto mt-10 aspect-video w-full max-w-5xl bg-lagoon shadow-[0_20px_50px_#231a1540]"
              src={brand.promoVideo.src}
              poster={brand.promoVideo.poster}
              controls
              muted
              playsInline
              preload="none"
              aria-label={t.home.videoLabel}
            />
          </div>
        </section>
      ) : null}

      <section className="page grid items-center gap-10 py-20 md:grid-cols-2 md:py-28" aria-labelledby="events-heading">
        <div className="relative aspect-[4/3] overflow-hidden bg-lagoon">
          {brand.photos[1] ? (
            <Image src={brand.photos[1].src} alt={brand.photos[1].alt[locale]} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-right" />
          ) : (
            <PlateArt art="antipasti" className="absolute inset-0 m-auto w-1/2" />
          )}
        </div>
        <div>
          <p className="eyebrow text-tomato">{t.home.eventsEyebrow}</p>
          <h2 id="events-heading" className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)]">
            {t.home.eventsHeading}
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg">{t.home.eventsBody}</p>
          {lowestEventPrice ? <p className="mt-3 font-semibold">{t.home.eventsFrom(formatNok(lowestEventPrice, locale))}</p> : null}
          <Link href={routes.events[locale]} className="btn btn-primary eyebrow mt-8 rounded-none px-7">
            {t.home.eventsCta}
          </Link>
        </div>
      </section>

      {brand.reviews.length > 0 ? (
        <section className="bg-paper py-20" aria-labelledby="reviews-heading">
          <div className="page">
            <h2 id="reviews-heading" className="display text-center text-[clamp(2.25rem,5vw,3.5rem)]">
              {t.home.reviewsHeading}
            </h2>
            <ul className="mt-10 grid gap-8 md:grid-cols-3">
              {brand.reviews.map((review) => (
                <li key={`${review.author}-${review.source}`} className="border-t border-line pt-5">
                  <blockquote className="display text-xl leading-snug">“{review.text}”</blockquote>
                  <p className="eyebrow mt-4 text-ink-soft">
                    {review.author}, {review.source}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="border-t border-line bg-paper" aria-labelledby="visit-heading">
        <div className="page grid gap-12 py-20 md:grid-cols-3 md:py-24">
          <div>
            <p className="eyebrow text-tomato">{brand.address.area}</p>
            <h2 id="visit-heading" className="display mt-3 text-[clamp(2.5rem,5vw,3.75rem)]">
              {t.home.visitHeading}
            </h2>
          </div>
          <div>
            <h3 className="eyebrow mb-4 text-ink-soft">{t.home.hoursHeading}</h3>
            <OpeningHours locale={locale} />
          </div>
          <div>
            <h3 className="eyebrow mb-4 text-ink-soft">{t.home.contactHeading}</h3>
            <address className="text-lg not-italic">
              {brand.address.street}
              <br />
              {brand.address.postalCode} {brand.address.city}
            </address>
            {brand.mapsUrl ? (
              <p className="mt-1">
                <a className="link" href={brand.mapsUrl} rel="noopener noreferrer">
                  {t.home.directions}
                </a>
              </p>
            ) : null}
            {brand.googleReviewsUrl ? (
              <p className="mt-1">
                <a className="link" href={brand.googleReviewsUrl} rel="noopener noreferrer">
                  {t.home.googleReviews}
                </a>
              </p>
            ) : null}
            <p className="mt-4 text-lg">
              <a className="link" href={brand.phone.href}>
                {brand.phone.display}
              </a>
              {brand.email ? (
                <>
                  <br />
                  <a className="link" href={`mailto:${brand.email}`}>
                    {brand.email}
                  </a>
                </>
              ) : null}
            </p>
            <SocialLinks locale={locale} className="mt-6 text-ink" />
          </div>
        </div>
      </section>
    </>
  );
}
