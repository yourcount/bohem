import type { Metadata } from "next";

import { getLandingPageContent, getLandingRouteByKey, type LandingPageKey } from "@/lib/content/landing-pages";
import { getSiteUrl } from "@/lib/seo";
import { type SeoSettings, resolveSeoInput } from "@/lib/seo-settings";
import type { SiteContent } from "@/lib/types";

export function buildLandingMetadata(content: SiteContent, key: LandingPageKey, settings: SeoSettings | null): Metadata {
  const route = getLandingRouteByKey(key);
  const landing = getLandingPageContent(content, key);
  const canonicalPath = route?.slug ?? "/";
  const resolvedSeo = resolveSeoInput(
    {
      title: landing.seoTitle,
      description: landing.seoDescription,
      ogTitle: landing.ogTitle,
      ogDescription: landing.ogDescription,
      canonical: canonicalPath,
      robotsIndex: true,
      robotsFollow: true
    },
    settings
  );

  return {
    title: resolvedSeo.title,
    description: resolvedSeo.description,
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
      url: `${getSiteUrl()}${canonicalPath}`,
      siteName: "Bohèm",
      title: resolvedSeo.ogTitle,
      description: resolvedSeo.ogDescription,
      images: [
        {
          url: landing.image?.src || content.hero.image.src,
          width: landing.image?.width || 1536,
          height: landing.image?.height || 864,
          alt: landing.image?.alt || content.hero.image.alt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedSeo.ogTitle,
      description: resolvedSeo.ogDescription,
      images: [landing.image?.src || content.hero.image.src]
    }
  };
}
