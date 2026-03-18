import type { Metadata } from "next";

import { AboutSection } from "@/components/sections/AboutSection";
import { BookingsSection } from "@/components/sections/BookingsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { DiscographySection } from "@/components/sections/DiscographySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { KampvuurSection } from "@/components/sections/KampvuurSection";
import { MusicExperienceSection } from "@/components/sections/MusicExperienceSection";
import { RouteChooserSection } from "@/components/sections/RouteChooserSection";
import { ShowsSection } from "@/components/sections/ShowsSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { MobileStickyCta } from "@/components/ui/MobileStickyCta";
import { ScrollExperience } from "@/components/ui/ScrollExperience";
import { SectionMotifDivider } from "@/components/ui/SectionMotifDivider";
import { StickyListenBar } from "@/components/ui/StickyListenBar";
import { ensureShowsNavigationItem } from "@/lib/content/navigation";
import { getLiveSiteContent } from "@/lib/content/live-content";
import { filterFutureShows } from "@/lib/content/shows";
import { getSeoSettingsSafe, resolveHomeJsonLd, resolveHomeSeo } from "@/lib/seo-settings";
import { getFeatureFlagsSafe } from "@/lib/system/feature-flags";

export const revalidate = 90;

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getLiveSiteContent();
  const seoSettings = await getSeoSettingsSafe();
  const resolvedSeo = resolveHomeSeo(siteContent, seoSettings);

  return {
    title: resolvedSeo.title,
    description: resolvedSeo.description,
    keywords: [
      "Bohèm",
      "muziekduo boeken",
      "live muziek boekingen",
      "theater muziekduo",
      "Nederlandstalige muziek",
      "Kampvuurklanken",
      "Arthur Bont",
      "Bettina Kraaieveld"
    ],
    alternates: {
      canonical: resolvedSeo.canonical
    },
    robots: {
      index: resolvedSeo.robotsIndex,
      follow: resolvedSeo.robotsFollow,
      googleBot: {
        index: resolvedSeo.robotsIndex,
        follow: resolvedSeo.robotsFollow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    openGraph: {
      type: "website",
      locale: "nl_NL",
      url: resolvedSeo.canonical,
      siteName: "Bohèm",
      title: resolvedSeo.ogTitle,
      description: resolvedSeo.ogDescription,
      images: [
        {
          url: siteContent.hero.image.src,
          width: 1536,
          height: 864,
          alt: siteContent.hero.image.alt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedSeo.ogTitle,
      description: resolvedSeo.ogDescription,
      images: [siteContent.hero.image.src]
    }
  };
}

const NON_CONTENT_KEYS = new Set(["href", "variant", "id", "type", "autoComplete", "required", "width", "height", "focusX", "focusY"]);
function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasSectionContent(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasSectionContent(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([entryKey, entryValue]) => {
      if (NON_CONTENT_KEYS.has(entryKey)) return false;
      return hasSectionContent(entryValue);
    });
  }

  return false;
}

export default async function HomePage() {
  const siteContent = await getLiveSiteContent();
  const visibleUpcomingShows = filterFutureShows(siteContent.bookings.upcomingShows);
  const flags = await getFeatureFlagsSafe();
  const seoSettings = await getSeoSettingsSafe();
  const jsonLd = resolveHomeJsonLd(siteContent, seoSettings);
  const hasAboutSection = hasSectionContent(siteContent.about);
  const hasDiscographySection = flags.enable_discography_section && hasSectionContent(siteContent.discography);
  const hasMusicExperienceSection = hasSectionContent(siteContent.musicExperience);
  const hasShows = visibleUpcomingShows.length > 0;
  const hasKampvuurSection = flags.enable_kampvuur_section && hasSectionContent(siteContent.kampvuur);
  const hasBookingsSection = hasSectionContent(siteContent.bookings);
  const hasContactSection = hasSectionContent(siteContent.contact);
  const hasPressSection = hasBookingsSection && hasSectionContent(siteContent.bookings.press ?? null);

  const baseNavigation = siteContent.navigation.filter((item) => {
    if (!hasText(item.label) || !hasText(item.href)) return false;
    if (item.href === "#bio") return hasAboutSection;
    if (item.href === "#discografie") return hasDiscographySection;
    if (item.href === "#muziek") return hasMusicExperienceSection;
    if (item.href === "#shows") return hasShows;
    if (item.href === "#kampvuurklanken") return hasKampvuurSection;
    if (item.href === "#boekingen") return hasBookingsSection;
    if (item.href === "#pers") return hasPressSection;
    if (item.href === "#contact") return hasContactSection;
    return true;
  });

  const navigation = ensureShowsNavigationItem(baseNavigation, { hasShows });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScrollExperience />

      <a href="#main-content" className="skip-link">
        Ga direct naar inhoud
      </a>

      <SiteHeader brandName={siteContent.brand.name} navigation={navigation} />

      <main id="main-content">
        <HeroSection hero={siteContent.hero} />
        <RouteChooserSection title={siteContent.bookings.routeTitle} items={siteContent.bookings.routeItems} />
        <SectionMotifDivider />
        {hasAboutSection ? (
          <>
            <AboutSection about={siteContent.about} />
            <SectionMotifDivider />
          </>
        ) : null}
        {hasDiscographySection ? (
          <>
            <DiscographySection discography={siteContent.discography} />
            <SectionMotifDivider />
          </>
        ) : null}
        {hasMusicExperienceSection ? (
          <>
            <MusicExperienceSection musicExperience={siteContent.musicExperience} />
            <SectionMotifDivider />
          </>
        ) : null}
        {hasShows ? (
          <ShowsSection
            shows={visibleUpcomingShows}
            eyebrow={siteContent.bookings.showsEyebrow}
            title={siteContent.bookings.showsTitle}
            badgeLabel={siteContent.bookings.showsBadgeLabel}
          />
        ) : null}
        {hasShows ? <SectionMotifDivider /> : null}
        {hasKampvuurSection ? <KampvuurSection kampvuur={siteContent.kampvuur} /> : null}
        {hasKampvuurSection ? <SectionMotifDivider /> : null}
        {hasBookingsSection ? <BookingsSection bookings={siteContent.bookings} /> : null}
        {hasBookingsSection ? <SectionMotifDivider /> : null}
        {hasContactSection ? <ContactSection contact={siteContent.contact} /> : null}
      </main>
      {flags.enable_sticky_listen_bar && hasDiscographySection && hasSectionContent(siteContent.discography.featuredSingle) ? (
        <StickyListenBar
          visibleSectionIds={["bio", "discografie"]}
          eyebrow={siteContent.discography.featuredSingleEyebrow || "Nu luisteren"}
          trackTitle={siteContent.discography.featuredSingle.title}
          trackHref={siteContent.discography.featuredSingle.href}
          ctaLabel={siteContent.discography.featuredSingle.ctaLabel || "Speel op Spotify"}
          artworkSrc={siteContent.discography.featuredSingle.image?.src || "/images/music/vroeger-cover.webp"}
          artworkAlt={siteContent.discography.featuredSingle.image?.alt || siteContent.discography.featuredSingle.title}
          artworkFocusX={siteContent.discography.featuredSingle.image?.focusX}
          artworkFocusY={siteContent.discography.featuredSingle.image?.focusY}
        />
      ) : null}
      {flags.enable_mobile_sticky_cta && hasBookingsSection && hasText(siteContent.bookings.cta.label) && hasText(siteContent.bookings.cta.href) ? (
        <MobileStickyCta
          href={siteContent.bookings.cta.href}
          label={siteContent.bookings.cta.label}
          visibleSectionIds={["bio", "discografie"]}
        />
      ) : null}

      <SiteFooter footer={siteContent.footer} />
    </>
  );
}
