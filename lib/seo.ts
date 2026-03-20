import { getLandingFaqItems, getLandingRouteByKey } from "@/lib/content/landing-pages";
import type { SiteContent } from "@/lib/types";
import { filterFutureShows, parseDutchShowDate } from "@/lib/content/shows";
import { getLandingPagePath, type LandingPageKey } from "@/lib/landing-pages";

const DEFAULT_SITE_URL = "https://www.musicbybohem.nl";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildEventDescription(content: SiteContent, show: NonNullable<SiteContent["bookings"]["upcomingShows"]>[number]) {
  return `Live optreden van ${content.brand.name} in ${show.venue}, ${show.city}.`;
}

function getEventImage(content: SiteContent, landingImageSrc?: string) {
  return absoluteUrl(landingImageSrc || content.bookings.highlightImage?.src || content.hero.image.src);
}

function buildEventOffer(
  show: NonNullable<SiteContent["bookings"]["upcomingShows"]>[number],
  startDate: string
) {
  const primaryShowUrl = show.ticketsHref?.trim() || show.infoHref?.trim() || "";
  if (!primaryShowUrl) return undefined;

  return {
    "@type": "Offer",
    url: absoluteUrl(primaryShowUrl),
    availability: "https://schema.org/InStock",
    validFrom: startDate,
    priceCurrency: "EUR",
    ...(show.freeEntry ? { price: 0 } : {})
  };
}

function buildMusicEventNode(
  content: SiteContent,
  show: NonNullable<SiteContent["bookings"]["upcomingShows"]>[number],
  options?: { imageSrc?: string }
) {
  const startDate = parseDutchShowDate(show.date);
  if (!startDate) return null;

  return {
    "@type": "MusicEvent",
    name: `Bohèm live — ${show.venue}`,
    description: buildEventDescription(content, show),
    startDate,
    endDate: startDate,
    image: getEventImage(content, options?.imageSrc),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: show.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: show.city,
        addressCountry: "NL"
      }
    },
    organizer: {
      "@id": `${getSiteUrl()}/#musicgroup`
    },
    performer: {
      "@type": "MusicGroup",
      name: content.brand.name,
      url: getSiteUrl()
    },
    ...(buildEventOffer(show, startDate) ? { offers: buildEventOffer(show, startDate) } : {})
  };
}

export function buildHomeJsonLd(content: SiteContent) {
  const url = getSiteUrl();
  const heroImage = absoluteUrl(content.hero.image.src);
  const faqItems = (content.bookings.faqItems ?? []).filter(
    (item) => typeof item.question === "string" && item.question.trim().length > 0 && typeof item.answer === "string" && item.answer.trim().length > 0
  );
  const personNameMap: Record<string, string> = {
    Arthur: "Arthur Bont",
    Bettina: "Bettina Kraaieveld"
  };
  const groupProfileUrls = [
    content.discography.artist.href,
    content.footer.instagramHref,
    content.footer.youtubeHref,
    ...content.about.bios.map((bio) => bio.website).filter((value): value is string => Boolean(value))
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);

  const events =
    filterFutureShows(content.bookings.upcomingShows)
      ?.map((show) => buildMusicEventNode(content, show))
      .filter(Boolean) ?? [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: content.brand.name,
        inLanguage: "nl-NL",
        description: content.meta.description
      },
      {
        "@type": "MusicGroup",
        "@id": `${url}/#musicgroup`,
        name: content.brand.name,
        url,
        image: heroImage,
        genre: ["Melodische pop", "Verhalende NL/EN songs"],
        member: [
          { "@type": "Person", name: "Arthur Bont" },
          { "@type": "Person", name: "Bettina Kraaieveld" }
        ],
        sameAs: groupProfileUrls,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "bookings",
            email: content.contact.email,
            telephone: content.kampvuur.contactPhone,
            availableLanguage: ["nl", "en"]
          }
        ]
      },
      {
        "@type": "MusicRecording",
        "@id": `${url}/#single-vroeger`,
        name: "Vroeger",
        byArtist: { "@id": `${url}/#musicgroup` },
        inAlbum: {
          "@type": "MusicAlbum",
          name: "Wolkentranen"
        },
        datePublished: "2026",
        url: content.discography.featuredSingle.href
      },
      {
        "@type": "MusicAlbum",
        "@id": `${url}/#album-wolkentranen`,
        name: "Wolkentranen",
        byArtist: { "@id": `${url}/#musicgroup` },
        datePublished: "2026",
        url: content.discography.artist.href
      },
      ...(faqItems.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}/#booking-faq`,
              url: `${url}/#boekingen`,
              inLanguage: "nl-NL",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question.trim(),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer.trim()
                }
              }))
            }
          ]
        : []),
      ...content.about.bios.map((bio) => ({
        "@type": "Person",
        name: personNameMap[bio.name] ?? bio.name,
        ...(bio.website ? { url: bio.website, sameAs: [bio.website] } : {}),
        memberOf: { "@id": `${url}/#musicgroup` }
      })),
      ...events
    ]
  };
}

function getPersonName(name: string) {
  if (name === "Arthur") return "Arthur Bont";
  if (name === "Bettina") return "Bettina Kraaieveld";
  return name;
}

function buildMusicGroupNode(content: SiteContent, url: string) {
  const heroImage = absoluteUrl(content.hero.image.src);
  const groupProfileUrls = [
    content.discography.artist.href,
    content.footer.instagramHref,
    content.footer.youtubeHref,
    ...content.about.bios.map((bio) => bio.website).filter((value): value is string => Boolean(value))
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);

  return {
    "@type": "MusicGroup",
    "@id": `${url}/#musicgroup`,
    name: content.brand.name,
    url,
    image: heroImage,
    genre: ["Melodische pop", "Verhalende NL/EN songs"],
    member: [
      { "@type": "Person", name: "Arthur Bont" },
      { "@type": "Person", name: "Bettina Kraaieveld" }
    ],
    sameAs: groupProfileUrls,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "bookings",
        email: content.contact.email,
        telephone: content.kampvuur.contactPhone,
        availableLanguage: ["nl", "en"]
      }
    ]
  };
}

