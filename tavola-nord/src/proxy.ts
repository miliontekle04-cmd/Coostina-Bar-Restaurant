import { NextResponse, type NextRequest } from "next/server";
import { internalPathForNorwegian } from "@/i18n/routes";

/**
 * Norwegian lives at the root (/meny) and English under /en (/en/menu).
 * Both are served by app/[locale], so Norwegian addresses get rewritten to /nb/...
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  // /nb/... is an internal address. Send people to the public one.
  if (pathname === "/nb" || pathname.startsWith("/nb/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/nb" ? "/" : "/not-found";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = internalPathForNorwegian(pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip the API, the admin panel, Next.js internals and any file with an extension.
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
