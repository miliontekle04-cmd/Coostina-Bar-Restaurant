import { describe, expect, it } from "vitest";
import {
  addDays,
  canCancel,
  computeAvailability,
  fits,
  isOpenNow,
  isValidDate,
  peakCovers,
  restaurantNow,
  slotTimes,
  weekdayOf,
} from "@/lib/booking";
import { brand } from "@/config/brand";

const rules = { ...brand.booking, capacity: 10 };
const hours = Array.from({ length: 7 }, () => ({ open: "12:00", close: "22:00" }));
const now = { date: "2026-11-03", minutes: 9 * 60 };

describe("dates", () => {
  it("finds the weekday without depending on the server's time zone", () => {
    expect(weekdayOf("2026-11-02")).toBe(1);
    expect(weekdayOf("2026-11-08")).toBe(0);
  });

  it("adds days across a month boundary", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });

  it("rejects dates that don't exist", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-2-3")).toBe(false);
    expect(isValidDate("2026-02-28")).toBe(true);
  });

  it("reads the clock in Oslo, summer and winter", () => {
    expect(restaurantNow(new Date("2026-01-15T23:30:00Z"))).toEqual({ date: "2026-01-16", minutes: 30 });
    expect(restaurantNow(new Date("2026-07-15T21:30:00Z"))).toEqual({ date: "2026-07-15", minutes: 23 * 60 + 30 });
  });
});

describe("slots", () => {
  it("stops the last sitting before closing time", () => {
    const times = slotTimes({ open: "12:00", close: "22:00" }, rules);
    expect(times[0]).toBe("12:00");
    expect(times.at(-1)).toBe("20:30");
  });

  it("has no slots on a closed day", () => {
    expect(slotTimes(null, rules)).toEqual([]);
  });
});

describe("capacity", () => {
  it("counts bookings that overlap the sitting", () => {
    expect(peakCovers(18 * 60, [{ time: "17:30", guests: 4 }, { time: "19:00", guests: 3 }], rules)).toBe(7);
  });

  it("ignores a booking that ends as the sitting starts", () => {
    expect(peakCovers(18 * 60, [{ time: "16:00", guests: 8 }], rules)).toBe(0);
  });

  it("uses the peak, not the sum, when bookings don't overlap each other", () => {
    expect(peakCovers(18 * 60, [{ time: "16:30", guests: 6 }, { time: "18:30", guests: 6 }], rules)).toBe(6);
  });

  it("allows exactly full and refuses one over", () => {
    const bookings = [{ time: "18:00", guests: 8 }];
    expect(fits("18:00", 2, bookings, rules)).toBe(true);
    expect(fits("18:00", 3, bookings, rules)).toBe(false);
  });
});

describe("availability", () => {
  const base = { guests: 2, bookings: [], isClosedDate: false, now, hours, rules };

  it("refuses past dates and dates too far ahead", () => {
    expect(computeAvailability({ ...base, date: "2026-11-02" }).status).toBe("past");
    expect(computeAvailability({ ...base, date: addDays(now.date, 91) }).status).toBe("too_far");
  });

  it("treats a blocked date and a closed weekday as closed", () => {
    expect(computeAvailability({ ...base, date: "2026-11-04", isClosedDate: true }).status).toBe("closed");
    const closedTuesday = hours.map((h, i) => (i === 2 ? null : h));
    expect(computeAvailability({ ...base, date: "2026-11-03", hours: closedTuesday }).status).toBe("closed");
  });

  it("hides times that are too soon today", () => {
    const result = computeAvailability({ ...base, date: now.date, now: { date: now.date, minutes: 13 * 60 } });
    if (result.status !== "ok") throw new Error("expected slots");
    expect(result.slots[0]?.time).toBe("14:00");
  });

  it("is closed when today has no sittings left", () => {
    expect(computeAvailability({ ...base, date: now.date, now: { date: now.date, minutes: 21 * 60 } }).status).toBe("closed");
  });

  it("marks full sittings as unavailable", () => {
    const result = computeAvailability({ ...base, date: "2026-11-04", bookings: [{ time: "18:00", guests: 10 }] });
    if (result.status !== "ok") throw new Error("expected slots");
    expect(result.slots.find((s) => s.time === "18:00")?.available).toBe(false);
    expect(result.slots.find((s) => s.time === "20:00")?.available).toBe(true);
    // 16:30 runs until 18:30, so it overlaps the 18:00 booking.
    expect(result.slots.find((s) => s.time === "16:30")?.available).toBe(false);
  });
});

describe("cancelling and opening hours", () => {
  it("allows cancelling until the sitting starts", () => {
    expect(canCancel("2026-11-03", "18:00", { date: "2026-11-03", minutes: 17 * 60 })).toBe(true);
    expect(canCancel("2026-11-03", "18:00", { date: "2026-11-03", minutes: 18 * 60 })).toBe(false);
    expect(canCancel("2026-11-02", "18:00", now)).toBe(false);
    expect(canCancel("2026-11-05", "18:00", now)).toBe(true);
  });

  it("knows when the restaurant is open", () => {
    const closedMonday = hours.map((h, i) => (i === 1 ? null : h));
    expect(isOpenNow({ date: "2026-11-03", minutes: 13 * 60 }, closedMonday)).toBe(true);
    expect(isOpenNow({ date: "2026-11-03", minutes: 22 * 60 }, closedMonday)).toBe(false);
    expect(isOpenNow({ date: "2026-11-02", minutes: 13 * 60 }, closedMonday)).toBe(false);
  });

  it("treats 24:00 as open until midnight", () => {
    const lateNights = hours.map(() => ({ open: "11:00", close: "24:00" }));
    expect(isOpenNow({ date: "2026-11-07", minutes: 23 * 60 + 59 }, lateNights)).toBe(true);
    expect(isOpenNow({ date: "2026-11-07", minutes: 10 * 60 }, lateNights)).toBe(false);
  });

  it("stays open past midnight when closing is after 24:00", () => {
    const toThree = hours.map(() => ({ open: "13:00", close: "27:00" }));
    expect(isOpenNow({ date: "2026-11-07", minutes: 2 * 60 + 30 }, toThree)).toBe(true);
    expect(isOpenNow({ date: "2026-11-07", minutes: 3 * 60 }, toThree)).toBe(false);
    expect(isOpenNow({ date: "2026-11-07", minutes: 12 * 60 }, toThree)).toBe(false);
    expect(isOpenNow({ date: "2026-11-07", minutes: 23 * 60 }, toThree)).toBe(true);
  });

  it("stops online bookings at the last seating time", () => {
    const times = slotTimes({ open: "13:00", close: "27:00" }, { ...rules, lastSeatingTime: "23:00" });
    expect(times.at(0)).toBe("13:00");
    expect(times.at(-1)).toBe("23:00");
  });
});
