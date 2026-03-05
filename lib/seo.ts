import type { SiteContent } from "@/lib/types";

const DEFAULT_SITE_URL = "https://musicbybohem.nl";

const dutchMonthMap: Record<string, string> = {
  jan: "01",
  feb: "02",
  mrt: "03",
  apr: "04",
  mei: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  okt: "10",
  nov: "11",
  dec: "12"
};

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function parseShowDate(dateLabel: string): string | null {
  const match = dateLabel.toLowerCase().match(/^(\d{1,2})\s+([a-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const [, dayRaw, monthRaw, year] = match;
  const month = dutchMonthMap[monthRaw];
  if (!month) return null;
  const day = dayRaw.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildHomeJsonLd(content: SiteContent) {
  const url = getSiteUrl();
  const heroImage = absoluteUrl(content.hero.image.src);
  const artistProfileUrls = [
    content.discography.artist.href,
    ...content.about.bios.map((bio) => bio.website).filter((value): value is string => Boolean(value))
  ].filter((value, index, array) => array.indexOf(value) === index);

  const events =
    content.bookings.upcomingShows
      ?.map((show) => {
        const startDate = parseShowDate(show.date);
        if (!startDate) return null;
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
          offers: {
            "@type": "Offer",
            url: absoluteUrl(show.ctaHref),
            availability: "https://schema.org/InStock"
          }
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
        sameAs: artistProfileUrls,
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
        name: bio.name,
        ...(bio.website ? { url: bio.website, sameAs: [bio.website] } : {}),
        memberOf: { "@id": `${url}/#musicgroup` }
      })),
      ...events
    ]
  };
}
