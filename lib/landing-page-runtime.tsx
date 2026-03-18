import type { Metadata } from "next";

import { LandingCtaBand } from "@/components/landing/LandingCtaBand";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHighlights } from "@/components/landing/LandingHighlights";
import { LandingLocalArea } from "@/components/landing/LandingLocalArea";
import {
  buildHuiskamerConcertLanding,
  buildKampvuurLanding,
  buildMusicDuoLanding,
  buildPersLanding,
  buildTheaterConcertLanding,
  type LandingRouteView
} from "@/components/landing/landing-content";
import { LandingPageShell } from "@/components/landing/LandingPageShell";
import { KampvuurSection } from "@/components/sections/KampvuurSection";
import { ShowsSection } from "@/components/sections/ShowsSection";
import { SectionMotifDivider } from "@/components/ui/SectionMotifDivider";
import { getLiveSiteContent } from "@/lib/content/live-content";
import { filterFutureShows } from "@/lib/content/shows";
import { buildLandingMetadata } from "@/lib/landing-page-seo";
import { buildLandingJsonLd } from "@/lib/seo";
import { getSeoSettingsSafe } from "@/lib/seo-settings";
import type { SiteContent } from "@/lib/types";
import { type LandingPageKey } from "@/lib/content/landing-pages";

function getLandingRouteView(siteContent: SiteContent, landingKey: LandingPageKey): LandingRouteView {
  switch (landingKey) {
    case "musicDuo":
      return buildMusicDuoLanding(siteContent);
    case "theaterConcert":
      return buildTheaterConcertLanding(siteContent);
    case "kampvuur":
      return buildKampvuurLanding(siteContent);
    case "huiskamerconcert":
      return buildHuiskamerConcertLanding(siteContent);
    case "press":
      return buildPersLanding(siteContent);
    default:
      return buildMusicDuoLanding(siteContent);
  }
}

export async function generateLandingMetadata(landingKey: LandingPageKey): Promise<Metadata> {
  const siteContent = await getLiveSiteContent();
  const seoSettings = await getSeoSettingsSafe();
  return buildLandingMetadata(siteContent, landingKey, seoSettings);
}

export async function renderLandingPage(landingKey: LandingPageKey) {
  const siteContent = await getLiveSiteContent();
  const jsonLd = buildLandingJsonLd(siteContent, landingKey);
  const view = getLandingRouteView(siteContent, landingKey);
  const visibleShows = filterFutureShows(siteContent.bookings.upcomingShows);
  const showLandingShows =
    (landingKey === "musicDuo" || landingKey === "theaterConcert" || landingKey === "huiskamerconcert") &&
    visibleShows.length > 0 &&
    view.shows;

  return (
    <LandingPageShell brandName={siteContent.brand.name} navigation={view.navigation} footer={siteContent.footer}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <LandingHero
        id="intro"
        eyebrow={view.intro.eyebrow}
        title={view.intro.title}
        intro={view.intro.intro}
        note={view.intro.note}
        image={view.intro.image}
        primaryCta={view.intro.primaryCta}
        secondaryCta={view.intro.secondaryCta}
      />

      {view.highlights ? <SectionMotifDivider /> : null}
      {view.highlights ? (
        <LandingHighlights
          id="highlights"
          eyebrow={view.highlights.eyebrow}
          title={view.highlights.title}
          intro={view.highlights.intro}
          items={view.highlights.items}
        />
      ) : null}

      {landingKey === "kampvuur" ? <SectionMotifDivider /> : null}
      {landingKey === "kampvuur" ? <KampvuurSection kampvuur={siteContent.kampvuur} /> : null}

      {showLandingShows ? <SectionMotifDivider /> : null}
      {showLandingShows ? (
        <ShowsSection
          shows={visibleShows}
          eyebrow={view.shows?.eyebrow}
          title={view.shows?.title}
          badgeLabel={view.shows?.badgeLabel}
        />
      ) : null}

      {view.localArea ? <SectionMotifDivider /> : null}
      {view.localArea ? (
        <LandingLocalArea
          id="regio"
          title={view.localArea.title}
          intro={view.localArea.intro}
          cities={view.localArea.cities}
          proofTitle={view.localArea.proofTitle}
          proofItems={view.localArea.proofItems}
          cta={view.localArea.cta}
        />
      ) : null}

      {view.faq ? <SectionMotifDivider /> : null}
      {view.faq ? <LandingFaq id="faq" eyebrow={view.faq.eyebrow} title={view.faq.title} items={view.faq.items} /> : null}

      <SectionMotifDivider />

      <LandingCtaBand
        id="contact"
        eyebrow={view.cta.eyebrow}
        title={view.cta.title}
        body={view.cta.body}
        primaryCta={view.cta.primaryCta}
        secondaryCta={view.cta.secondaryCta}
      />
    </LandingPageShell>
  );
}
