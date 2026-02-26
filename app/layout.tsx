import type { Metadata } from "next";

import { siteContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: siteContent.meta.title,
  description: siteContent.meta.description,
  keywords: [
    "Bohèm",
    "muziekduo boeken",
    "live muziek boekingen",
    "theater muziekduo",
    "Nederlandstalige muziek",
    "Kampvuurklanken",
    "Arthur Bont",
    "Bettina Kraaieveld"
  ],
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "/",
    siteName: "Bohèm",
    title: siteContent.meta.title,
    description: siteContent.meta.description,
    images: [
      {
        url: "/images/bohem-hero.jpg",
        width: 1536,
        height: 864,
        alt: "Bohèm in warm podiumlicht"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteContent.meta.title,
    description: siteContent.meta.description,
    images: ["/images/bohem-hero.jpg"]
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  category: "music"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
