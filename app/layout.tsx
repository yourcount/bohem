import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import { getLiveSiteContent } from "@/lib/content/live-content";
import { getSiteUrl } from "@/lib/seo";
import { getSeoSettingsSafe, resolveHomeSeo } from "@/lib/seo-settings";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const content = getLiveSiteContent();
  const seoSettings = getSeoSettingsSafe();
  const resolvedSeo = resolveHomeSeo(content, seoSettings);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: resolvedSeo.title,
    description: resolvedSeo.description,
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
      canonical: resolvedSeo.canonical
    },
    robots: {
      index: resolvedSeo.robotsIndex,
      follow: resolvedSeo.robotsFollow,
      googleBot: {
        index: resolvedSeo.robotsIndex,
        follow: resolvedSeo.robotsFollow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    openGraph: {
      type: "website",
      locale: "nl_NL",
      url: resolvedSeo.canonical,
      siteName: "Bohèm",
      title: resolvedSeo.ogTitle,
      description: resolvedSeo.ogDescription,
      images: [
        {
          url: content.hero.image.src,
          width: 1536,
          height: 864,
          alt: content.hero.image.alt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedSeo.ogTitle,
      description: resolvedSeo.ogDescription,
      images: [content.hero.image.src]
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
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
