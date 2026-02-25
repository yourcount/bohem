import { AboutSection } from "@/components/sections/AboutSection";
import { BookingsSection } from "@/components/sections/BookingsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { DiscographySection } from "@/components/sections/DiscographySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MusicExperienceSection } from "@/components/sections/MusicExperienceSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { MobileStickyCta } from "@/components/ui/MobileStickyCta";
import { StickyListenBar } from "@/components/ui/StickyListenBar";
import { siteContent } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Ga direct naar inhoud
      </a>

      <SiteHeader brandName={siteContent.brand.name} navigation={siteContent.navigation} />

      <main id="main-content">
        <HeroSection hero={siteContent.hero} />
        <AboutSection about={siteContent.about} />
        <DiscographySection discography={siteContent.discography} />
        <MusicExperienceSection musicExperience={siteContent.musicExperience} />
        <BookingsSection bookings={siteContent.bookings} />
        <ContactSection contact={siteContent.contact} />
      </main>
      <StickyListenBar
        sectionId="discografie"
        contactId="contact"
        trackTitle={siteContent.discography.featuredSingle.title}
        trackHref={siteContent.discography.featuredSingle.href}
        artistHref={siteContent.discography.artist.href}
      />
      <MobileStickyCta href="#boekingen" label="Boek Bohèm" />

      <SiteFooter footer={siteContent.footer} />
    </>
  );
}
