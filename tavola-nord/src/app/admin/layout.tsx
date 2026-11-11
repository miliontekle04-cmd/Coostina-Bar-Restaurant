import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { playfair, schibsted } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Admin | Coostina",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${schibsted.variable}`}>
      <body className="admin-body min-h-dvh">{children}</body>
    </html>
  );
}
