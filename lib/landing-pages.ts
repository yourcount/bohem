import type { SiteContent, NavItem } from "@/lib/types";

export const LANDING_PAGE_CONFIG = {
  musicDuo: {
    key: "musicDuo",
    slug: "muziekduo-boeken",
    shortTitle: "Muziekduo boeken",
    navLabel: "Muziekduo"
  },
  theaterConcert: {
    key: "theaterConcert",
    slug: "theaterconcert-boeken",
    shortTitle: "Theaterconcert boeken",
    navLabel: "Theaterconcert"
  },
  kampvuur: {
    key: "kampvuur",
    slug: "kampvuurklanken",
    shortTitle: "Kampvuurklanken",
    navLabel: "Kampvuurklanken"
  },
  huiskamerconcert: {
    key: "huiskamerconcert",
    slug: "huiskamerconcert-boeken",
    shortTitle: "Huiskamerconcert boeken",
    navLabel: "Huiskamerconcert"
  },
  press: {
    key: "press",
    slug: "pers",
    shortTitle: "Pers",
    navLabel: "Pers"
  }
} as const;

export type LandingPageKey = keyof typeof LANDING_PAGE_CONFIG;

export function getLandingPagePath(key: LandingPageKey) {
  return `/${LANDING_PAGE_CONFIG[key].slug}`;
}

export function getLandingNavigation(navigation: NavItem[]): NavItem[] {
  return navigation.map((item) => {
    if (!item.href.startsWith("#")) return item;
    return {
      ...item,
      href: `/${item.href}`
    };
  });
}

export function getLandingPageContent(content: SiteContent, key: LandingPageKey) {
  return content.landingPages[key];
}

export function landingFaqOrFallback(content: SiteContent, key: LandingPageKey) {
  const landing = getLandingPageContent(content, key);
  const fallbackTitle = content.bookings.faqTitle ?? "Veelgestelde vragen";
  const fallbackItems = content.bookings.faqItems ?? [];

  return {
    title: landing.faqTitle?.trim() ? landing.faqTitle : fallbackTitle,
    items: Array.isArray(landing.faqItems) && landing.faqItems.length > 0 ? landing.faqItems : fallbackItems
  };
}
