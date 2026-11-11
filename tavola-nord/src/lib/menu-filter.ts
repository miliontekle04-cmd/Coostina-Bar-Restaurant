export const menuCategories = ["smallPlates", "sharing", "lunch", "starters", "pizza", "pasta", "fish", "meat", "sides", "children", "desserts", "cocktails", "drinks"] as const;

export type MenuEntry = {
  id: number;
  category: string;
  name: string;
  descriptionNb: string;
  descriptionEn: string;
  priceNok: number;
  allergens: string[];
  vegetarian: boolean;
  glutenFree: boolean;
  art: string;
};

export type MenuFilters = {
  query: string;
  avoid: string[];
  vegetarian: boolean;
  glutenFree: boolean;
  locale: "nb" | "en";
};

export function filterMenu(items: MenuEntry[], filters: MenuFilters): MenuEntry[] {
  const query = filters.query.trim().toLocaleLowerCase(filters.locale === "nb" ? "nb" : "en");
  return items.filter((item) => {
    if (filters.vegetarian && !item.vegetarian) return false;
    if (filters.glutenFree && !item.glutenFree) return false;
    if (filters.avoid.some((allergen) => item.allergens.includes(allergen))) return false;
    if (!query) return true;
    const description = filters.locale === "nb" ? item.descriptionNb : item.descriptionEn;
    return `${item.name} ${description}`.toLocaleLowerCase(filters.locale === "nb" ? "nb" : "en").includes(query);
  });
}
