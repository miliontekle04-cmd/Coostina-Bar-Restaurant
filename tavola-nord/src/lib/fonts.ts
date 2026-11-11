import localFont from "next/font/local";

// Self-hosted from npm, so visitors' browsers never contact a font service.
export const playfair = localFont({
  src: [
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

export const schibsted = localFont({
  src: "../../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
  variable: "--font-schibsted",
  display: "swap",
  weight: "400 900",
});
