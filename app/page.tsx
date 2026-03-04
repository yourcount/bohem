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

export default async function HomePage() {
  const siteContent = await getLiveSiteContent();
  const flags = getFeatureFlagsSafe();
  const seoSettings = getSeoSettingsSafe();
  const jsonLd = resolveHomeJsonLd(siteContent, seoSettings);
  const baseNavigation = siteContent.navigation.filter((item) => {
    if (item.href === "#discografie") return flags.enable_discography_section;
    if (item.href === "#kampvuurklanken") return flags.enable_kampvuur_section;
    return true;
  });
  const hasShows = (siteContent.bookings.upcomingShows?.length ?? 0) > 0;
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
        <AboutSection about={siteContent.about} />
        <SectionMotifDivider />
        {flags.enable_discography_section ? <DiscographySection discography={siteContent.discography} /> : null}
        <SectionMotifDivider />
        <MusicExperienceSection musicExperience={siteContent.musicExperience} />
        <SectionMotifDivider />
        {hasShows ? <ShowsSection shows={siteContent.bookings.upcomingShows ?? []} /> : null}
        {hasShows ? <SectionMotifDivider /> : null}
        {flags.enable_kampvuur_section ? <KampvuurSection kampvuur={siteContent.kampvuur} /> : null}
        {flags.enable_kampvuur_section ? <SectionMotifDivider /> : null}
        <BookingsSection bookings={siteContent.bookings} />
        <SectionMotifDivider />
        <ContactSection contact={siteContent.contact} />
      </main>
      {flags.enable_sticky_listen_bar ? (
        <StickyListenBar
          visibleSectionIds={["bio", "discografie"]}
          trackTitle={siteContent.discography.featuredSingle.title}
          trackHref={siteContent.discography.featuredSingle.href}
        />
      ) : null}
      {flags.enable_mobile_sticky_cta ? (
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
