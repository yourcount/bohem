import type { MetadataRoute } from "next";

import { getAllNewsItems } from "@/lib/content/news";
import { LANDING_PAGE_ROUTES } from "@/lib/content/landing-pages";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const newsItems = getAllNewsItems();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/nieuws`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75
    },
    ...LANDING_PAGE_ROUTES.map((route) => ({
      url: `${siteUrl}${route.slug}`,
      lastModified: new Date(),
      changeFrequency: (route.key === "press" ? "monthly" : "weekly") as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority:
        route.key === "musicDuo" || route.key === "liveMusic"
          ? 0.9
          : route.key === "theaterConcert" || route.key === "kampvuur" || route.key === "culturalEvent" || route.key === "listeningConcert"
            ? 0.85
            : route.key === "huiskamerconcert" || route.key === "teamEvening"
              ? 0.8
              : 0.7
    })),
    ...newsItems.map((item) => ({
      url: `${siteUrl}/nieuws/${item.slug}`,
      lastModified: new Date(item.publishedAt),
      changeFrequency: "monthly" as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: item.type === "release" ? 0.74 : item.type === "show" ? 0.72 : 0.68
    }))
  ];
}
