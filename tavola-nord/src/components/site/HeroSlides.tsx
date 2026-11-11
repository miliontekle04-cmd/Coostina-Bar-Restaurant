import Image from "next/image";
import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routes";

/**
 * The restaurant's photos crossfading behind the hero text, each one drifting slowly closer.
 * The timing lives in globals.css (.hero-slide). With reduced motion, only the first photo shows.
 */
export function HeroSlides({ locale }: { locale: Locale }) {
  const photos = brand.photos;
  if (photos.length === 0) return null;
  const cycle = photos.length * 6;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {photos.map((photo, index) => (
        <div
          key={photo.src}
          className="hero-slide absolute inset-0"
          style={{ animationDuration: `${cycle}s`, animationDelay: `${index * 6 - 1}s` }}
        >
          <Image src={photo.src} alt={photo.alt[locale]} fill priority={index === 0} sizes="100vw" className="object-cover" />
        </div>
      ))}
      {/* Keeps the text readable on every photo. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c1814cc_0%,#1c181499_45%,#1c1814e6_100%)]" />
    </div>
  );
}
