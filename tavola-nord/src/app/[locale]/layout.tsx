import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Dock } from "@/components/site/Dock";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { brand } from "@/config/brand";
import { isLocale } from "@/i18n/routes";
import { playfair, schibsted } from "@/lib/fonts";
import { jsonLdString, restaurantJsonLd, siteUrl } from "@/lib/seo";

// The title is the fallback for pages without their own, such as the 404 page.
export const metadata: Metadata = { metadataBase: new URL(siteUrl()), title: brand.fullName };
export const viewport: Viewport = { themeColor: "#1c1814" };

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${playfair.variable} ${schibsted.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(restaurantJsonLd(locale)) }} />
        <SiteHeader locale={locale} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter locale={locale} />
        <Dock locale={locale} />
        <ChatWidget locale={locale} />
      </body>
    </html>
  );
}
