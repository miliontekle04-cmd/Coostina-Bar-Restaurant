# Coostina Bar & Restaurant

The website for Coostina Bar & Restaurant at Trondheimsveien 4A, Oslo: a public site in Norwegian and English, table booking with live availability, a group-event planner, a "What's on" calendar, an AI chat host and an admin panel.

The menu, prices and opening hours are placeholders until the restaurant confirms them. See `docs/platform-blueprint.md` for the plan.

## Run it locally

You need Node 20.9 or newer. Nothing else: the database is embedded.

```bash
npm install
cp .env.example .env.local
npm run db:setup      # creates the tables and sample menu, and prints an admin password once
npm run dev
```

- Site: http://localhost:3000 (English at http://localhost:3000/en)
- Admin: http://localhost:3000/admin/login, with `admin@example.com` and the printed password

To choose the password yourself, set `ADMIN_PASSWORD` (12+ characters) in your shell before running `db:setup`. The scripts don't read `.env.local`, so export variables or pass them inline.

Stop the dev server before running `db:setup` again. The embedded database only allows one process at a time.

## Turn the demo into a real restaurant

1. `src/config/brand.ts`: name, address, phones, email, opening hours, booking capacity. Set `isDemo: false` to remove the footer notice.
2. `scripts/seed-data.ts`, or the admin panel: the menu and event menus.
3. `src/i18n/dictionaries.ts`: page text, the FAQ and the privacy policy. Have the privacy policy checked before launch.
4. `src/components/art/PlateArt.tsx`: the illustrations. Replace them with real photos if you have them.
5. Reviews: add real ones to `brand.reviews`. The section stays hidden while the list is empty.

## Deploy

Any Node host works. For Vercel with a hosted Postgres (Neon, Supabase and others):

1. Create a Postgres database in an EU region, and copy its connection string.
2. Create the tables and first admin from your machine:
   ```bash
   DATABASE_URL="postgres://..." ADMIN_EMAIL="you@your-domain.no" ADMIN_PASSWORD="a-long-password" npm run db:setup
   ```
3. Import the repository in Vercel and set the environment variables below.
4. After any schema change, run `DATABASE_URL="postgres://..." npm run db:migrate` before deploying.

| Variable | Required in production | What it does |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public address, such as `https://your-domain.no`. Used for canonical links, the sitemap and email links, and it turns on Secure cookies when it starts with https. Set it before building |
| `APP_SECRET` | Yes | Random salt for hashing IP addresses. Generate with `openssl rand -hex 32` |
| `RESEND_API_KEY`, `EMAIL_FROM` | For email | Sends confirmations through Resend. Without them, the site logs that an email was skipped and bookings still work |
| `EMAIL_TO_RESTAURANT` | For email | Inbox that gets new bookings and enquiries |

On a server of your own: `npm ci && npm run build && npm start`, behind a reverse proxy that **overwrites** `X-Forwarded-For`. The rate limits trust that header. Vercel already does this.

## Tests

```bash
npm test              # unit tests: availability, pricing, validation
npm run build && npm run test:e2e   # browser tests against the production build
```

The browser tests use a throwaway database in `.data/e2e`. Set `DATABASE_URL` to run them on Postgres instead, using an empty database that you don't mind losing. If Playwright can't find a browser, run `npx playwright install chromium`.

## How it's organised

```
src/
  config/brand.ts       everything specific to the business
  proxy.ts              maps Norwegian addresses to internal routes
  i18n/                 addresses and all page text, in both languages
  lib/booking.ts        availability and capacity rules (no database, easy to test)
  lib/pricing.ts        event prices, shared by the browser and the server
  lib/validation.ts     form rules, shared by the browser and the server
  lib/auth.ts           admin sessions
  db/                   schema and connection
  app/[locale]/         public pages
  app/admin/            admin panel, with server actions in actions.ts
  app/api/              availability, reservations, enquiries, health check
  components/           reusable UI
tests/                  unit and browser tests
drizzle/                database migrations
```

### Decisions worth knowing

- **No double booking.** Checking capacity and saving happen in one transaction under a per-date lock.
- **Prices come from the server.** The browser only says who wants which menu.
- **Secrets are hashed.** Booking links, admin session tokens and IP addresses are stored only as hashes, and passwords use scrypt.
- **No visitor cookies or trackers.** Only staff who log in get a cookie, and fonts are self-hosted.
- **Capacity is one number.** Availability counts seats (`brand.booking.capacity`), not individual tables.
