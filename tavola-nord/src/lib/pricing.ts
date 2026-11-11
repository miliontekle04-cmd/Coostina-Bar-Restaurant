export type PricedMenu = { id: number; priceNok: number };
export type AllocationInput = { menuId: number; guests: number };

export type EnquirySummary = {
  allocated: number;
  undecided: number;
  /** The total for guests who have a menu. */
  totalNok: number;
  /** Average for guests who have a menu. Null until someone has one. */
  averageNok: number | null;
  /** True when one or more menus no longer exist, or a count is invalid. */
  invalid: boolean;
};

/** Used by the browser for the live summary and by the server for the price it stores. */
export function summarizeEnquiry(guests: number, allocations: AllocationInput[], menus: PricedMenu[]): EnquirySummary {
  let allocated = 0;
  let totalNok = 0;
  let invalid = false;

  for (const allocation of allocations) {
    if (allocation.guests === 0) continue;
    const menu = menus.find((m) => m.id === allocation.menuId);
    if (!menu || !Number.isInteger(allocation.guests) || allocation.guests < 0) {
      invalid = true;
      continue;
    }
    allocated += allocation.guests;
    totalNok += allocation.guests * menu.priceNok;
  }

  if (allocated > guests) invalid = true;

  return {
    allocated,
    undecided: Math.max(guests - allocated, 0),
    totalNok,
    averageNok: allocated > 0 ? Math.round(totalNok / allocated) : null,
    invalid,
  };
}

/** When the guest count drops, take guests off the most recently listed menus first. */
export function trimAllocations(guests: number, allocations: AllocationInput[]): AllocationInput[] {
  let excess = allocations.reduce((sum, a) => sum + a.guests, 0) - guests;
  if (excess <= 0) return allocations;
  const trimmed = allocations.map((a) => ({ ...a }));
  for (let i = trimmed.length - 1; i >= 0 && excess > 0; i--) {
    const row = trimmed[i]!;
    const take = Math.min(row.guests, excess);
    row.guests -= take;
    excess -= take;
  }
  return trimmed;
}

export function formatNok(amount: number, locale: "nb" | "en"): string {
  const number = new Intl.NumberFormat(locale === "nb" ? "nb-NO" : "en-GB").format(amount);
  return `${number} kr`;
}
