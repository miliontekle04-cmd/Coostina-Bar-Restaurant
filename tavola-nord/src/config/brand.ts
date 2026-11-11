/**
 * Everything specific to the business lives here.
 * Sources: Brønnøysund via proff.no (company, address, phone) and norgeguide.com (hours).
 * Opening hours confirmed by the owner (Nov 2026): 13:00 to 03:00 every day.
 * Set `isDemo` to false once the owner has confirmed the party menus and drink prices in seed-data.ts.
 */

export type DayHours = { open: string; close: string } | null;

export type Review = { author: string; source: string; text: string; url?: string };

/** A photo in /public/photos. The home page shows illustrations until photos are added here. */
export type Social = { platform: "instagram" | "facebook" | "tiktok"; label: string; href: string | null };

export type Photo ={ src: string; alt: { nb: string; en: string } };

export const brand = {
  name: "Coostina",
  /** The full name, used in titles and the footer. */
  fullName: "Coostina Bar & Restaurant",
  /** Shows a notice in the footer saying the menu and prices are not confirmed yet. */
  isDemo: true,
  legalName: "Coostina AS",
  orgNumber: "924 325 534" as string | null,
  address: { street: "Trondheimsveien 4A", postalCode: "0560", city: "Oslo", country: "NO", area: "Grünerløkka" },
  phone: { display: "944 40 443", href: "tel:+4794440443" },
  eventsPhone: { display: "944 40 443", href: "tel:+4794440443" },
  /** No public address found. Set it to show email links across the site. */
  email: null as string | null,
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Coostina+Bar+%26+Restaurant,+Trondheimsveien+4A,+0560+Oslo" as string | null,
  /** Opens Coostina's Google profile, where guests read and write reviews. */
  googleReviewsUrl: "https://www.google.com/search?q=Coostina+Bar+%26+Restaurant+Trondheimsveien+4A+Oslo+anmeldelser" as string | null,
  /**
   * Shown as icons in the footer and the contact section. Paste each profile address into href,
   * such as "https://www.instagram.com/coostina". Icons without an address show faded and aren't links.
   */
  socials: [
    { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/coostina_oslo" },
    { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/coostina.bar.og.restaurant" },
    { platform: "tiktok", label: "TikTok", href: null },
  ] as Social[],
  /** Real reviews only, with permission to show them. The section stays hidden while this is empty. */
  reviews: [] as Review[],
  /** Enhanced from the restaurant's own photos. The first one opens the home page slideshow. */
  photos: [
    { src: "/photos/dining-room.jpg", alt: { nb: "Spisesalen med kobberlamper og store vinduer mot Trondheimsveien", en: "The dining room with copper lamps and big windows onto Trondheimsveien" } },
    { src: "/photos/live-sport.jpg", alt: { nb: "Fotballkamp på storskjerm i lokalet", en: "A football match on the big screen" } },
  ] as Photo[],
  /**
   * A short promo shown on the home page. The old film advertised pizza, cocktails, wine and draught beer,
   * which breaks the Norwegian ban on alcohol advertising (alkoholloven § 9-2), so it is switched off.
   * Add a new film without alcohol here, such as { src: "/video/new.mp4", poster: "/video/new.jpg" }.
   */
  promoVideo: null as { src: string; poster: string } | null,
  /**
   * Index 0 is Sunday. null means closed. "24:00" means midnight.
   * A closing time past 24:00 runs into the next morning: "27:00" is 03:00 the night after.
   */
  hours: [
    { open: "13:00", close: "27:00" },
    { open: "13:00", close: "27:00" },
    { open: "13:00", close: "27:00" },
    { open: "13:00", close: "27:00" },
    { open: "13:00", close: "27:00" },
    { open: "13:00", close: "27:00" },
    { open: "13:00", close: "27:00" },
  ] as DayHours[],
  timeZone: "Europe/Oslo",
  booking: {
    slotMinutes: 30,
    /** How long a table stays occupied. */
    seatingMinutes: 120,
    /** Seats available at the same time for online bookings. */
    capacity: 40,
    maxParty: 10,
    maxDaysAhead: 90,
    /** Earliest a same-day booking can be made. */
    minLeadMinutes: 60,
    /** The last sitting starts this long before closing. */
    lastSeatingBeforeClose: 90,
    /** Online bookings stop at this time, even when the doors stay open later. Keeps every booking on its own date. */
    lastSeatingTime: "23:00",
  },
  events: {
    minGuests: 10,
    maxGuests: 60,
    minDaysAhead: 2,
    maxDaysAhead: 365,
    /** Each table in the planner seats this many guests. */
    seatsPerTable: 12,
  },
};

/** "24:00" reads as midnight to guests, and "27:00" as 03:00. */
export function displayTime(time: string): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  if (h < 24) return time;
  return `${String(h - 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
