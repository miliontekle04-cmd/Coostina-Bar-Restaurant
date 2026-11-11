import { brand, displayTime } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import { addDays, restaurantNow, weekdayOf } from "./booking";
import { getAvailableMenu, getUpcomingEvents } from "./queries";
import { siteUrl } from "./seo";

/**
 * Answers common questions from the website's own facts, without an AI model.
 * Used when ANTHROPIC_API_KEY is missing, or when the AI call fails, so the chat always replies.
 */

type Topic = "hours" | "booking" | "events" | "stage" | "drinks" | "menu" | "address" | "contact" | "reviews" | "greeting";

const KEYWORDS: [Topic, RegExp][] = [
  ["reviews", /anmeld|review|rating|stjern|star|google/],
  ["drinks", /drikk|drink|alkohol|alcohol|øl\b|beer|vin\b|wine|cocktail|juice|smoothie|brus|soda|sorrel|ginger/],
  ["events", /julebord|selskap|bursdag|birthday|party|event|firma|company|gruppe|group|meny for|set menu/],
  ["stage", /karaoke|open ?mic|stand ?-?up|komik|comed|scene|stage|quiz|musikk|music|fotball|football|kamp|match|sport/],
  ["booking", /book|bestill|reserv|(^|\s)bord|table|plass/],
  ["hours", /åpen|åpent|åpning|stenger|stengt|open|hour|close|tid\b|time|når|when|i dag|today|kveld|tonight/],
  ["address", /adresse|address|hvor|where|ligger|location|kart|map|veibeskriv|direction|parker|park/],
  ["contact", /telefon|phone|ring|call|kontakt|contact|epost|e-post|email|whatsapp|facebook|instagram/],
  ["menu", /meny|menu|mat\b|food|spise|eat|rett|dish|pris|price|kost|cost|vegetar|vegan|gluten|allerg|chicken|kylling|jerk|fisk|fish|dessert|barn|kid/],
  ["greeting", /^(hei|hallo|heisann|hi|hello|hey|god dag|good)\b/],
];

const norm = (s: string) => s.toLowerCase().normalize("NFKC");

