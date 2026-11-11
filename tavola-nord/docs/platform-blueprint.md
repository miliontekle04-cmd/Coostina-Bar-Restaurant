# Coostina platform blueprint

7 November 2026

The Coostina site already covers the core jobs: menu, table booking, event planning, an admin panel and an AI host. What holds it back is **trust** (key facts are still placeholders), **discovery** (nobody can see what's on tonight) and **return visits** (nothing brings a guest back). Fix those in three phases over about 12 weeks.

---

## 1. Where it stands

The technical base is strong. The weak points are the content and what happens after the first visit.

| Area | Today | Status |
| --- | --- | --- |
| Languages | Norwegian at the root, English under /en, every page translated | Done |
| Menu | Categories, prices, allergen filter, vegetarian and gluten-free flags, editable in admin | Placeholder dishes and prices |
| Table booking | Live availability, instant confirmation, cancel link, 1–10 guests, 40 online seats | Works, but email isn't set up, so no confirmations go out |
| Events | Planner for 10–60 guests with set menus and an instant price estimate | Capacity and menus are guesses |
| Admin | Bookings, enquiries, menu, closed dates, one shared login | Works |
| AI host | Chat in the corner, answers from site data, searches the web for socials and reviews | Needs an Anthropic API key |
| SEO | Restaurant structured data, sitemap, share image, fast pages | Done |
| Privacy | No cookies, no tracking, IP addresses only stored as hashes | Done, but nothing is measured |
| Visuals | 3 real photos, promo video, illustrated dishes | No food photos |
| Hosting | Runs locally, code on GitHub | Not live: no domain, no host |

---

## 2. Blind spots and gaps

Ranked by what does the most harm if it stays as it is.

| # | Gap | Why it matters | Severity | Fix |
| --- | --- | --- | --- | --- |
| 1 | Menu, prices and **allergens** are placeholders | A guest with an allergy could trust wrong data. Norwegian food law requires correct allergen info. | Critical | Get the real menu from the kitchen, enter it in admin, then set `isDemo: false` |
| 2 | Opening hours conflict between sources (11–23/24 vs 14:30–22/23) | Guests can book a table for an hour when the place is shut | Critical | Confirm with the owners, update `brand.ts` |
| 3 | Site isn't live; README still says "Tavola Nord" | Nobody can find it | Critical | Domain, Vercel + hosted Postgres in the EU, rename leftovers |
| 4 | No email: confirmations and the restaurant inbox are off | Guests get no proof of their booking. Staff only see bookings by opening the admin panel. | Critical | Resend with the domain, `EMAIL_TO_RESTAURANT`, plus an SMS alert to the duty phone |
| 5 | **Alcohol advertising ban** (alkoholloven § 9-2) not checked | Cocktail names and bar-promotion copy on the home page may count as advertising. Drink offers and "happy hour" pushes are risky. | High | Have the bar copy checked. Keep drinks to plain factual listings. Never use drinks as engagement rewards. |
| 6 | Nights out (karaoke, open mic, live music, matches) have no schedule | It's the venue's biggest difference from other pizza places, and the site says "call us" | High | A "What's on" calendar managed in admin |
| 7 | No social links, no Google profile, no reviews | No social proof. The chat has to search the web every time. | High | Fill `brand.socials`, claim Google Business Profile, show real reviews |
| 8 | Nothing is measured | You can't tell which page or channel brings bookings | High | Cookieless analytics (Plausible or self-hosted Umami) keeps the no-cookie promise |
| 9 | No reminders before a booking | No-shows cost tables on busy nights | Medium | Email or SMS 24 hours before, with a one-tap cancel |
| 10 | One seat pool of 40, with no areas | You can't hold the bar for a match or keep walk-in tables free | Medium | Areas (dining room, bar) and blocked slots in admin |
| 11 | One shared admin login, no export | No accountability. Hard to hand over the list for a busy night. | Medium | Staff accounts, roles, CSV export and a printable list for the day |
| 12 | The chat can't hand over to a person and doesn't learn | Questions it can't answer just end with "call us" | Medium | Log anonymous topics of unanswered questions. Add a "send to staff" button. |
| 13 | Takeaway, delivery and accessibility are unknown | Common questions with no answer | Medium | Ask the owners. Add Wolt/Foodora links and step-free access info if they apply. |
| 14 | No way to buy or gift | Revenue left behind, especially in December | Medium | Digital gift cards through Vipps |
| 15 | Fully booked means a dead end | Lost demand you never hear about | Low | Waitlist that emails when a table frees up |

---

## 3. Features and integrations to add

| Feature | Need it serves | Integration | Phase |
| --- | --- | --- | --- |
| Confirmed menu, hours and allergens | Trust, legal safety | Admin panel | 1 |
| Booking emails + staff SMS alert | Proof for guests, staff know at once | Resend, an SMS provider (e.g. Sveve, Twilio) | 1 |
| Cookieless analytics with a booking funnel | Know what works | Plausible or Umami | 1 |
| Google Business Profile + review link | Get found on Maps, social proof | Google Business Profile | 1 |
| AI host switched on | Answers 24/7 in two languages | Anthropic API (built) | 1 |
| "What's on" calendar (karaoke, open mic, live music, quiz) | "What's happening tonight?" | Admin + schema.org Event, so Google shows events | 2 |
| Match schedule ("Is my match on?") with "book for this match" | Sport fans plan ahead | Entered by hand in admin | 2 |
| "Tonight" strip on the home page | Curiosity on first sight | Reads the calendar + live availability | 2 |
| Booking reminders + add to calendar (.ics) | Fewer no-shows | Resend | 2 |
| Coostina club sign-up (email or SMS, explicit consent) | A reason to come back | Resend audiences or Mailchimp | 2 |
| Real food photography | Appetite sells. The illustrations don't. | Photo shoot, admin upload per dish | 2 |
| Staff accounts, CSV export, printable list for the day | Running service smoothly | Admin | 2 |
| Wolt / Foodora links (if offered) | Eat at home | Links only | 2 |
| Digital gift cards | Gifting, December revenue | Vipps MobilePay or Stripe | 3 |
| Deposits for event bookings | Fewer cancelled parties | Vipps MobilePay | 3 |
| Birthday club (register a birthday, get a dessert) | Loyalty, more birthday bookings | Club + email | 3 |
| Waitlist when full | Capture lost demand | Resend | 3 |
| Seating areas and blocked slots | Match nights, walk-ins | Booking engine | 3 |

---

## 4. Engagement and curiosity

The loop: each visit should seed the next, and each step gives the guest a reason to take the next one.

```
   Discover ──────────► Visit the site ──────────► Book or RSVP
 (Google Maps,          "Tonight: Karaoke 21:00"     (table, match,
  Instagram/TikTok,      "3 tables left at 19:00"     event night)
  a friend's story)                                       │
        ▲                                                 ▼
        │                                     Reminder + add to calendar
   Share / review                                         │
   (photo wall,                                           ▼
    Google review) ◄──── Post-visit email ◄────────── The visit
        │               (thanks, review link,
        ▼                next event, club invite)
   Join the club ──► Weekly "what's on" email ──► back to Visit the site
```

**Mechanisms that spark curiosity**

- **"Tonight at Coostina"**: a live line under the hero saying open now, closing time and tonight's event. It changes every day, so there's a reason to look.
- **Weekly special ("Ukens pizza")**: one rotating dish, revealed every Monday on the site and in the club email. Unpredictable rewards keep people checking.
- **Match calendar**: fans return to check fixtures, and every fixture has a "book for this match" button.
- **Event countdowns**: "Open mic in 2 days, 4 slots left to perform". Shows real numbers only.
- **Behind the scenes**: short stories from the kitchen and the regulars on the About page and socials. A place with a face gets remembered.
- **Photo wall**: after-event photos (with consent) show what guests missed and make them want to come next time.

**Triggers, used honestly**

| Trigger | How Coostina uses it | Guard rail |
| --- | --- | --- |
| Scarcity | "3 tables left at 19:00" from live availability | Real numbers only, never invented |
| Social proof | Real Google reviews, event photos | Only with permission (`brand.reviews`) |
| Commitment | RSVP to an event night, add to calendar | Easy one-tap cancel |
| Reciprocity | A birthday dessert for club members | Food, never alcohol, because of the advertising ban |
| Identity | "Stamgjest" club for neighbourhood regulars | Explicit opt-in, easy to leave |
| Novelty | Weekly special, seasonal menu reveal | Keep the core menu stable |

The AI host also helps here. It greets every visitor, can mention tonight's event once the calendar exists, and suggests booking at the end of an answer.

---

## 5. First-visit UX

A newcomer should grasp four things within five seconds: **what** (Italian pizza, bar, sport and nights out), **where** (Grünerløkka), **is it open now**, and **how to book**. The current hero covers the first two and the last. It misses "open now" and "what's on tonight".

**Home page, top to bottom**

1. **Hero**: name, one-line promise, and a status line: "Åpent nå · til 23:00 · I kveld: Karaoke 21:00". Two buttons: Book a table, See the menu.
2. **Book right here**: "Free tonight: 18:30 · 19:00 · 21:00" chips that open the booking form already filled in. This saves a whole page.
3. **This week**: cards for the next 3 events and matches.
4. **Menu highlights**: real food photos, prices visible, a link to the full menu.
5. **Bar and sport**: the atmosphere, the next fixtures.
6. **Nights and parties**: birthdays, events planner.
7. **Reviews**: hidden until real ones exist.
8. **Visit**: map, hours, phone, how to get there.

**Principles**

- **Phone first.** Most guests check on the way. Keep the dock (Menu, Book, Events) and the chat button within thumb reach. They're already placed so they don't overlap.
- **One main action per screen**: book a table. Everything else is secondary.
- **Real photos over illustrations.** Use the illustrations only as fallbacks.
- **Menu page**: sticky category tabs, the allergen filter kept prominent, dietary icons with a legend.
- **Trust signals near the booking button**: instant confirmation, free cancellation, phone number.
- **Keep the brand**: espresso, cream, wine red and brass, with Playfair headings. Keep contrast at AA or better, and keep running the axe accessibility tests.
- **Bilingual everywhere**, including emails, the chat and error messages.

---

## 6. Roadmap

```
Weeks   1        3 │ 4                 8 │ 9                     12+
        ───────────┼─────────────────────┼─────────────────────────►
Phase 1 LAUNCH-READY
        Real menu, hours, allergens
        Domain + hosting, email + SMS alert
        Analytics, Google profile, chat key
                   ◆ Gate: owners sign off menu, hours, prices
                     Phase 2 DISCOVERY
                     What's-on calendar, match schedule
                     "Tonight" strip, free-times chips
                     Reminders, club sign-up, food photos
                     Staff accounts, export
                                         ◆ Gate: 4 weeks of booking + event data
                                           Phase 3 LOYALTY + REVENUE
                                           Gift cards and deposits (Vipps)
                                           Birthday club, waitlist
                                           Seating areas, blocked slots
```

---

## 7. Success metrics

These targets are proposals for the 90 days after launch. Check them against the first month's data.

| Metric | How it's measured | Target |
| --- | --- | --- |
| Online bookings per week | Admin / database | 40+ |
| Visit-to-booking conversion | Analytics funnel | 3% or more |
| No-show rate | Bookings vs. guests who arrive | Under 5% |
| Event enquiries per month | Admin | 6+ |
| Chat answers that don't end in "call us" | Anonymous topic log | 80% or more |
| Club sign-ups | Email provider | 300 |
| Google rating and review count | Google Business Profile | 4.5+, 50 reviews |
| Returning visitors | Analytics | 25% or more |

---

## 8. Open questions for the owners

- [ ] The real menu, prices and allergens
- [ ] The real opening hours, including holidays
- [ ] Domain name and a public email address
- [ ] Instagram, Facebook and TikTok accounts (or should we create them?)
- [ ] The schedule for karaoke, open mic and live music
- [ ] Which sports and channels are shown
- [ ] Takeaway or delivery: yes or no, and through which service?
- [ ] Is there step-free access, and an accessible toilet?
- [ ] Who handles bookings day to day, and which phone gets the alerts?
- [ ] Budget for SMS, Vipps fees and a food photo shoot
- [ ] Real event capacity (currently guessed at 10–60)
