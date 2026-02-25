import type { Metadata } from "next";

import { siteContent } from "@/lib/content";

import "./globals.css";

export const metadata: Metadata = {
  title: siteContent.meta.title,
  description: siteContent.meta.description
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
