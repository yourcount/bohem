export const CACHE_TAGS = {
  siteContent: "site-content",
  seoSettings: "seo-settings",
  featureFlags: "feature-flags"
} as const;

export const CACHE_REVALIDATE_SECONDS = {
  siteContent: 90,
  seoSettings: 120,
  featureFlags: 90
} as const;
