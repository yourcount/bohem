import { AboutSection } from "@/components/sections/AboutSection";
import { BookingsSection } from "@/components/sections/BookingsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { DiscographySection } from "@/components/sections/DiscographySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MusicExperienceSection } from "@/components/sections/MusicExperienceSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
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

      <SiteFooter footer={siteContent.footer} />
    </>
  );
}