function buildFaqNode(url: string, faqTitle: string | undefined, faqItems: Array<{ question: string; answer: string }>) {
  if (faqItems.length === 0) return [];
  return [
    {
      "@type": "FAQPage",
      "@id": `${url}/#faq`,
      name: faqTitle?.trim() || "Veelgestelde vragen",
      inLanguage: "nl-NL",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.trim()
        }
      }))
    }
  ];
}

export function buildLandingPageJsonLd(landingKey: LandingPageKey, content: SiteContent) {
  const path = getLandingPagePath(landingKey);
  const url = absoluteUrl(path);
  const landing = content.landingPages[landingKey];
  const faqItems = (landing.faqItems ?? []).filter((item) => item.question?.trim() && item.answer?.trim());
  const events =
    ["musicDuo", "theaterConcert", "huiskamerconcert", "liveMusic", "listeningConcert"].includes(landingKey)
      ? filterFutureShows(content.bookings.upcomingShows)
          ?.map((show) => buildMusicEventNode(content, show, { imageSrc: landing.image?.src }))
          .filter(Boolean) ?? []
      : [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}/#webpage`,
        url,
        name: landing.seoTitle || landing.title,
        description: landing.seoDescription || landing.intro,
        inLanguage: "nl-NL",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${getSiteUrl()}/#website`
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: content.brand.name,
            item: getSiteUrl()
          },
          {
            "@type": "ListItem",
            position: 2,
            name: landing.title,
            item: url
          }
        ]
      },
      buildMusicGroupNode(content, url),
      ...content.about.bios.map((bio) => ({
        "@type": "Person",
        name: getPersonName(bio.name),
        ...(bio.website ? { url: bio.website, sameAs: [bio.website] } : {}),
        memberOf: { "@id": `${url}/#musicgroup` }
      })),
      ...buildFaqNode(url, landing.faqTitle, faqItems),
      ...events
    ]
  };
}

function getPersonNameMap() {
  return {
    Arthur: "Arthur Bont",
    Bettina: "Bettina Kraaieveld"
  } as const;
}

function getGroupProfileUrls(content: SiteContent) {
  return [
    content.discography.artist.href,
    content.footer.instagramHref,
    content.footer.youtubeHref,
    ...content.about.bios.map((bio) => bio.website).filter((value): value is string => Boolean(value))
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);
}

function getUpcomingEventSchema(content: SiteContent) {
  return (
    filterFutureShows(content.bookings.upcomingShows)
      ?.map((show) => buildMusicEventNode(content, show))
      .filter(Boolean) ?? []
  );
}

function buildFaqSchema(content: SiteContent, key: LandingPageKey) {
  const url = getSiteUrl();
  const route = getLandingRouteByKey(key);
  const landing = content.landingPages[key];
  const faqItems = getLandingFaqItems(content, key);
  if (!route || faqItems.length === 0) return [];

  return [
    {
      "@type": "FAQPage",
      "@id": `${url}${route.slug}#faq`,
      url: `${url}${route.slug}`,
      inLanguage: "nl-NL",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.trim()
        }
      })),
      name: landing.faqTitle || `Veelgestelde vragen over ${landing.title}`
    }
  ];
}

export function buildLandingJsonLd(content: SiteContent, key: LandingPageKey) {
  const url = getSiteUrl();
  const route = getLandingRouteByKey(key);
  if (!route) return buildHomeJsonLd(content);

  const landing = content.landingPages[key];
  const personNameMap = getPersonNameMap();
  const groupProfileUrls = getGroupProfileUrls(content);
  const pageUrl = `${url}${route.slug}`;
  const heroImage = absoluteUrl(landing.image?.src || content.hero.image.src);
  const pageDescription = landing.seoDescription || landing.intro;
  const pageGraph = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: landing.seoTitle || landing.title,
    description: pageDescription,
    inLanguage: "nl-NL",
    isPartOf: { "@id": `${url}/#website` },
    about: { "@id": `${url}/#musicgroup` }
  };

  const baseGraph = [
    {
      "@type": "WebSite",
      "@id": `${url}/#website`,
      url,
      name: content.brand.name,
      inLanguage: "nl-NL",
      description: content.meta.description
    },
    {
      "@type": "MusicGroup",
      "@id": `${url}/#musicgroup`,
      name: content.brand.name,
      url,
      image: heroImage,
      genre: ["Melodische pop", "Verhalende NL/EN songs"],
      sameAs: groupProfileUrls,
      member: [
        { "@type": "Person", name: "Arthur Bont" },
        { "@type": "Person", name: "Bettina Kraaieveld" }
      ]
    },
    ...content.about.bios.map((bio) => ({
      "@type": "Person",
      name: personNameMap[bio.name as keyof typeof personNameMap] ?? bio.name,
      ...(bio.website ? { url: bio.website, sameAs: [bio.website] } : {}),
      memberOf: { "@id": `${url}/#musicgroup` }
    })),
    pageGraph,
    ...buildFaqSchema(content, key)
  ];

  const withEvents =
    key === "musicDuo" ||
    key === "theaterConcert" ||
    key === "huiskamerconcert" ||
    key === "liveMusic" ||
    key === "listeningConcert"
      ? [...baseGraph, ...getUpcomingEventSchema(content)]
      : baseGraph;

  return {
    "@context": "https://schema.org",
    "@graph": withEvents
  };
}
