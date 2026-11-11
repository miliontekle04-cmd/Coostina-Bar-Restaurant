import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/config/brand";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reservations", label: "Reservations" },
  { href: "/admin/enquiries", label: "Event enquiries" },
  { href: "/admin/events", label: "What's on" },
  { href: "/admin/menu", label: "Menu" },
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <header className="on-dark bg-ink text-mist">
        <div className="page flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <Link href="/admin" className="display text-2xl text-oil no-underline">
            {brand.name}
          </Link>
          <nav aria-label="Admin">
            <ul className="flex flex-wrap gap-x-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <form action={logout} className="flex items-center gap-3 text-[0.9375rem]">
            <span className="hidden md:inline">{admin.email}</span>
            <button type="submit" className="min-h-11 underline underline-offset-4">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="page py-8">{children}</main>
    </>
  );
}
