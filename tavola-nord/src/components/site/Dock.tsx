"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";

/** The three things people come here to do, always within reach on phones. Wider screens have them in the header. */
export function Dock({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = getDictionary(locale);
  const items = [
    { href: routes.menu[locale], label: t.nav.menu, primary: false },
    { href: routes.book[locale], label: t.nav.book, primary: true },
    { href: routes.events[locale], label: t.nav.events, primary: false },
  ];

  return (
    <nav
      aria-label={t.nav.quick}
      className="dock on-dark pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="pointer-events-auto flex items-center gap-1 rounded-full bg-lagoon p-1.5 text-mist shadow-[0_8px_24px_#0000004d] ring-1 ring-oil/40">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={
                item.primary
                  ? "inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-oil px-3.5 text-[0.9375rem] font-semibold text-ink hover:bg-[#dcbb7b] min-[360px]:px-5 min-[360px]:text-base"
                  : "inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 text-[0.9375rem] font-medium hover:bg-white/10 aria-[current=page]:underline aria-[current=page]:underline-offset-4 min-[360px]:px-4 min-[360px]:text-base"
              }
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
