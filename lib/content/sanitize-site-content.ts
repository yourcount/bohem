import { siteContent } from "@/lib/content";
import { normalizeDutchShowDateInput } from "@/lib/content/shows";
import type { SiteContent } from "@/lib/types";

function isValidAbsoluteHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

function normalizeDuplicateHttpPrefixes(value: string) {
  let href = value.trim();
  const matches: string[] = [];

  while (true) {
    const match = href.match(/^(https?:)(\/\/)?/i);
    if (!match) break;
    matches.push(match[1].toLowerCase());
    href = href.slice(match[0].length);
    if (!/^(https?:)(\/\/)?/i.test(href)) break;
  }

  if (matches.length <= 1) {
    return value.trim();
  }

  const finalScheme = matches[matches.length - 1];
  return `${finalScheme}//${href.replace(/^\/+/, "")}`;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

const INTERNAL_ANCHOR_ALIASES: Record<string, string> = {
  bio: "#bio",
  over: "#bio",
  discografie: "#discografie",
  muziek: "#muziek",
  shows: "#shows",
  show: "#shows",
  agenda: "#shows",
  kampvuur: "#kampvuurklanken",
  kampvuurklanken: "#kampvuurklanken",
  boekingen: "#boekingen",
  bookings: "#boekingen",
  pers: "#pers",
  contact: "#contact"
};

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikePhone(value: string) {
  const normalized = value.replace(/[\s().-]+/g, "");
  return /^\+?[0-9]{8,}$/.test(normalized);
}

function normalizePhoneHref(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  if (normalized.startsWith("00")) {
    return `+${normalized.slice(2)}`;
  }
  return normalized;
}

function normalizeEditorHrefInput(value: string) {
  const href = normalizeDuplicateHttpPrefixes(value);
  if (!href) return href;
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(href)) return href;

  const normalizedAlias = INTERNAL_ANCHOR_ALIASES[normalizeSearchText(href)];
  if (normalizedAlias) {
    return normalizedAlias;
  }

  if (looksLikeEmail(href)) {
    return `mailto:${href}`;
  }

  if (looksLikePhone(href)) {
    return `tel:${normalizePhoneHref(href)}`;
  }

  return href;
}

function isValidHref(href: string) {
  const value = normalizeEditorHrefInput(href);
  if (!value) return false;
  if (value.startsWith("#")) return true;
  if (value.startsWith("/")) return !value.startsWith("//");
  if (value.startsWith("mailto:")) return value.length > "mailto:".length;
  if (value.startsWith("tel:")) return value.length > "tel:".length;
  return isValidAbsoluteHttpUrl(value);
}

function sanitizeHref(href: string, fallback: string) {
  const normalized = normalizeEditorHrefInput(href);
  return isValidHref(normalized) ? normalized : fallback;
}

function sanitizeOptionalHref(href: string | undefined, fallback = "") {
  if (typeof href !== "string") return fallback;
  const value = normalizeEditorHrefInput(href);
  if (!value) return "";
  return isValidHref(value) ? value : fallback;
}

function sanitizeLandingCta(
  value: { label?: string; href?: string; variant?: "primary" | "secondary" } | undefined,
  fallback: { label?: string; href?: string; variant?: "primary" | "secondary" } | undefined
) {
  const fallbackLabel = fallback?.label?.trim() || "";
  const fallbackHref = fallback?.href?.trim() || "/#contact";

  return {
    label: value?.label?.trim() || fallbackLabel,
    href: sanitizeHref(value?.href ?? fallbackHref, fallbackHref),
    variant: value?.variant ?? fallback?.variant ?? "primary"
  };
}

