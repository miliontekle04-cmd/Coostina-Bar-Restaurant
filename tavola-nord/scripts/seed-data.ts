/**
 * Coostina's menu, from the printed menu card (Caribbean street food, small plates made for sharing).
 * Names and prices are from the card. Allergens are best guesses from the descriptions: confirm them with the kitchen.
 * Edit the live menu in /admin, or here and then run `npm run db:reset-menu` with the dev server stopped.
 */

type Row = [
  category: string,
  name: string,
  descriptionNb: string,
  descriptionEn: string,
  priceNok: number,
  allergens: string[],
  flags: { v?: boolean; gf?: boolean; featured?: boolean },
  art: string,
];

const rows: Row[] = [
  // Small plates, made for sharing
  ["smallPlates", "Saltfish Cakes", "Sprø kaker av saltet torsk med løk, hvitløk, fersk timian, persille og scotch bonnet. Serveres med kassavafries.", "Crispy salt cod cakes with onion, garlic, fresh thyme, parsley and scotch bonnet. Served with cassava fries.", 129, ["fish", "gluten", "egg"], { featured: true }, "fish"],
  ["smallPlates", "Jerk Chicken", "Langtidsmarinert jerk-kylling med rice & peas og en frisk salat.", "Slow-marinated jerk chicken with rice & peas and a fresh salad.", 159, [], { featured: true }, "meat"],
  ["smallPlates", "Chicken Gumbo", "Fyldig karibisk gumbo med kylling, okra, tomat, paprika, selleri og et snev av scotch bonnet.", "Hearty Caribbean gumbo with chicken, okra, tomato, bell pepper, celery and a kick of scotch bonnet.", 119, ["gluten", "celery"], { featured: true }, "soup"],
  ["smallPlates", "Island Wings", "Seks kyllingvinger marinert i allehånde, timian, ingefær og cayennepepper.", "Six wings marinated in allspice, thyme, ginger and cayenne.", 119, [], { featured: true }, "meat"],
  ["smallPlates", "Macaroni Pie", "Ovnsbakt karibisk makaronipai med kylling, stekt søt plantain og salat.", "Baked Caribbean-style mac pie with chicken, fried sweet plantain and salad.", 149, ["gluten", "milk", "egg"], { featured: true }, "pasta"],
  ["smallPlates", "Mango Salad", "Fersk, moden mango, enkelt servert.", "Fresh, ripe mango, simply served.", 89, [], { v: true, gf: true, featured: true }, "salad"],

  // Sharing
  ["sharing", "Island Feast for Two", "Velg fire valgfrie småretter, til deling for to.", "Choose any four plates, to share between two.", 449, [], { featured: true }, "antipasti"],
];

export const demoMenuItems = rows.map(([category, name, descriptionNb, descriptionEn, priceNok, allergens, flags, art]) => ({
  category,
  name,
  descriptionNb,
  descriptionEn,
  priceNok,
  allergens,
  vegetarian: flags.v ?? false,
  glutenFree: flags.gf ?? false,
  featured: flags.featured ?? false,
  art,
}));

export const demoEventMenus = [
  { nameNb: "Pizzafest", nameEn: "Pizza party", priceNok: 349, starter: "Bruschetta al Pomodoro", main: "Utvalg av pizza til deling", dessert: "Tiramisù" },
  { nameNb: "Trattoria", nameEn: "Trattoria", priceNok: 449, starter: "Tagliere Misto", main: "Tagliatelle al Ragù eller Risotto ai Funghi", dessert: "Panna Cotta" },
  { nameNb: "Coostina-menyen", nameEn: "The Coostina menu", priceNok: 549, starter: "Burrata", main: "Linguine ai Frutti di Mare", dessert: "Tiramisù" },
];
