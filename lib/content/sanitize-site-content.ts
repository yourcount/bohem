import { siteContent } from "@/lib/content";
import type { SiteContent } from "@/lib/types";

function isValidAbsoluteHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

function isValidHref(href: string) {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith("#")) return true;
  if (value.startsWith("/")) return !value.startsWith("//");
  if (value.startsWith("mailto:")) return value.length > "mailto:".length;
  if (value.startsWith("tel:")) return value.length > "tel:".length;
  return isValidAbsoluteHttpUrl(value);
}

function sanitizeHref(href: string, fallback: string) {
  return isValidHref(href) ? href.trim() : fallback;
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
        ...content.discography.featuredSingle,
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
      ...content.bookings,
      cta: {
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
      ...(Array.isArray(content.bookings.upcomingShows) && content.bookings.upcomingShows.length > 0
        ? {
            upcomingShows: content.bookings.upcomingShows.map((show, index) => ({
              ...show,
              ctaHref: sanitizeHref(show.ctaHref, siteContent.bookings.upcomingShows?.[index]?.ctaHref ?? "#contact")
            }))
          }
        : {}),
      ...(content.bookings.press
        ? {
            press: {
              ...content.bookings.press,
              kitHref: sanitizeHref(content.bookings.press.kitHref, siteContent.bookings.press?.kitHref ?? "/")
            }
          }
        : {})
    }
  };
}