function sanitizeLandingFaqItems(
  items: Array<{ question: string; answer: string }> | undefined,
  fallback: Array<{ question: string; answer: string }> | undefined
) {
  return (items ?? fallback ?? [])
    .map((item, index) => ({
      question: item.question?.trim() || fallback?.[index]?.question || "",
      answer: item.answer?.trim() || fallback?.[index]?.answer || ""
    }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0);
}

function sanitizeTextList(items: string[] | undefined, fallback: string[] | undefined) {
  return (items ?? fallback ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
}

export function sanitizeNavigationItems(items: SiteContent["navigation"]): SiteContent["navigation"] {
  return items.map((item, index) => {
    const fallback = siteContent.navigation[index]?.href ?? "#contact";
    const nextHref = sanitizeHref(item.href, fallback);
    const nextLabel = typeof item.label === "string" && item.label.trim() ? item.label.trim() : siteContent.navigation[index]?.label ?? "Menu";

    return {
      ...item,
      label: nextLabel,
      href: nextHref
    };
  });
}

export function sanitizeSiteContent(content: SiteContent): SiteContent {
  const fallbackReleases = siteContent.discography.releases;
  const fallbackMailTemplates = siteContent.contact.emailTemplates;
  const featuredSingleImage: SiteContent["discography"]["featuredSingle"]["image"] =
    siteContent.discography.featuredSingle.image || content.discography.featuredSingle.image
      ? ({
          ...siteContent.discography.featuredSingle.image,
          ...content.discography.featuredSingle.image
        } as SiteContent["discography"]["featuredSingle"]["image"])
      : undefined;

  return {
    ...content,
    navigation: sanitizeNavigationItems(content.navigation),
    hero: {
      ...content.hero,
      ctas: content.hero.ctas.map((cta, index) => ({
        ...cta,
        href: sanitizeHref(cta.href, siteContent.hero.ctas[index]?.href ?? "#contact")
      })),
      ...(Array.isArray(content.hero.intentLinks) && content.hero.intentLinks.length > 0
        ? {
            intentLinks: content.hero.intentLinks.map((item, index) => ({
              ...item,
              href: sanitizeHref(item.href, siteContent.hero.intentLinks?.[index]?.href ?? "#contact")
            }))
          }
        : {}),
      ...(content.hero.listenNow
        ? {
            listenNow: {
              ...content.hero.listenNow,
              href: sanitizeHref(content.hero.listenNow.href, siteContent.hero.listenNow?.href ?? "#discografie")
            }
          }
        : {})
    },
    about: {
      ...content.about,
      bios: content.about.bios.map((bio, index) => ({
        ...bio,
        ...(bio.website
          ? {
              website: sanitizeHref(
                bio.website,
                siteContent.about.bios[index]?.website ?? siteContent.about.bios[0]?.website ?? "/"
              )
            }
          : {})
      }))
    },
    discography: {
      ...content.discography,
      featuredSingle: {
        ...siteContent.discography.featuredSingle,
        ...content.discography.featuredSingle,
        ...(featuredSingleImage ? { image: featuredSingleImage } : {}),
        href: sanitizeHref(content.discography.featuredSingle.href, siteContent.discography.featuredSingle.href)
      },
      artist: {
        ...content.discography.artist,
        href: sanitizeHref(content.discography.artist.href, siteContent.discography.artist.href)
      },
      releases: content.discography.releases.map((release, releaseIndex) => {
        const fallbackRelease =
          fallbackReleases.length > 0 ? fallbackReleases[Math.min(releaseIndex, fallbackReleases.length - 1)] : null;
        return {
          ...release,
          links: release.links.map((link, linkIndex) => ({
            ...link,
            href: sanitizeHref(link.href, fallbackRelease?.links[Math.min(linkIndex, fallbackRelease.links.length - 1)]?.href ?? "#discografie")
          }))
        };
      })
    },
    musicExperience: {
      ...content.musicExperience,
      cta: {
        ...content.musicExperience.cta,
        href: sanitizeHref(content.musicExperience.cta.href, siteContent.musicExperience.cta.href)
      }
    },
    kampvuur: {
      ...content.kampvuur,
      ...(content.kampvuur.packageCta
        ? {
            packageCta: {
              ...content.kampvuur.packageCta,
              href: sanitizeHref(content.kampvuur.packageCta.href, siteContent.kampvuur.packageCta?.href ?? "#contact")
            }
          }
        : {})
    },
    bookings: {
      ...siteContent.bookings,
      ...content.bookings,
      cta: {
        ...siteContent.bookings.cta,
        ...content.bookings.cta,
        href: sanitizeHref(content.bookings.cta.href, siteContent.bookings.cta.href)
      },
      ...(Array.isArray(content.bookings.routeItems) && content.bookings.routeItems.length > 0
        ? {
            routeItems: content.bookings.routeItems.map((item, index) => ({
              ...item,
              href: sanitizeHref(item.href, siteContent.bookings.routeItems?.[index]?.href ?? "#contact")
            }))
          }
        : {}),
      ...(Array.isArray(content.bookings.faqItems) && content.bookings.faqItems.length > 0
        ? {
            faqItems: content.bookings.faqItems.map((item, index) => ({
              question: item.question?.trim() || siteContent.bookings.faqItems?.[index]?.question || "",
              answer: item.answer?.trim() || siteContent.bookings.faqItems?.[index]?.answer || ""
            }))
          }
        : {}),
      ...(Array.isArray(content.bookings.upcomingShows) && content.bookings.upcomingShows.length > 0
        ? {
            upcomingShows: content.bookings.upcomingShows.map((show, index) => ({
              date: normalizeDutchShowDateInput(show.date),
              venue: show.venue,
              city: show.city,
              freeEntry: Boolean(show.freeEntry),
              ticketsHref: sanitizeOptionalHref(show.ticketsHref, siteContent.bookings.upcomingShows?.[index]?.ticketsHref ?? ""),
              infoHref: sanitizeOptionalHref(show.infoHref, siteContent.bookings.upcomingShows?.[index]?.infoHref ?? "")
            }))
          }
        : {}),
      ...(content.bookings.press
        ? {
            press: {
              ...siteContent.bookings.press,
              ...content.bookings.press,
              kitHref: sanitizeHref(content.bookings.press.kitHref, siteContent.bookings.press?.kitHref ?? "/")
            }
          }
        : {})
    },
    landingPages: {
      musicDuo: {
        ...siteContent.landingPages.musicDuo,
        ...content.landingPages?.musicDuo,
        cta: sanitizeLandingCta(content.landingPages?.musicDuo?.cta, siteContent.landingPages.musicDuo.cta),
        faqItems: sanitizeLandingFaqItems(content.landingPages?.musicDuo?.faqItems, siteContent.landingPages.musicDuo.faqItems),
        priorityCities: sanitizeTextList(content.landingPages?.musicDuo?.priorityCities, siteContent.landingPages.musicDuo.priorityCities),
        localProofItems: sanitizeTextList(content.landingPages?.musicDuo?.localProofItems, siteContent.landingPages.musicDuo.localProofItems),
        localFaqItems: sanitizeLandingFaqItems(content.landingPages?.musicDuo?.localFaqItems, siteContent.landingPages.musicDuo.localFaqItems),
        localLinkHref: sanitizeOptionalHref(content.landingPages?.musicDuo?.localLinkHref, siteContent.landingPages.musicDuo.localLinkHref ?? "")
      },
      theaterConcert: {
        ...siteContent.landingPages.theaterConcert,
        ...content.landingPages?.theaterConcert,
        cta: sanitizeLandingCta(content.landingPages?.theaterConcert?.cta, siteContent.landingPages.theaterConcert.cta),
        faqItems: sanitizeLandingFaqItems(content.landingPages?.theaterConcert?.faqItems, siteContent.landingPages.theaterConcert.faqItems),
        priorityCities: sanitizeTextList(content.landingPages?.theaterConcert?.priorityCities, siteContent.landingPages.theaterConcert.priorityCities),
        localProofItems: sanitizeTextList(content.landingPages?.theaterConcert?.localProofItems, siteContent.landingPages.theaterConcert.localProofItems),
        localFaqItems: sanitizeLandingFaqItems(content.landingPages?.theaterConcert?.localFaqItems, siteContent.landingPages.theaterConcert.localFaqItems),
        localLinkHref: sanitizeOptionalHref(content.landingPages?.theaterConcert?.localLinkHref, siteContent.landingPages.theaterConcert.localLinkHref ?? "")
      },
      kampvuur: {
        ...siteContent.landingPages.kampvuur,
        ...content.landingPages?.kampvuur,
        cta: sanitizeLandingCta(content.landingPages?.kampvuur?.cta, siteContent.landingPages.kampvuur.cta),
        faqItems: sanitizeLandingFaqItems(content.landingPages?.kampvuur?.faqItems, siteContent.landingPages.kampvuur.faqItems)
      },
      huiskamerconcert: {
        ...siteContent.landingPages.huiskamerconcert,
        ...content.landingPages?.huiskamerconcert,
        cta: sanitizeLandingCta(content.landingPages?.huiskamerconcert?.cta, siteContent.landingPages.huiskamerconcert.cta),
        faqItems: sanitizeLandingFaqItems(content.landingPages?.huiskamerconcert?.faqItems, siteContent.landingPages.huiskamerconcert.faqItems),
        priorityCities: sanitizeTextList(content.landingPages?.huiskamerconcert?.priorityCities, siteContent.landingPages.huiskamerconcert.priorityCities),
        localProofItems: sanitizeTextList(content.landingPages?.huiskamerconcert?.localProofItems, siteContent.landingPages.huiskamerconcert.localProofItems),
        localFaqItems: sanitizeLandingFaqItems(content.landingPages?.huiskamerconcert?.localFaqItems, siteContent.landingPages.huiskamerconcert.localFaqItems),
        localLinkHref: sanitizeOptionalHref(content.landingPages?.huiskamerconcert?.localLinkHref, siteContent.landingPages.huiskamerconcert.localLinkHref ?? "")
      },
      press: {
        ...siteContent.landingPages.press,
        ...content.landingPages?.press,
        cta: sanitizeLandingCta(content.landingPages?.press?.cta, siteContent.landingPages.press.cta),
        faqItems: sanitizeLandingFaqItems(content.landingPages?.press?.faqItems, siteContent.landingPages.press.faqItems)
      }
    },
    contact: {
      ...siteContent.contact,
      ...content.contact,
      ...(fallbackMailTemplates
        ? {
            emailTemplates: {
              admin: {
                ...fallbackMailTemplates.admin,
                ...(content.contact.emailTemplates?.admin ?? {})
              },
              sender: {
                ...fallbackMailTemplates.sender,
                ...(content.contact.emailTemplates?.sender ?? {})
              }
            }
          }
        : {})
    },
    footer: {
      ...siteContent.footer,
      ...content.footer,
      copyright: content.footer.copyright?.trim() ?? siteContent.footer.copyright,
      youtubeHref: sanitizeOptionalHref(content.footer.youtubeHref, siteContent.footer.youtubeHref ?? ""),
      instagramHref: sanitizeOptionalHref(content.footer.instagramHref, siteContent.footer.instagramHref ?? "")
    }
  };
}
