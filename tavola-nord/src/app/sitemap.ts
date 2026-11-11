import type { MetadataRoute } from "next";
import { routes } from "@/i18n/routes";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return Object.values(routes).flatMap((route) =>
    [route.nb, route.en].map((path) => ({
      url: `${base}${path}`,
      alternates: { languages: { nb: `${base}${route.nb}`, en: `${base}${route.en}` } },
    })),
  );
}
