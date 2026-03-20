import type { LandingFaqItem, LandingPageContent, NavItem, SiteContent } from "@/lib/types";

export type LandingPageKey = keyof SiteContent["landingPages"];

export type LandingPageRoute = {
  key: LandingPageKey;
  slug: string;
  label: string;
  homeLabel: string;
};

export const LANDING_PAGE_ROUTES: LandingPageRoute[] = [
  {
    key: "musicDuo",
    slug: "/muziekduo-boeken",
    label: "Muziekduo boeken",
    homeLabel: "Muziekduo"
  },
  {
    key: "theaterConcert",
    slug: "/theaterconcert-boeken",
    label: "Theaterconcert boeken",
    homeLabel: "Theaterconcert"
  },
  {
    key: "kampvuur",
    slug: "/kampvuurklanken",
    label: "Kampvuurklanken",
    homeLabel: "Kampvuurklanken"
  },
  {
    key: "huiskamerconcert",
    slug: "/huiskamerconcert-boeken",
    label: "Huiskamerconcert boeken",
    homeLabel: "Huiskamerconcert"
  },
  {
    key: "liveMusic",
    slug: "/live-muziek-boeken",
    label: "Live muziek boeken",
    homeLabel: "Live muziek"
  },
  {
    key: "teamEvening",
    slug: "/muzikale-teamavond",
    label: "Muzikale teamavond",
    homeLabel: "Teamavond"
  },
  {
    key: "culturalEvent",
    slug: "/muziek-voor-cultureel-event",
    label: "Muziek voor cultureel event",
    homeLabel: "Cultureel event"
  },
  {
    key: "listeningConcert",
    slug: "/luisterconcert-boeken",
    label: "Luisterconcert boeken",
    homeLabel: "Luisterconcert"
  },
  {
    key: "press",
    slug: "/pers",
    label: "Pers",
    homeLabel: "Pers"
  }
];

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasFaqItem(item: LandingFaqItem | undefined) {
  return Boolean(item && hasText(item.question) && hasText(item.answer));
}

export function getLandingRouteByKey(key: LandingPageKey) {
  return LANDING_PAGE_ROUTES.find((route) => route.key === key);
}

export function getLandingNavigation(): NavItem[] {
  return [
    { label: "Home", href: "/" },
    ...LANDING_PAGE_ROUTES.map((route) => ({ label: route.homeLabel, href: route.slug })),
    { label: "Contact", href: "/#contact" }
  ];
}

export function getLandingPageContent(content: SiteContent, key: LandingPageKey): LandingPageContent {
  return content.landingPages[key];
}

export function getLandingFaqItems(content: SiteContent, key: LandingPageKey): LandingFaqItem[] {
  const landingFaq = (content.landingPages[key].faqItems ?? []).filter(hasFaqItem);
  const localFaq = (content.landingPages[key].localFaqItems ?? []).filter(hasFaqItem);
  if (landingFaq.length > 0) {
    return [...landingFaq, ...localFaq];
  }

  if (key === "kampvuur") {
    return localFaq;
  }

  return [...(content.bookings.faqItems ?? []).filter(hasFaqItem), ...localFaq];
}
