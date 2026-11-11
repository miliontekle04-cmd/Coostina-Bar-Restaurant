import { brand, displayTime } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import { addDays, restaurantNow, weekdayOf } from "./booking";
import { getActiveEventMenus, getAvailableMenu, getUpcomingEvents } from "./queries";
import { siteUrl } from "./seo";

/**
 * Everything the chat assistant knows about Coostina, built from the same sources as the pages:
 * brand.ts, the dictionaries and the menu in the database. Edit those, and the assistant follows.
 */
export async function buildChatKnowledge(locale: Locale): Promise<string> {
  const t = getDictionary(locale);
  const base = siteUrl().replace(/\/$/, "");
  const today = restaurantNow().date;
  const [menu, eventMenus, nights] = await Promise.all([getAvailableMenu(), getActiveEventMenus(), getUpcomingEvents(today, addDays(today, 30), 30)]);
  const nightsText = nights
    .map((n) => {
      const description = locale === "nb" ? n.descriptionNb : n.descriptionEn;
      return `- ${n.date} (${t.common.days[weekdayOf(n.date)]}) ${n.startTime}: ${locale === "nb" ? n.titleNb : n.titleEn} [${t.home.eventKinds[n.kind]}]${description ? `. ${description}` : ""}`;
    })
    .join("\n");

  const hours = brand.hours
    .map((h, day) => `- ${t.common.days[day]}: ${h ? `${h.open}–${displayTime(h.close)}` : t.common.closed}`)
    .join("\n");

  const byCategory = new Map<string, string[]>();
  for (const item of menu) {
    const description = locale === "nb" ? item.descriptionNb : item.descriptionEn;
    const tags = [
      item.vegetarian ? "vegetarian" : "",
      item.glutenFree ? "gluten-free" : "",
      item.allergens.length ? `allergens: ${item.allergens.join(", ")}` : "",
    ].filter(Boolean);
    const line = `- ${item.name}, ${item.priceNok} kr${description ? `. ${description}` : ""}${tags.length ? ` (${tags.join("; ")})` : ""}`;
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), line]);
  }
  const menuText = [...byCategory].map(([category, lines]) => `### ${category}\n${lines.join("\n")}`).join("\n\n");

  const eventText = eventMenus
    .map((m) => `- ${locale === "nb" ? m.nameNb : m.nameEn}, ${m.priceNok} kr per person: ${m.starter} / ${m.main} / ${m.dessert}`)
    .join("\n");

  const socials = brand.socials.map((s) => `- ${s.label}: ${s.href ?? "not on the website yet"}`).join("\n");
  const page = (key: keyof typeof routes) => `${base}${routes[key][locale]}`;

  return `## Business
- Name: ${brand.fullName} (company: ${brand.legalName}${brand.orgNumber ? `, org. no. ${brand.orgNumber}` : ""})
- Address: ${brand.address.street}, ${brand.address.postalCode} ${brand.address.city} (${brand.address.area})
- Phone: ${brand.phone.display}${brand.email ? `\n- Email: ${brand.email}` : ""}
- Map: ${brand.mapsUrl ?? "none"}
- About: ${t.about.story.join(" ")} ${t.about.room}
- The bar: ${t.home.barBody} ${t.home.barPoints.map((p) => `${p.h}: ${p.p}`).join(" ")}
- Evenings: ${t.home.funBody} ${t.home.funItems.map((p) => `${p.h}: ${p.p}`).join(" ")}

## Opening hours
${hours}
${brand.isDemo ? `Note: ${t.common.demoNotice}` : ""}

## What's on (next 30 days, from the website calendar)
Today is ${today} (${t.common.days[weekdayOf(today)]}).
${nightsText || "Nothing is in the calendar yet. Don't guess dates for karaoke, live music, open mic or matches: suggest calling to hear what's on."}

## Pages on the website
- Home: ${page("home")}
- Menu (prices, allergen filter): ${page("menu")}
- Book a table: ${page("book")}
- Private events and parties: ${page("events")}
- About, FAQ and contact: ${page("about")}
- Privacy: ${page("privacy")}

## Table bookings
Online for 1 to ${brand.booking.maxParty} guests, up to ${brand.booking.maxDaysAhead} days ahead and at least ${brand.booking.minLeadMinutes} minutes before arrival. A table is held for about ${brand.booking.seatingMinutes} minutes. Larger groups use the events page or call.

## Private events
For ${brand.events.minGuests} to ${brand.events.maxGuests} guests, booked at least ${brand.events.minDaysAhead} days ahead through the events page.
${eventText || "No set event menus at the moment."}

## Menu
${menuText || "The menu is not available right now. Point guests to the menu page."}

## FAQ
${t.about.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}

## Social media listed on the website
${socials}`;
}
