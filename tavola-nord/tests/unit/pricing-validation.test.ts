import { describe, expect, it } from "vitest";
import { formatNok, summarizeEnquiry, trimAllocations } from "@/lib/pricing";
import { enquirySchema, fieldErrors, reservationSchema } from "@/lib/validation";

const menus = [
  { id: 1, priceNok: 600 },
  { id: 2, priceNok: 800 },
];

describe("summarizeEnquiry", () => {
  it("adds up allocated guests and leaves the rest undecided", () => {
    const summary = summarizeEnquiry(10, [{ menuId: 1, guests: 3 }, { menuId: 2, guests: 1 }], menus);
    expect(summary).toEqual({ allocated: 4, undecided: 6, totalNok: 2600, averageNok: 650, invalid: false });
  });

  it("has no average before anyone has a menu", () => {
    expect(summarizeEnquiry(10, [], menus).averageNok).toBeNull();
  });

  it("flags more guests than the party", () => {
    expect(summarizeEnquiry(10, [{ menuId: 1, guests: 11 }], menus).invalid).toBe(true);
  });

  it("flags a menu that no longer exists", () => {
    expect(summarizeEnquiry(10, [{ menuId: 99, guests: 2 }], menus).invalid).toBe(true);
  });

  it("ignores a zero count for a missing menu", () => {
    expect(summarizeEnquiry(10, [{ menuId: 99, guests: 0 }], menus).invalid).toBe(false);
  });
});

describe("trimAllocations", () => {
  it("removes guests from the last menus first", () => {
    const trimmed = trimAllocations(10, [{ menuId: 1, guests: 8 }, { menuId: 2, guests: 6 }]);
    expect(trimmed).toEqual([{ menuId: 1, guests: 8 }, { menuId: 2, guests: 2 }]);
  });

  it("leaves allocations alone when they still fit", () => {
    const input = [{ menuId: 1, guests: 4 }];
    expect(trimAllocations(10, input)).toBe(input);
  });
});

describe("formatNok", () => {
  it("formats in both languages", () => {
    expect(formatNok(1200, "en")).toBe("1,200 kr");
    expect(formatNok(1200, "nb").replace(/\s/g, " ")).toBe("1 200 kr");
  });
});

describe("validation", () => {
  const reservation = {
    date: "2026-12-01",
    time: "18:00",
    guests: 2,
    name: "Kari Nordmann",
    email: "kari@example.com",
    phone: "+47 900 00 000",
  };

  it("accepts a valid reservation", () => {
    expect(reservationSchema.safeParse(reservation).success).toBe(true);
  });

  it("reports one code per bad field", () => {
    const result = reservationSchema.safeParse({ ...reservation, name: " ", email: "nope", phone: "12", guests: 11 });
    if (result.success) throw new Error("expected failure");
    expect(fieldErrors(result.error)).toEqual({ name: "required", email: "email", phone: "phone", guests: "guests" });
  });

  const enquiry = {
    guests: 20,
    date: "2026-12-01",
    name: "Kari",
    email: "kari@example.com",
    phone: "90000000",
  };

  it("needs a company name and valid org number for invoicing", () => {
    const result = enquirySchema.safeParse({ ...enquiry, companyInvoice: true, orgNumber: "123" });
    if (result.success) throw new Error("expected failure");
    expect(fieldErrors(result.error)).toEqual({ companyName: "companyName", orgNumber: "orgNumber" });
    expect(enquirySchema.safeParse({ ...enquiry, companyInvoice: true, companyName: "AS", orgNumber: "123 456 789" }).success).toBe(true);
  });

  it("refuses more allocated guests than the party", () => {
    const result = enquirySchema.safeParse({ ...enquiry, allocations: [{ menuId: 1, guests: 21 }] });
    if (result.success) throw new Error("expected failure");
    expect(fieldErrors(result.error).allocations).toBe("allocation");
  });

  it("refuses parties outside the range", () => {
    expect(enquirySchema.safeParse({ ...enquiry, guests: 9 }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...enquiry, guests: 121 }).success).toBe(false);
  });
});
