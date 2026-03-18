import type { MetadataRoute } from "next";

import { LANDING_PAGE_ROUTES } from "@/lib/content/landing-pages";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    ...LANDING_PAGE_ROUTES.map((route) => ({
      url: `${siteUrl}${route.slug}`,
      lastModified: new Date(),
      changeFrequency: (route.key === "press" ? "monthly" : "weekly") as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority:
        route.key === "musicDuo"
          ? 0.9
          : route.key === "theaterConcert" || route.key === "kampvuur"
            ? 0.85
            : route.key === "huiskamerconcert"
              ? 0.8
              : 0.7
    }))
  ];
}
