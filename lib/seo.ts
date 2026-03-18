import type { SiteContent } from "@/lib/types";
import { filterFutureShows, parseDutchShowDate } from "@/lib/content/shows";

const DEFAULT_SITE_URL = "https://www.musicbybohem.nl";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildHomeJsonLd(content: SiteContent) {
  const url = getSiteUrl();
  const heroImage = absoluteUrl(content.hero.image.src);
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
      ?.map((show) => {
        const startDate = parseDutchShowDate(show.date);
        if (!startDate) return null;
        const primaryShowUrl = show.ticketsHref?.trim() || show.infoHref?.trim() || "";
        return {
          "@type": "MusicEvent",
          name: `Bohèm live — ${show.venue}`,
          startDate,
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
          performer: {
            "@type": "MusicGroup",
            name: content.brand.name,
            url
          },
          ...(primaryShowUrl
            ? {
                offers: {
                  "@type": "Offer",
                  url: absoluteUrl(primaryShowUrl),
                  availability: "https://schema.org/InStock"
                }
              }
            : {})
        };
      })
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
