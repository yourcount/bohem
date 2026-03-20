import type { Metadata } from "next";

import { LandingCtaBand } from "@/components/landing/LandingCtaBand";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHighlights } from "@/components/landing/LandingHighlights";
import { LandingLocalArea } from "@/components/landing/LandingLocalArea";
import { LandingPracticalInfo } from "@/components/landing/LandingPracticalInfo";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import {
  buildCulturalEventLanding,
  buildHuiskamerConcertLanding,
  buildKampvuurLanding,
  buildListeningConcertLanding,
  buildLiveMusicLanding,
  buildMusicDuoLanding,
  buildPersLanding,
  buildTeamEveningLanding,
  buildTheaterConcertLanding,
  type LandingRouteView
} from "@/components/landing/landing-content";
import { LandingPageShell } from "@/components/landing/LandingPageShell";
import { KampvuurSection } from "@/components/sections/KampvuurSection";
import { ShowsSection } from "@/components/sections/ShowsSection";
import { SectionMotifDivider } from "@/components/ui/SectionMotifDivider";
import { StickyListenBar } from "@/components/ui/StickyListenBar";
import { getLiveSiteContent } from "@/lib/content/live-content";
import { filterFutureShows } from "@/lib/content/shows";
import { buildLandingMetadata } from "@/lib/landing-page-seo";
import { buildLandingJsonLd } from "@/lib/seo";
import { getSeoSettingsSafe } from "@/lib/seo-settings";
import { getFeatureFlagsSafe } from "@/lib/system/feature-flags";
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
    case "liveMusic":
      return buildLiveMusicLanding(siteContent);
    case "teamEvening":
      return buildTeamEveningLanding(siteContent);
    case "culturalEvent":
      return buildCulturalEventLanding(siteContent);
    case "listeningConcert":
      return buildListeningConcertLanding(siteContent);
    case "press":
      return buildPersLanding(siteContent);
    default:
      return buildMusicDuoLanding(siteContent);
  }
}

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function getStickyLandingSectionIds(landingKey: LandingPageKey, options: { hasHighlights: boolean; hasShows: boolean; hasLocalArea: boolean }) {
  const ids: string[] = [];

  if (options.hasHighlights) ids.push("highlights");

  if (landingKey === "musicDuo" || landingKey === "theaterConcert") {
    if (options.hasShows) ids.push("shows");
  }

  if (landingKey === "liveMusic" && options.hasShows) {
    ids.push("shows");
  }

  if (landingKey === "huiskamerconcert" && options.hasLocalArea) {
    ids.push("regio");
  }

  if (landingKey === "musicDuo" && options.hasLocalArea) {
    ids.push("regio");
  }

  if (landingKey === "kampvuur") {
    ids.push("kampvuurklanken");
  }

  return ids;
}

export async function generateLandingMetadata(landingKey: LandingPageKey): Promise<Metadata> {
  const siteContent = await getLiveSiteContent();
  const seoSettings = await getSeoSettingsSafe();
  return buildLandingMetadata(siteContent, landingKey, seoSettings);
}

