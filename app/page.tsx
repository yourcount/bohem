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
import { siteContent } from "@/lib/content";
import { buildHomeJsonLd } from "@/lib/seo";

export default function HomePage() {
  const jsonLd = buildHomeJsonLd(siteContent);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScrollExperience />

      <a href="#main-content" className="skip-link">
        Ga direct naar inhoud
      </a>

      <SiteHeader brandName={siteContent.brand.name} navigation={siteContent.navigation} />

      <main id="main-content">
        <HeroSection hero={siteContent.hero} />
        <AboutSection about={siteContent.about} />
        <DiscographySection discography={siteContent.discography} />
        <MusicExperienceSection musicExperience={siteContent.musicExperience} />
        <KampvuurSection kampvuur={siteContent.kampvuur} />
        <BookingsSection bookings={siteContent.bookings} />
        <ContactSection contact={siteContent.contact} />
      </main>
      <StickyListenBar
        visibleSectionIds={["bio", "discografie"]}
        trackTitle={siteContent.discography.featuredSingle.title}
        trackHref={siteContent.discography.featuredSingle.href}
      />
      <MobileStickyCta href="#boekingen" label="Boek Bohèm" visibleSectionIds={["bio", "discografie"]} />

      <SiteFooter footer={siteContent.footer} />
    </>
  );
}
