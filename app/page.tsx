import { AboutSection } from "@/components/sections/AboutSection";
import { BookingsSection } from "@/components/sections/BookingsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { DiscographySection } from "@/components/sections/DiscographySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { KampvuurSection } from "@/components/sections/KampvuurSection";
import { MusicExperienceSection } from "@/components/sections/MusicExperienceSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { MobileStickyCta } from "@/components/ui/MobileStickyCta";
import { ScrollExperience } from "@/components/ui/ScrollExperience";
import { StickyListenBar } from "@/components/ui/StickyListenBar";
import { getLiveSiteContent } from "@/lib/content/live-content";
import { getSeoSettingsSafe, resolveHomeJsonLd } from "@/lib/seo-settings";
import { getFeatureFlagsSafe } from "@/lib/system/feature-flags";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const siteContent = getLiveSiteContent();
  const flags = getFeatureFlagsSafe();
  const seoSettings = getSeoSettingsSafe();
  const jsonLd = resolveHomeJsonLd(siteContent, seoSettings);
  const navigation = siteContent.navigation.filter((item) => {
    if (item.href === "#discografie") return flags.enable_discography_section;
    if (item.href === "#kampvuurklanken") return flags.enable_kampvuur_section;
    return true;
  });

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
        <AboutSection about={siteContent.about} />
        {flags.enable_discography_section ? <DiscographySection discography={siteContent.discography} /> : null}
        <MusicExperienceSection musicExperience={siteContent.musicExperience} />
        {flags.enable_kampvuur_section ? <KampvuurSection kampvuur={siteContent.kampvuur} /> : null}
        <BookingsSection bookings={siteContent.bookings} />
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
