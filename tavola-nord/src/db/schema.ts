import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const menuItems = pgTable(
  "menu_items",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull(),
    name: text("name").notNull(),
    descriptionNb: text("description_nb").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    /** Whole kroner. */
    priceNok: integer("price_nok").notNull(),
    allergens: text("allergens").array().notNull().default(sql`'{}'::text[]`),
    vegetarian: boolean("vegetarian").notNull().default(false),
    glutenFree: boolean("gluten_free").notNull().default(false),
    /** Shown on the home page. */
    featured: boolean("featured").notNull().default(false),
    available: boolean("available").notNull().default(true),
    art: text("art").notNull().default("antipasti"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("menu_items_category_idx").on(t.category, t.sort)],
);

export const eventMenus = pgTable("event_menus", {
  id: serial("id").primaryKey(),
  nameNb: text("name_nb").notNull(),
  nameEn: text("name_en").notNull(),
  priceNok: integer("price_nok").notNull(),
  starter: text("starter").notNull(),
  main: text("main").notNull(),
  dessert: text("dessert").notNull(),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    /** SHA-256 of the token in the guest's manage link. The token itself is never stored. */
    manageTokenHash: text("manage_token_hash").notNull().unique(),
    date: date("date", { mode: "string" }).notNull(),
    time: text("time").notNull(),
    guests: integer("guests").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes").notNull().default(""),
    locale: text("locale").notNull().default("nb"),
    /** confirmed | cancelled | completed | no_show */
    status: text("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reservations_date_idx").on(t.date, t.time)],
);

export type Allocation = { menuId: number; name: string; guests: number; priceNok: number };

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    guests: integer("guests").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    time: text("time"),
    /** A snapshot, so later price changes don't rewrite old enquiries. */
    allocations: jsonb("allocations").$type<Allocation[]>().notNull().default([]),
    estimatedTotalNok: integer("estimated_total_nok").notNull().default(0),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    companyInvoice: boolean("company_invoice").notNull().default(false),
    companyName: text("company_name").notNull().default(""),
    orgNumber: text("org_number").notNull().default(""),
    notes: text("notes").notNull().default(""),
    locale: text("locale").notNull().default("nb"),
    /** new | in_progress | confirmed | declined */
    status: text("status").notNull().default("new"),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("enquiries_status_idx").on(t.status, t.createdAt)],
);

export const eventKinds = ["karaoke", "live_music", "open_mic", "sport", "quiz", "other"] as const;
export type EventKind = (typeof eventKinds)[number];

/** Nights out shown in "What's on": karaoke, live music, matches and the like. */
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").$type<EventKind>().notNull().default("other"),
    titleNb: text("title_nb").notNull(),
    titleEn: text("title_en").notNull(),
    descriptionNb: text("description_nb").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    date: date("date", { mode: "string" }).notNull(),
    /** HH:MM on the restaurant's clock. */
    startTime: text("start_time").notNull(),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_date_idx").on(t.date, t.startTime)],
);

export const closedDates = pgTable("closed_dates", {
  date: date("date", { mode: "string" }).primaryKey(),
  reason: text("reason").notNull().default(""),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  /** SHA-256 of the cookie value. */
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type EventMenu = typeof eventMenus.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
