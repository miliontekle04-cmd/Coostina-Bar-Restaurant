import { brand, type Social } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";

const icons: Record<Social["platform"], React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </>
  ),
  facebook: <path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z" />,
  tiktok: (
    <path
      fill="currentColor"
      d="M16.6 3h-3v11.9a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .8.1V9.2a5.8 5.8 0 1 0 4.9 5.7V8.8a7.4 7.4 0 0 0 4.4 1.4v-3a4.4 4.4 0 0 1-4.4-4.2Z"
    />
  ),
};

/** Round social media icons. Each one links to the profile once its address is set in brand.socials. */
export function SocialLinks({ locale, className = "" }: { locale: Locale; className?: string }) {
  const t = getDictionary(locale);
  const circle = "inline-flex size-11 items-center justify-center rounded-full border border-current";

  return (
    <ul className={`flex gap-3 ${className}`} aria-label={t.footer.follow}>
      {brand.socials.map((social) => (
        <li key={social.platform}>
          {social.href ? (
            <a
              href={social.href}
              rel="noopener noreferrer"
              target="_blank"
              aria-label={t.footer.followOn(social.label)}
              className={`${circle} transition-colors hover:border-oil hover:bg-oil hover:text-ink`}
            >
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                {icons[social.platform]}
              </svg>
            </a>
          ) : (
            <span className={`${circle} opacity-45`} title={t.footer.comingSoon(social.label)} aria-label={t.footer.comingSoon(social.label)} role="img">
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                {icons[social.platform]}
              </svg>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