export async function answerWithoutAi(locale: Locale, question: string): Promise<string> {
  const nb = locale === "nb";
  const q = norm(question);
  const base = siteUrl().replace(/\/$/, "");
  const page = (key: keyof typeof routes) => `${base}${routes[key][locale]}`;
  const t = getDictionary(locale);
  const phone = brand.phone.display;
  const callUs = nb ? `Ring oss gjerne på **${phone}**.` : `Feel free to call us on **${phone}**.`;

  // A dish named in the question gets its own answer.
  const menu = await getAvailableMenu().catch(() => []);
  const dish = menu.find((item) => item.name.length > 3 && q.includes(norm(item.name)));
  if (dish) {
    const description = nb ? dish.descriptionNb : dish.descriptionEn;
    const tags = [dish.vegetarian ? (nb ? "vegetar" : "vegetarian") : "", dish.glutenFree ? (nb ? "glutenfri" : "gluten-free") : "", dish.allergens.length ? `${nb ? "allergener" : "allergens"}: ${dish.allergens.join(", ")}` : ""].filter(Boolean);
    return `**${dish.name}** – ${dish.priceNok} kr.${description ? ` ${description}` : ""}${tags.length ? ` (${tags.join("; ")})` : ""}\n\n${nb ? "Hele menyen" : "Full menu"}: ${page("menu")}`;
  }

  const topics = KEYWORDS.filter(([, re]) => re.test(q)).map(([topic]) => topic);
  const parts: string[] = [];

  for (const topic of topics.slice(0, 2)) {
    switch (topic) {
      case "hours": {
        const h = brand.hours[weekdayOf(restaurantNow().date)];
        const allSame = brand.hours.every((d) => d && h && d.open === h.open && d.close === h.close);
        parts.push(
          h
            ? nb
              ? `Vi har åpent **${allSame ? "alle dager" : "i dag"} ${h.open}–${displayTime(h.close)}**. Kjøkkenet tar siste bordbestilling kl. ${brand.booking.lastSeatingTime}.`
              : `We're open **${allSame ? "every day" : "today"} ${h.open}–${displayTime(h.close)}**. Last table booking is at ${brand.booking.lastSeatingTime}.`
            : `${nb ? "Vi har stengt i dag." : "We're closed today."} ${callUs}`,
        );
        break;
      }
      case "booking":
        parts.push(
          nb
            ? `Du kan bestille bord for 1–${brand.booking.maxParty} personer her: ${page("book")}\nFor større grupper og julebord: ${page("events")}`
            : `You can book a table for 1–${brand.booking.maxParty} guests here: ${page("book")}\nFor larger groups and Christmas parties: ${page("events")}`,
        );
        break;
      case "events":
        parts.push(
          nb
            ? `Vi tar imot selskap og julebord for ${brand.events.minGuests}–${brand.events.maxGuests} gjester, med karibiske festmenyer. Send forespørsel her: ${page("events")} – eller ring/send melding til **${brand.eventsPhone.display}**.`
            : `We host parties and Christmas dinners for ${brand.events.minGuests}–${brand.events.maxGuests} guests, with Caribbean party menus. Send a request here: ${page("events")} – or call/text **${brand.eventsPhone.display}**.`,
        );
        break;
      case "stage": {
        const today = restaurantNow().date;
        const nights = await getUpcomingEvents(today, addDays(today, 30), 4).catch(() => []);
        const list = nights.map((n) => `- ${n.date} (${t.common.days[weekdayOf(n.date)]}) ${n.startTime}: ${nb ? n.titleNb : n.titleEn}`).join("\n");
        parts.push(
          list
            ? `${nb ? "Dette skjer på scenen fremover:" : "Coming up on stage:"}\n${list}`
            : nb
              ? `Vi har karaoke, open mic, stand-up og fotball på storskjerm. Følg Facebook-siden vår for datoer, eller ${callUs.toLowerCase()}`
              : `We have karaoke, open mic, stand-up and football on the big screen. Follow our Facebook page for dates, or ${callUs.toLowerCase()}`,
        );
        break;
      }
      case "drinks": {
        const drinks = menu.filter((item) => /drikke|drink|alkoholfri/i.test(item.category)).slice(0, 6);
        const list = drinks.map((d) => `- ${d.name}, ${d.priceNok} kr`).join("\n");
        parts.push(
          `${nb ? "Vi anbefaler våre alkoholfrie drikker fra øyene:" : "We recommend our alcohol-free island drinks:"}${list ? `\n${list}` : ""}\n${page("menu")}`,
        );
        break;
      }
      case "menu": {
        const diet = /vegetar|vegan/.test(q) ? menu.filter((m) => m.vegetarian) : /gluten/.test(q) ? menu.filter((m) => m.glutenFree) : menu.filter((m) => m.featured);
        const list = (diet.length ? diet : menu).slice(0, 5).map((d) => `- **${d.name}**, ${d.priceNok} kr`).join("\n");
        parts.push(
          `${nb ? "Vi serverer karibisk street food. Noen favoritter:" : "We serve Caribbean street food. A few favourites:"}${list ? `\n${list}` : ""}\n${nb ? "Hele menyen med allergenfilter" : "Full menu with allergen filter"}: ${page("menu")}`,
        );
        break;
      }
      case "address":
        parts.push(
          `${nb ? "Du finner oss i" : "You'll find us at"} **${brand.address.street}, ${brand.address.postalCode} ${brand.address.city}** (${brand.address.area}).${brand.mapsUrl ? `\n${nb ? "Kart" : "Map"}: ${brand.mapsUrl}` : ""}`,
        );
        break;
      case "contact": {
        const socials = brand.socials.filter((s) => s.href).map((s) => `- ${s.label}: ${s.href}`).join("\n");
        parts.push(`${nb ? "Telefon" : "Phone"}: **${phone}**${socials ? `\n${socials}` : ""}`);
        break;
      }
      case "reviews":
        parts.push(
          brand.googleReviewsUrl
            ? `${nb ? "Se hva gjestene sier om oss på Google" : "See what guests say about us on Google"}: ${brand.googleReviewsUrl}`
            : callUs,
        );
        break;
      case "greeting":
        break;
    }
  }

  if (parts.length) return parts.join("\n\n");

  return nb
    ? `Hei og velkommen til ${brand.fullName}! Jeg kan svare på spørsmål om **åpningstider, menyen, bordbestilling, julebord/selskap og karaoke/open mic**. Hva lurer du på? Du kan også ringe oss på **${phone}**.`
    : `Hi and welcome to ${brand.fullName}! I can help with **opening hours, the menu, table bookings, parties and karaoke/open mic nights**. What would you like to know? You can also call us on **${phone}**.`;
}