export async function renderLandingPage(landingKey: LandingPageKey) {
  const siteContent = await getLiveSiteContent();
  const flags = await getFeatureFlagsSafe();
  const jsonLd = buildLandingJsonLd(siteContent, landingKey);
  const view = getLandingRouteView(siteContent, landingKey);
  const visibleShows = filterFutureShows(siteContent.bookings.upcomingShows);
  const showLandingShows =
    (landingKey === "musicDuo" || landingKey === "theaterConcert" || landingKey === "huiskamerconcert" || landingKey === "liveMusic") &&
    visibleShows.length > 0 &&
    view.shows;
  const stickyVisibleSectionIds =
    flags.enable_sticky_listen_bar &&
    landingKey !== "press" &&
    hasText(siteContent.discography.featuredSingle.title) &&
    hasText(siteContent.discography.featuredSingle.href)
        ? getStickyLandingSectionIds(landingKey, {
          hasHighlights: Boolean(view.highlights),
          hasShows: Boolean(showLandingShows),
          hasLocalArea: Boolean(view.localArea)
        })
      : [];
  const showStickyListenBar = stickyVisibleSectionIds.length > 0;
  const highlightSection = view.highlights ? (
    <>
      <SectionMotifDivider />
      <LandingHighlights
        id="highlights"
        eyebrow={view.highlights.eyebrow}
        title={view.highlights.title}
        intro={view.highlights.intro}
        items={view.highlights.items}
        variant={view.highlights.variant}
      />
    </>
  ) : null;
  const kampvuurExperienceSection = landingKey === "kampvuur" ? (
    <>
      <SectionMotifDivider />
      <KampvuurSection kampvuur={siteContent.kampvuur} />
    </>
  ) : null;
  const showsSection = showLandingShows ? (
    <>
      <SectionMotifDivider />
      <ShowsSection
        shows={visibleShows}
        eyebrow={view.shows?.eyebrow}
        title={view.shows?.title}
        badgeLabel={view.shows?.badgeLabel}
      />
    </>
  ) : null;
  const localAreaSection = view.localArea ? (
    <>
      <SectionMotifDivider />
      <LandingLocalArea
        id="regio"
        title={view.localArea.title}
        intro={view.localArea.intro}
        cities={view.localArea.cities}
        proofTitle={view.localArea.proofTitle}
        proofItems={view.localArea.proofItems}
        cta={view.localArea.cta}
      />
    </>
  ) : null;
  const socialProofSection = view.socialProof ? (
    <>
      <SectionMotifDivider />
      <LandingSocialProof
        id="reacties"
        eyebrow={view.socialProof.eyebrow}
        title={view.socialProof.title}
        items={view.socialProof.items}
      />
    </>
  ) : null;
  const practicalInfoSection = view.practicalInfo ? (
    <>
      <SectionMotifDivider />
      <LandingPracticalInfo
        id="praktisch"
        eyebrow={view.practicalInfo.eyebrow}
        title={view.practicalInfo.title}
        items={view.practicalInfo.items}
        variant={view.practicalInfo.variant}
      />
    </>
  ) : null;
  const faqSection = view.faq ? (
    <>
      <SectionMotifDivider />
      <LandingFaq id="faq" eyebrow={view.faq.eyebrow} title={view.faq.title} items={view.faq.items} />
    </>
  ) : null;

  return (
    <LandingPageShell brandName={siteContent.brand.name} navigation={view.navigation} footer={siteContent.footer}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <LandingHero
        id="intro"
        eyebrow={view.intro.eyebrow}
        audienceLabel={view.intro.audienceLabel}
        title={view.intro.title}
        intro={view.intro.intro}
        note={view.intro.note}
        listenCue={view.intro.listenCue}
        quickPanel={view.intro.quickPanel}
        image={view.intro.image}
        primaryCta={view.intro.primaryCta}
        secondaryCta={view.intro.secondaryCta}
      />

      {landingKey === "musicDuo" ? (
        <>
          {highlightSection}
          {showsSection}
          {socialProofSection}
          {practicalInfoSection}
          {localAreaSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "theaterConcert" ? (
        <>
          {highlightSection}
          {practicalInfoSection}
          {showsSection}
          {socialProofSection}
          {localAreaSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "kampvuur" ? (
        <>
          {highlightSection}
          {kampvuurExperienceSection}
          {practicalInfoSection}
          {socialProofSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "huiskamerconcert" ? (
        <>
          {highlightSection}
          {practicalInfoSection}
          {localAreaSection}
          {socialProofSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "liveMusic" ? (
        <>
          {highlightSection}
          {showsSection}
          {practicalInfoSection}
          {socialProofSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "teamEvening" ? (
        <>
          {highlightSection}
          {practicalInfoSection}
          {socialProofSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "culturalEvent" ? (
        <>
          {highlightSection}
          {practicalInfoSection}
          {socialProofSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "listeningConcert" ? (
        <>
          {highlightSection}
          {practicalInfoSection}
          {socialProofSection}
          {faqSection}
        </>
      ) : null}

      {landingKey === "press" ? (
        <>
          {practicalInfoSection}
          {highlightSection}
          {socialProofSection}
          {faqSection}
        </>
      ) : null}

      <SectionMotifDivider />

      <LandingCtaBand
        id="contact"
        eyebrow={view.cta.eyebrow}
        title={view.cta.title}
        body={view.cta.body}
        proofIntro={view.cta.proofIntro}
        proofItems={view.cta.proofItems}
        primaryCta={view.cta.primaryCta}
        secondaryCta={view.cta.secondaryCta}
        homeLink={landingKey === "press" ? undefined : {
          intro: "Wil je Bohèm eerst als geheel leren kennen, met muziek, achtergrond, shows en contact op één plek?",
          label: "Bekijk de volledige homepagina",
          href: "/"
        }}
      />

      {showStickyListenBar ? (
        <StickyListenBar
          visibleSectionIds={stickyVisibleSectionIds}
          hiddenSectionIds={["contact"]}
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
    </LandingPageShell>
  );
}
