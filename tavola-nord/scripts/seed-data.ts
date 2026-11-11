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

  // Alcohol-free drinks. SUGGESTED drinks and prices: the owner confirms them, or changes them in /admin.
  // Never add drinks with alcohol to the website: Norwegian law (alkoholloven § 9-2) bans advertising them.
  ["drinks", "Sorrel", "Hjemmelaget karibisk hibiskusdrikk med ingefær, kanel og nellik. Serveres iskald.", "House-made Caribbean hibiscus drink with ginger, cinnamon and clove. Served ice cold.", 49, [], { v: true, gf: true }, "cocktail"],
  ["drinks", "Ginger Beer", "Sterk, alkoholfri ingefærbrus.", "Fiery, alcohol-free ginger soda.", 45, [], { v: true, gf: true }, "cocktail"],
  ["drinks", "Tropical Smoothie", "Mango, ananas og pasjonsfrukt, laget fersk når du bestiller.", "Mango, pineapple and passion fruit, made fresh when you order.", 69, [], { v: true, gf: true }, "cocktail"],
  ["drinks", "Mango & Passion Juice", "Mango- og pasjonsfruktjuice med is og lime.", "Mango and passion fruit juice with ice and lime.", 45, [], { v: true, gf: true }, "cocktail"],
  ["drinks", "Kokosvann", "Kaldt kokosvann.", "Chilled coconut water.", 45, [], { v: true, gf: true }, "cocktail"],
  ["drinks", "Brus og vann", "Spør om utvalget.", "Ask what we have.", 35, [], { v: true, gf: true }, "cocktail"],
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

/** SUGGESTED party menus built from the menu card. The owner confirms dishes and prices before isDemo is set to false. */
export const demoEventMenus = [
  { nameNb: "Island Party", nameEn: "Island Party", priceNok: 349, starter: "Saltfish Cakes", main: "Jerk Chicken med rice & peas", dessert: "Mango Salad" },
  { nameNb: "Caribbean Feast", nameEn: "Caribbean Feast", priceNok: 449, starter: "Saltfish Cakes og Island Wings", main: "Jerk Chicken eller Macaroni Pie", dessert: "Mango Salad" },
  { nameNb: "Coostina-menyen", nameEn: "The Coostina menu", priceNok: 549, starter: "Chicken Gumbo og Saltfish Cakes", main: "Jerk Chicken og Macaroni Pie til deling", dessert: "Mango Salad og Tropical Smoothie" },
];
