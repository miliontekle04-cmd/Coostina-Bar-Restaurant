"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/i18n/routes";

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nb";
  const t = getDictionary(locale);

  return (
    <div className="page grid items-center gap-8 py-16 md:grid-cols-[1fr_18rem]">
      <div>
        <h1 className="display text-[clamp(3rem,8vw,5.5rem)] leading-none text-tomato">{t.notFound.heading}</h1>
        <p className="mt-4 text-lg">{t.notFound.body}</p>
        <Link href={routes.home[locale]} className="btn btn-ink mt-6">
          {t.notFound.home}
        </Link>
      </div>
      <svg viewBox="0 0 200 200" className="w-48 md:w-full" aria-hidden="true">
        <path d="M100 4c54-1 97 42 96 97-1 53-44 96-97 95S3 152 4 99C5 47 47 5 100 4Z" fill="#fbfdfc" />
        <circle cx="100" cy="100" r="82" fill="none" stroke="#231a15" strokeOpacity="0.12" strokeWidth="2" />
      </svg>
    </div>
  );
}
