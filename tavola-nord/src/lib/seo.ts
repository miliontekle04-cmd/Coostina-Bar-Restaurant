import type { Metadata } from "next";
import { brand, displayTime } from "@/config/brand";
import { routes, type Locale, type RouteKey } from "@/i18n/routes";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function pageMetadata(locale: Locale, key: RouteKey, title: string, description: string): Metadata {
  const fullTitle = key === "home" ? title : `${title} | ${brand.fullName}`;
  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: routes[key][locale],
      languages: { nb: routes[key].nb, en: routes[key].en, "x-default": routes[key].nb },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: routes[key][locale],
      siteName: brand.fullName,
      locale: locale === "nb" ? "nb_NO" : "en_GB",
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: brand.name }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ["/og-image.png"] },
  };
}

const schemaDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function restaurantJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: brand.name,
    url: `${siteUrl()}${routes.home[locale]}`,
    menu: `${siteUrl()}${routes.menu[locale]}`,
    alternateName: brand.fullName,
    servesCuisine: ["Caribbean"],
    priceRange: "$$",
    acceptsReservations: true,
    telephone: brand.phone.href.replace("tel:", ""),
    ...(brand.email ? { email: brand.email } : {}),
    // Lets search engines connect the website to the social profiles once they are added.
    sameAs: brand.socials.flatMap((social) => (social.href ? [social.href] : [])),
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.address.street,
      postalCode: brand.address.postalCode,
      addressLocality: brand.address.city,
      addressCountry: brand.address.country,
    },
    openingHoursSpecification: brand.hours.flatMap((hours, index) =>
      hours
        ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: schemaDays[index], opens: hours.open, closes: hours.close === "24:00" ? "23:59" : displayTime(hours.close) }]
        : [],
    ),
  };
}

/** "+01:00" in winter, "+02:00" in summer: the restaurant's UTC offset on a given date and time. */
export function utcOffset(date: string, time: string, timeZone = brand.timeZone): string {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  const [h = 0, min = 0] = time.split(":").map(Number);
  const name = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(new Date(Date.UTC(y, m - 1, d, h, min)))
    .find((part) => part.type === "timeZoneName")?.value;
  const offset = name?.replace("GMT", "") ?? "";
  return offset === "" ? "+00:00" : offset;
}

/** Lets Google show the nights out as events in search and Maps. */
export function eventsJsonLd(
  locale: Locale,
  items: { titleNb: string; titleEn: string; descriptionNb: string; descriptionEn: string; date: string; startTime: string }[],
) {
  return items.map((item) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: locale === "nb" ? item.titleNb : item.titleEn,
    ...((locale === "nb" ? item.descriptionNb : item.descriptionEn) ? { description: locale === "nb" ? item.descriptionNb : item.descriptionEn } : {}),
    startDate: `${item.date}T${item.startTime}:00${utcOffset(item.date, item.startTime)}`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: brand.fullName,
      address: {
        "@type": "PostalAddress",
        streetAddress: brand.address.street,
        postalCode: brand.address.postalCode,
        addressLocality: brand.address.city,
        addressCountry: brand.address.country,
      },
    },
    organizer: { "@type": "Organization", name: brand.fullName, url: `${siteUrl()}${routes.home[locale]}` },
  }));
}

/** Escapes "<" so that content can't close the surrounding script tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
