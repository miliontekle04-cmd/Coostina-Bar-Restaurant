"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const t = getDictionary(pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nb");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page max-w-3xl py-16">
      <h1 className="display text-[clamp(2.75rem,7vw,5rem)] leading-none text-tomato">{t.error.heading}</h1>
      <p className="mt-4 text-lg">{t.error.body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-ink" onClick={reset}>
          {t.common.tryAgain}
        </button>
        <a className="link" href={brand.phone.href}>
          {brand.phone.display}
        </a>
      </div>
    </div>
  );
}
