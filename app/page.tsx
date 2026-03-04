import { AboutSection } from "@/components/sections/AboutSection";
import { BookingsSection } from "@/components/sections/BookingsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { DiscographySection } from "@/components/sections/DiscographySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { KampvuurSection } from "@/components/sections/KampvuurSection";
import { MusicExperienceSection } from "@/components/sections/MusicExperienceSection";
import { ShowsSection } from "@/components/sections/ShowsSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { MobileStickyCta } from "@/components/ui/MobileStickyCta";
import { ScrollExperience } from "@/components/ui/ScrollExperience";
import { SectionMotifDivider } from "@/components/ui/SectionMotifDivider";
import { StickyListenBar } from "@/components/ui/StickyListenBar";
import { getLiveSiteContent } from "@/lib/content/live-content";
import { getSeoSettingsSafe, resolveHomeJsonLd } from "@/lib/seo-settings";
import { getFeatureFlagsSafe } from "@/lib/system/feature-flags";

export const dynamic = "force-dynamic";

const NON_CONTENT_KEYS = new Set(["href", "variant", "id", "type", "autoComplete", "required", "width", "height"]);

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
  const flags = getFeatureFlagsSafe();
  const seoSettings = getSeoSettingsSafe();
  const jsonLd = resolveHomeJsonLd(siteContent, seoSettings);
  const hasAboutSection = hasSectionContent(siteContent.about);
  const hasDiscographySection = flags.enable_discography_section && hasSectionContent(siteContent.discography);
  const hasMusicExperienceSection = hasSectionContent(siteContent.musicExperience);
  const hasShows = (siteContent.bookings.upcomingShows?.length ?? 0) > 0;
  const hasKampvuurSection = flags.enable_kampvuur_section && hasSectionContent(siteContent.kampvuur);
  const hasBookingsSection = hasSectionContent(siteContent.bookings);
  const hasContactSection = hasSectionContent(siteContent.contact);
  const hasPressSection = hasBookingsSection && hasSectionContent(siteContent.bookings.press ?? null);

  const baseNavigation = siteContent.navigation.filter((item) => {
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

  const hasShowsNav = baseNavigation.some((item) => item.href === "#shows");
  const navigation =
    hasShows && !hasShowsNav
      ? (() => {
          const next = [...baseNavigation];
          const musicIndex = next.findIndex((item) => item.href === "#muziek");
          const campfireIndex = next.findIndex((item) => item.href === "#kampvuurklanken");
          const bookingIndex = next.findIndex((item) => item.href === "#boekingen");

          let insertIndex = next.length;
          if (musicIndex >= 0) {
            insertIndex = musicIndex + 1;
          } else if (campfireIndex >= 0) {
            insertIndex = campfireIndex;
          } else if (bookingIndex >= 0) {
            insertIndex = bookingIndex;
          }

          next.splice(insertIndex, 0, { label: "Shows", href: "#shows" });
          return next;
        })()
      : baseNavigation;

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
            shows={siteContent.bookings.upcomingShows ?? []}
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
          trackTitle={siteContent.discography.featuredSingle.title}
          trackHref={siteContent.discography.featuredSingle.href}
        />
      ) : null}
      {flags.enable_mobile_sticky_cta && hasBookingsSection ? (
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
