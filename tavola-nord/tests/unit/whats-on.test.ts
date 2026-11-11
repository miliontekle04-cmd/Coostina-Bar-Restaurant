import { describe, expect, it } from "vitest";
import { bookingIcs } from "@/lib/ics";
import { utcOffset } from "@/lib/seo";
import { dayStatus, spread } from "@/lib/whats-on";

const hours = [
  { open: "11:00", close: "24:00" },
  { open: "11:00", close: "23:00" },
  null,
  { open: "11:00", close: "23:00" },
  { open: "11:00", close: "23:00" },
  { open: "11:00", close: "24:00" },
  { open: "11:00", close: "24:00" },
];

describe("dayStatus", () => {
  it("is open after midnight when yesterday closes at 03:00", () => {
    const toThree = hours.map(() => ({ open: "13:00", close: "27:00" }));
    expect(dayStatus({ date: "2026-11-10", minutes: 90 }, toThree)).toEqual({ state: "open", close: "03:00" });
    expect(dayStatus({ date: "2026-11-10", minutes: 4 * 60 }, toThree)).toEqual({ state: "later", open: "13:00" });
    expect(dayStatus({ date: "2026-11-10", minutes: 20 * 60 }, toThree)).toEqual({ state: "open", close: "03:00" });
  });

  // 2026-11-09 is a Monday, 2026-11-10 a Tuesday.
  it("says when the doors open later today", () => {
    expect(dayStatus({ date: "2026-11-09", minutes: 9 * 60 }, hours)).toEqual({ state: "later", open: "11:00" });
  });
  it("gives the closing time while open, with midnight as 00:00", () => {
    expect(dayStatus({ date: "2026-11-09", minutes: 20 * 60 }, hours)).toEqual({ state: "open", close: "23:00" });
    expect(dayStatus({ date: "2026-11-08", minutes: 20 * 60 }, hours)).toEqual({ state: "open", close: "00:00" });
  });
  it("is closed after hours, on closed weekdays and on closed dates", () => {
    expect(dayStatus({ date: "2026-11-09", minutes: 23 * 60 + 5 }, hours)).toEqual({ state: "closed" });
    expect(dayStatus({ date: "2026-11-10", minutes: 12 * 60 }, hours)).toEqual({ state: "closed" });
    expect(dayStatus({ date: "2026-11-09", minutes: 12 * 60 }, hours, true)).toEqual({ state: "closed" });
  });
});

describe("spread", () => {
  it("keeps short lists whole and spreads long ones from first to last", () => {
    expect(spread(["a", "b"], 4)).toEqual(["a", "b"]);
    expect(spread(["a", "b", "c", "d", "e", "f", "g"], 4)).toEqual(["a", "c", "e", "g"]);
    expect(spread(["a", "b", "c"], 1)).toEqual(["a"]);
  });
});

describe("utcOffset", () => {
  it("follows Oslo's winter and summer time", () => {
    expect(utcOffset("2026-01-15", "20:00")).toBe("+01:00");
    expect(utcOffset("2026-07-15", "20:00")).toBe("+02:00");
  });
});

describe("bookingIcs", () => {
  const ics = bookingIcs({
    uid: "CN-ABC@coostina",
    date: "2026-11-07",
    time: "22:30",
    durationMinutes: 120,
    timeZone: "Europe/Oslo",
    summary: "Coostina, 2 guests",
    location: "Trondheimsveien 4A, 0560 Oslo",
    description: "Ref: CN-ABC\nhttps://example.no/x",
    now: new Date("2026-11-01T10:00:00Z"),
  });
  it("uses the restaurant's clock and rolls the end past midnight", () => {
    expect(ics).toContain("DTSTART;TZID=Europe/Oslo:20261107T223000");
    expect(ics).toContain("DTEND;TZID=Europe/Oslo:20261108T003000");
  });
  it("escapes commas and line breaks, and uses CRLF line endings", () => {
    expect(ics).toContain("LOCATION:Trondheimsveien 4A\\, 0560 Oslo");
    expect(ics).toContain("DESCRIPTION:Ref: CN-ABC\\nhttps://example.no/x");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
