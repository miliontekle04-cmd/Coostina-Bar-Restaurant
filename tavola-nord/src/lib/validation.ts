import { z } from "zod";
import { brand } from "@/config/brand";
import { isValidDate } from "./booking";

// Stops Zod from testing for eval on load, which the site's security policy blocks.
z.config({ jitless: true });

/**
 * Error messages are short codes. The dictionaries turn them into text,
 * so the browser and the API can share one set of rules in two languages.
 */
export type ErrorCode =
  | "required"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "guests"
  | "tooLong"
  | "orgNumber"
  | "allocation"
  | "companyName";

const required = (max: number) =>
  z.string({ error: "required" }).trim().min(1, "required").max(max, "tooLong");

const email = z.string({ error: "required" }).trim().min(1, "required").max(200, "tooLong").pipe(z.email("email"));

const phone = z
  .string({ error: "required" })
  .trim()
  .min(1, "required")
  .regex(/^\+?[0-9 ()-]{8,20}$/, "phone");

const dateField = z.string({ error: "required" }).min(1, "required").refine(isValidDate, "date");
const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time");
const notes = z.string().trim().max(1000, "tooLong").default("");
const locale = z.enum(["nb", "en"]).default("nb");
/** Hidden field that people never see and bots tend to fill in. */
const honeypot = z.string().max(200).optional();

export const availabilityQuerySchema = z.object({
  date: dateField,
  guests: z.coerce.number().int().min(1).max(brand.booking.maxParty),
});

export const reservationSchema = z.object({
  date: dateField,
  time: timeField,
  guests: z.number({ error: "guests" }).int("guests").min(1, "guests").max(brand.booking.maxParty, "guests"),
  name: required(120),
  email,
  phone,
  notes,
  locale,
  website: honeypot,
});

export const cancelSchema = z.object({ token: z.string().min(20).max(100) });

export const enquirySchema = z
  .object({
    guests: z
      .number({ error: "guests" })
      .int("guests")
      .min(brand.events.minGuests, "guests")
      .max(brand.events.maxGuests, "guests"),
    date: dateField,
    time: z.union([timeField, z.literal("")]).default(""),
    allocations: z
      .array(z.object({ menuId: z.number().int().positive(), guests: z.number().int().min(0) }))
      .max(20)
      .default([]),
    name: required(120),
    email,
    phone,
    companyInvoice: z.boolean().default(false),
    companyName: z.string().trim().max(200, "tooLong").default(""),
    orgNumber: z.string().trim().max(20, "tooLong").default(""),
    notes,
    locale,
    website: honeypot,
  })
  .superRefine((value, ctx) => {
    const allocated = value.allocations.reduce((sum, a) => sum + a.guests, 0);
    if (allocated > value.guests) ctx.addIssue({ code: "custom", path: ["allocations"], message: "allocation" });
    if (value.companyInvoice) {
      if (!value.companyName) ctx.addIssue({ code: "custom", path: ["companyName"], message: "companyName" });
      if (!/^\d{3} ?\d{3} ?\d{3}$/.test(value.orgNumber))
        ctx.addIssue({ code: "custom", path: ["orgNumber"], message: "orgNumber" });
    }
  });

export type ReservationInput = z.infer<typeof reservationSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;

/** Flattens Zod issues into `{ field: code }`, keeping the first problem for each field. */
export function fieldErrors(error: z.ZodError): Record<string, ErrorCode> {
  const fields: Record<string, ErrorCode> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fields[key] ??= issue.message as ErrorCode;
  }
  return fields;
}
