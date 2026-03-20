import type { LandingExtraSection, LandingHighlightItem, LandingSocialProofItem, NavItem, SiteContent } from "@/lib/types";
import type { LandingHighlightsVariant } from "@/components/landing/LandingHighlights";
import { filterFutureShows } from "@/lib/content/shows";
import { getLandingFaqItems, getLandingPageContent } from "@/lib/content/landing-pages";

export type LandingRouteView = {
  navigation: NavItem[];
  intro: {
    eyebrow?: string;
    audienceLabel?: string;
    title: string;
    intro: string;
    note?: string;
    listenCue?: {
      intro: string;
      ctaLabel: string;
      href: string;
    };
    quickPanel?: {
      title: string;
      items?: string[];
      primaryCta?: { label: string; href: string; variant?: "primary" | "secondary" };
      secondaryCta?: { label: string; href: string; variant?: "primary" | "secondary" };
    };
    image?: SiteContent["hero"]["image"] | SiteContent["musicExperience"]["image"] | SiteContent["kampvuur"]["image"];
    primaryCta: { label: string; href: string; variant?: "primary" | "secondary" };
    secondaryCta?: { label: string; href: string; variant?: "primary" | "secondary" };
  };
  highlights?: {
    eyebrow?: string;
    title: string;
    intro?: string;
    items: LandingHighlightItem[];
    variant?: LandingHighlightsVariant;
  };
  localArea?: {
    title: string;
    intro?: string;
    cities: string[];
    proofTitle?: string;
    proofItems: string[];
    cta?: { label: string; href: string; variant?: "primary" | "secondary" };
  };
  socialProof?: {
    eyebrow?: string;
    title: string;
    items: LandingSocialProofItem[];
  };
  practicalInfo?: {
    eyebrow?: string;
    title: string;
    items: string[];
    variant?: "grid" | "facts" | "chips";
  };
  faq?: {
    eyebrow?: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  cta: {
    eyebrow?: string;
    title: string;
    body: string;
    proofIntro?: string;
    proofItems?: string[];
    primaryCta?: { label: string; href: string; variant?: "primary" | "secondary" };
    secondaryCta?: { label: string; href: string; variant?: "primary" | "secondary" };
  };
  shows?: {
    eyebrow?: string;
    title?: string;
    badgeLabel?: string;
  };
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function makeNav(items: Array<[string, string]>): NavItem[] {
  return items.map(([label, href]) => ({ label, href }));
}

function toHighlightItems(items: LandingHighlightItem[] | string[] | undefined): LandingHighlightItem[] {
  if (!items || items.length === 0) return [];

  return items
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: "",
          body: item.trim()
        };
      }

      return {
        title: item.title?.trim() || "",
        body: item.body.trim()
      };
    })
    .filter((item) => hasText(item.body));
}

function toFactItems(items: string[] | undefined): LandingHighlightItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  return items
    .map((item) => {
      const normalized = item.trim();
      if (!normalized) return null;

      const separatorIndex = normalized.indexOf(":");
      if (separatorIndex > 0) {
        return {
          title: normalized.slice(0, separatorIndex).trim(),
          body: normalized.slice(separatorIndex + 1).trim()
        };
      }

      return {
        title: "Kernfeit",
        body: normalized
      };
    })
    .filter((item): item is LandingHighlightItem => Boolean(item && (hasText(item.title) || hasText(item.body))));
}

function limitFaq(items: Array<{ question: string; answer: string }>, fallback: Array<{ question: string; answer: string }>) {
  const source = items.filter((item) => hasText(item.question) && hasText(item.answer));
  return source.length > 0 ? source : fallback;
}

function combineSections(
  highlights: LandingHighlightItem[] | string[] | undefined,
  extraSections: LandingExtraSection[] | undefined,
  proofTitle?: string,
  fitTitle?: string
): LandingHighlightItem[] {
  const items: LandingHighlightItem[] = [];

  if (Array.isArray(highlights)) {
    items.push(...toHighlightItems(highlights));
  }

  if (Array.isArray(extraSections)) {
    items.push(
      ...extraSections
        .filter((item) => hasText(item.title) || hasText(item.body))
        .map((item) => ({
          title: item.title?.trim() || proofTitle || fitTitle || "Extra informatie",
          body: item.body.trim()
        }))
    );
  }

  return items;
}

function buildFaq(
  source: Array<{ question: string; answer: string }> | undefined,
  fallback: Array<{ question: string; answer: string }>,
  title: string
): NonNullable<LandingRouteView["faq"]> {
  return {
    eyebrow: "FAQ",
    title,
    items: limitFaq(source ?? [], fallback)
  };
}

function buildLocalArea(
  title: string | undefined,
  intro: string | undefined,
  cities: string[] | undefined,
  proofTitle: string | undefined,
  proofItems: string[] | undefined,
  cta: { label: string; href: string; variant?: "primary" | "secondary" } | undefined
): LandingRouteView["localArea"] {
  const visibleCities = (cities ?? []).map((city) => city.trim()).filter((city) => city.length > 0);
  const visibleProof = (proofItems ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
  const hasContent =
    hasText(title) ||
    hasText(intro) ||
    visibleCities.length > 0 ||
    hasText(proofTitle) ||
    visibleProof.length > 0 ||
    Boolean(cta && hasText(cta.label) && hasText(cta.href));

  if (!hasContent) return undefined;

  return {
    title: title?.trim() || "Ook te boeken in deze regio",
    intro: intro?.trim(),
    cities: visibleCities,
    proofTitle: proofTitle?.trim(),
    proofItems: visibleProof,
    cta: cta && hasText(cta.label) && hasText(cta.href) ? cta : undefined
  };
}

function buildSocialProof(
  items: LandingSocialProofItem[] | undefined,
  title: string,
  eyebrow?: string
): LandingRouteView["socialProof"] {
  const visibleItems = (items ?? [])
    .map((item) => ({
      quote: item.quote?.trim() || "",
      source: item.source?.trim() || "",
      context: item.context?.trim() || ""
    }))
    .filter((item) => hasText(item.quote));

  if (!hasText(title) || visibleItems.length === 0) return undefined;

  return {
    eyebrow,
    title,
    items: visibleItems
  };
}

function buildPracticalInfo(
  items: string[] | undefined,
  title: string,
  eyebrow?: string,
  variant: "grid" | "facts" | "chips" = "grid"
): LandingRouteView["practicalInfo"] {
  const visibleItems = (items ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
  if (!hasText(title) || visibleItems.length === 0) return undefined;

  return {
    eyebrow,
    title,
    items: visibleItems,
    variant
  };
}

function isDirectContactCta(cta: { href?: string } | undefined) {
  return cta?.href?.trim() === "#contact";
}

function buildListenCue(siteContent: SiteContent, intro: string | undefined): LandingRouteView["intro"]["listenCue"] {
  if (!hasText(siteContent.discography.featuredSingle.href) || !hasText(siteContent.discography.featuredSingle.title)) {
    return undefined;
  }

  return {
    intro: intro?.trim() || "Luister eerst hoe Bohèm in deze setting binnenkomt.",
    ctaLabel: siteContent.discography.featuredSingle.ctaLabel?.trim() || "Luister nu",
    href: siteContent.discography.featuredSingle.href
  };
}

export function buildMusicDuoLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "musicDuo");
  const visibleShows = filterFutureShows(siteContent.bookings.upcomingShows);
  const faq = buildFaq(getLandingFaqItems(siteContent, "musicDuo"), [
    { question: "Voor welke gelegenheden is Bohèm te boeken?", answer: "Bohèm past bij theaters, culturele events en intieme concerten waar luisteren en sfeer belangrijk zijn." },
    { question: "Hoe snel horen we of Bohèm beschikbaar is?", answer: "Na je aanvraag kijken we direct naar de planning en sturen we een heldere reactie terug." }
  ], content.faqTitle || "Veelgestelde vragen over muziekduo boeken");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Past het", "#highlights"],
      ["Shows", "#shows"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Bohèm boeken",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Een avond die dichtbij voelt, muzikaal blijft boeien en zonder afstand gespeeld wordt.",
      listenCue: buildListenCue(siteContent, "Luister alvast hoe Bohèm warmte en aandacht in een avond legt."),
      image: content.image || siteContent.hero.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : hasText(siteContent.discography.featuredSingle.href)
            ? { label: "Luister eerst naar Bohèm", href: siteContent.discography.featuredSingle.href, variant: "primary" }
            : { label: "Bekijk of dit past", href: "#highlights", variant: "primary" },
      secondaryCta: visibleShows.length > 0 ? { label: "Bekijk de shows", href: "#shows", variant: "secondary" } : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Wat je neerzet",
      title: content.positioningTitle || "Waarom dit als avond blijft hangen",
      intro: content.positioningBody || content.intro,
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "split-scenarios"
    },
    socialProof: buildSocialProof(content.socialProofItems, "Wat organisatoren en bezoekers teruggeven", "Reacties"),
    localArea: buildLocalArea(
      content.localAreaTitle,
      content.localAreaIntro,
      content.priorityCities,
      content.localProofTitle,
      content.localProofItems,
      content.localLinkLabel && content.localLinkHref ? { label: content.localLinkLabel, href: content.localLinkHref, variant: "secondary" } : undefined
    ),
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch om te weten", "Praktisch", "facts"),
    faq,
    shows: visibleShows.length > 0 ? {
      eyebrow: siteContent.bookings.showsEyebrow ?? "Live agenda",
      title: siteContent.bookings.showsTitle ?? "Komende shows",
      badgeLabel: siteContent.bookings.showsBadgeLabel ?? "Actueel"
    } : undefined,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Vertel wat voor avond je wilt neerzetten",
      body: content.ctaContextBody || "Stuur een korte vraag, dan kijken we samen naar datum, setting en geschiktheid.",
      proofIntro: content.ctaProofIntro || "Je hoeft nog niet alles vast te hebben liggen om contact op te nemen.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "We stemmen setting, lengte en sfeer vooraf samen af.",
              "Bohèm werkt zowel intiem als op een groter podium overtuigend.",
              "Je krijgt snel duidelijkheid over beschikbaarheid en opzet."
            ],
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: { label: "Bekijk live muziek", href: "/live-muziek-boeken", variant: "secondary" }
    }
  };
}

export function buildTheaterConcertLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "theaterConcert");
  const visibleShows = filterFutureShows(siteContent.bookings.upcomingShows);
  const faq = buildFaq(getLandingFaqItems(siteContent, "theaterConcert"), [
    { question: "Waarom werkt Bohèm in een theater?", answer: "Omdat de muziek ruimte geeft aan tekst, dynamiek en aandacht. Dat past goed bij een luisterpubliek." },
    { question: "Is dit geschikt voor een culturele avond?", answer: "Ja, juist daar komen sfeer, verhaal en live-presentatie goed samen." }
  ], content.faqTitle || "Veelgestelde vragen over theaterconcert boeken");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Voor wie", "#highlights"],
      ["Shows", "#shows"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Theaterconcert boeken",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Voor zalen die een aandachtig programma zoeken dat muzikaal blijft verrassen en als avond goed in elkaar zit.",
      listenCue: buildListenCue(siteContent, "Luister alvast hoe Bohèm spanning en ruimte in een zaal houdt."),
      image: content.image || siteContent.about.photoMoments?.[0] || siteContent.hero.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : { label: "Bekijk of dit past", href: "#highlights", variant: "primary" },
      secondaryCta: visibleShows.length > 0 ? { label: "Bekijk de shows", href: "#shows", variant: "secondary" } : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Programmafit",
      title: content.positioningTitle || "Waarom dit in een theaterzaal zo goed werkt",
      intro: content.positioningBody || "Een avond die dichtbij voelt, maar stevig genoeg is om een zaal te dragen.",
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "editorial-list"
    },
    socialProof: buildSocialProof(content.socialProofItems, "Wat deze setting losmaakt", "Reacties uit de zaal"),
    localArea: buildLocalArea(
      content.localAreaTitle,
      content.localAreaIntro,
      content.priorityCities,
      content.localProofTitle,
      content.localProofItems,
      content.localLinkLabel && content.localLinkHref ? { label: content.localLinkLabel, href: content.localLinkHref, variant: "secondary" } : undefined
    ),
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch voor programmeurs", "Afstemming", "facts"),
    faq,
    shows: visibleShows.length > 0 ? {
      eyebrow: siteContent.bookings.showsEyebrow ?? "Speeldata",
      title: siteContent.bookings.showsTitle ?? "Komende shows",
      badgeLabel: siteContent.bookings.showsBadgeLabel ?? "Programmering"
    } : undefined,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Bespreek publiek, zaal en speelvorm",
      body: content.ctaContextBody || "Vertel kort wat voor zaal, publiek of avond je voor ogen hebt. Dan denken we mee over een passende invulling.",
      proofIntro: content.ctaProofIntro || "Een eerste vraag is genoeg om te toetsen of dit programma bij je zaal past.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "We denken mee over zaal, speelduur en publieksritme.",
              "Programmeurinformatie en persmateriaal zijn direct beschikbaar.",
              "Ook binnen een bestaand avondprogramma kunnen we gericht afstemmen."
            ],
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: { label: "Bekijk luisterconcerten", href: "/luisterconcert-boeken", variant: "secondary" }
    }
  };
}

export function buildKampvuurLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "kampvuur");
  const faq = buildFaq(getLandingFaqItems(siteContent, "kampvuur"), [
    { question: "Wat is Kampvuurklanken?", answer: content.intro || "Een bijzondere setting waarin muziek, aandacht en verbinding samenkomen." },
    { question: "Voor wie is deze avond bedoeld?", answer: "Voor teams, organisaties en groepen die behoefte hebben aan een intieme, verbindende muzikale ervaring." },
    { question: "Hoe kunnen we een aanvraag doen?", answer: "Stuur direct een mail of bel even, dan stemmen we de mogelijkheden af op jullie groep en planning." }
  ], content.faqTitle || "Veelgestelde vragen over Kampvuurklanken");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Wat dit losmaakt", "#highlights"],
      ["De beleving", "#kampvuurklanken"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Kampvuurklanken",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Geen standaard teamactiviteit, maar een avond die rust, herkenning en gesprek oproept.",
      listenCue: buildListenCue(siteContent, "Luister hoe Bohèm warmte en rust neerzet voordat je de opzet induikt."),
      image: content.image || siteContent.kampvuur.image || siteContent.hero.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : { label: "Lees wat dit losmaakt", href: "#highlights", variant: "primary" },
      secondaryCta: { label: "Bekijk de opzet", href: "#kampvuurklanken", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Voor teams en organisaties",
      title: content.positioningTitle || "Wat dit in een groep losmaakt",
      intro: content.positioningBody || siteContent.kampvuur.body?.[0],
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "host-flow"
    },
    socialProof: buildSocialProof(content.socialProofItems, "Waarom groepen hierop reageren", "Terug uit teams"),
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Hoe we dit afstemmen", "Praktisch", "grid"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Verken of Kampvuurklanken bij jullie groep past",
      body: content.ctaContextBody || siteContent.kampvuur.contactPrompt || "Vertel kort voor welke groep en welke avond je zoekt, dan maken we samen een passende opzet.",
      proofIntro: content.ctaProofIntro || "Je hoeft nog geen uitgewerkt programma te hebben om dit te verkennen.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "De avond wordt afgestemd op groep, doel en sfeer.",
              "Geschikt voor teams die verbinding zoeken zonder geforceerd programma.",
              "Praktisch en inhoudelijk vooraf helder afgestemd."
            ],
      primaryCta: hasText(siteContent.kampvuur.contactEmail)
        ? { label: "Mail direct", href: `mailto:${siteContent.kampvuur.contactEmail}` }
        : undefined,
      secondaryCta: { label: "Bekijk muzikale teamavond", href: "/muzikale-teamavond", variant: "secondary" }
    }
  };
}

export function buildHuiskamerConcertLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "huiskamerconcert");
  const faq = buildFaq(getLandingFaqItems(siteContent, "huiskamerconcert"), [
    { question: "Wat is een huiskamerconcert bij Bohèm?", answer: "Een kleine, directe setting waarin de muziek dicht op het publiek staat." },
    { question: "Past dit in een kleine ruimte?", answer: "Ja, dit concept is juist bedoeld voor compacte settings met aandacht voor sfeer en akoestiek." }
  ], content.faqTitle || "Veelgestelde vragen over huiskamerconcert boeken");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Waarom klein", "#highlights"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Huiskamerconcert boeken",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Een avond die klein mag voelen, maar groot binnenkomt.",
      listenCue: buildListenCue(siteContent, "Luister alvast hoe Bohèm in een kleine setting dichtbij blijft."),
      image: content.image || siteContent.musicExperience.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : { label: "Bekijk de mogelijkheden", href: "#highlights", variant: "primary" },
      secondaryCta: hasText(siteContent.discography.featuredSingle.href)
        ? { label: "Luister eerst", href: siteContent.discography.featuredSingle.href, variant: "secondary" }
        : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Dicht op het publiek",
      title: content.positioningTitle || "Waarom dit in een kleine setting zo sterk werkt",
      intro: content.positioningBody || "De ruimte is klein, de aandacht juist groot.",
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "host-flow"
    },
    socialProof: buildSocialProof(content.socialProofItems, "Wat gasten na afloop onthouden", "Reacties"),
    localArea: buildLocalArea(
      content.localAreaTitle,
      content.localAreaIntro,
      content.priorityCities,
      content.localProofTitle,
      content.localProofItems,
      content.localLinkLabel && content.localLinkHref ? { label: content.localLinkLabel, href: content.localLinkHref, variant: "secondary" } : undefined
    ),
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch voor een huiskamerconcert", "Praktisch", "chips"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Vertel iets over je ruimte en gezelschap",
      body: content.ctaContextBody || "Stuur een korte beschrijving van de ruimte en het gezelschap; dan denken we mee over een passende opzet.",
      proofIntro: content.ctaProofIntro || "Ook met alleen een ruimte en een idee kunnen we al goed meedenken.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "We stemmen opstelling en duur af op je ruimte en gezelschap.",
              "Geen technisch zware productie nodig om dit te laten werken.",
              "Je krijgt snel terug of Bohèm bij je avond past."
            ],
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: { label: "Bekijk luisterconcerten", href: "/luisterconcert-boeken", variant: "secondary" }
    }
  };
}

export function buildLiveMusicLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "liveMusic");
  const visibleShows = filterFutureShows(siteContent.bookings.upcomingShows);
  const faq = buildFaq(getLandingFaqItems(siteContent, "liveMusic"), [
    {
      question: "Voor wat voor soort avonden is Bohèm geschikt?",
      answer: "Voor avonden waar live muziek sfeer en aandacht mag dragen, van culturele events tot kleine podia en bijzondere programma's."
    },
    {
      question: "Wat maakt Bohèm anders dan een standaard live-act?",
      answer: "De combinatie van verhalende songs, directe podiumpresentatie en een avond met duidelijke opbouw in plaats van losse achtergrondmuziek."
    },
    {
      question: "Kunnen jullie meedenken als de avond nog niet helemaal vastligt?",
      answer: "Ja. Juist in een vroege fase kunnen we goed meedenken over setting, duur en hoe de muziek het best in de avond past."
    }
  ], content.faqTitle || "Veelgestelde vragen over live muziek boeken");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Past het", "#highlights"],
      ["Shows", "#shows"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Live muziek boeken",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Warm, verhalend en direct, zonder te vervallen in standaard live-entertainment.",
      listenCue: buildListenCue(siteContent, "Luister alvast hoe Bohèm sfeer en aandacht in een avond legt."),
      image: content.image || siteContent.hero.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : { label: "Bekijk of dit past", href: "#highlights", variant: "primary" },
      secondaryCta: hasText(siteContent.discography.featuredSingle.href)
        ? { label: "Luister eerst", href: siteContent.discography.featuredSingle.href, variant: "secondary" }
        : visibleShows.length > 0
          ? { label: "Bekijk de shows", href: "#shows", variant: "secondary" }
          : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Wat voor avond dit wordt",
      title: content.positioningTitle || "Waarom dit meer is dan alleen live muziek",
      intro: content.positioningBody || content.intro,
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "split-scenarios"
    },
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch om te weten", "Praktisch", "facts"),
    socialProof: buildSocialProof(content.socialProofItems, "Wat organisatoren en publiek teruggeven", "Reacties"),
    faq,
    shows: visibleShows.length > 0 ? {
      eyebrow: siteContent.bookings.showsEyebrow ?? "Live agenda",
      title: siteContent.bookings.showsTitle ?? "Komende shows",
      badgeLabel: siteContent.bookings.showsBadgeLabel ?? "Actueel"
    } : undefined,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Vertel wat voor avond je wilt neerzetten",
      body: content.ctaContextBody || "Vertel iets over de setting, het publiek en de sfeer die je zoekt. Dan laten we snel weten hoe Bohèm daarin past.",
      proofIntro: content.ctaProofIntro || "Ook met een eerste idee of ruwe opzet kunnen we al gericht meedenken.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "We stemmen speelduur, opbouw en sfeer af op de avond.",
              "De duo-opstelling blijft compact en flexibel inzetbaar.",
              "Je krijgt snel duidelijkheid over beschikbaarheid en passende vorm."
            ],
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: { label: "Bekijk muziekduo", href: "/muziekduo-boeken", variant: "secondary" }
    }
  };
}

export function buildTeamEveningLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "teamEvening");
  const faq = buildFaq(getLandingFaqItems(siteContent, "teamEvening"), [
    {
      question: "Voor wat voor teams werkt dit goed?",
      answer: "Voor teams en organisaties die meer zoeken dan een standaard activiteit en behoefte hebben aan een avond met rust, herkenning en echt contact."
    },
    {
      question: "Is dit niet te zwaar of juist te zweverig?",
      answer: "Nee. De avond blijft warm, toegankelijk en menselijk. Muziek en verhaal openen iets, maar zonder dat het geforceerd of therapeutisch wordt."
    },
    {
      question: "Kunnen jullie afstemmen op onze groep of aanleiding?",
      answer: "Ja. Bohèm stemt duur, toon en opbouw af op de context van de groep, zodat de avond logisch past bij jullie moment, teamdynamiek en doel."
    }
  ], content.faqTitle || "Veelgestelde vragen over een muzikale teamavond");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Past het", "#highlights"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Muzikale teamavond",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Geen standaard teambuilding, maar een avond waarin liedjes, herkenning en gesprek ruimte krijgen.",
      listenCue: buildListenCue(siteContent, "Luister alvast hoe Bohèm warmte en aandacht in een groep brengt."),
      image: content.image || siteContent.kampvuur.image || siteContent.hero.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : { label: "Bekijk of dit past", href: "#highlights", variant: "primary" },
      secondaryCta: { label: "Mail direct", href: `mailto:${siteContent.kampvuur.contactEmail || siteContent.bookings.press?.contactEmail || siteContent.contact.email}`, variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Voor teams en organisaties",
      title: content.positioningTitle || "Wat deze avond in beweging zet",
      intro: content.positioningBody || content.intro,
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "host-flow"
    },
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch om te weten", "Praktisch", "grid"),
    socialProof: buildSocialProof(content.socialProofItems, "Waarom deze vorm blijft hangen", "Reacties"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Verken of een muzikale teamavond bij jullie past",
      body: content.ctaContextBody || "Vertel iets over je team, de aanleiding en de sfeer die je zoekt. Dan laten we snel weten welke vorm past.",
      proofIntro: content.ctaProofIntro || "Je hoeft nog geen uitgewerkt programma te hebben om te toetsen of dit klopt voor jullie groep.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "De avond wordt afgestemd op groep, doel en gewenste sfeer.",
              "Compact of uitgebreider: de vorm kan mee schalen met het moment.",
              "Je krijgt snel duidelijkheid over inhoudelijke en praktische fit."
            ],
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.kampvuur.contactEmail || siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: { label: "Bekijk Kampvuurklanken", href: "/kampvuurklanken", variant: "secondary" }
    }
  };
}

export function buildCulturalEventLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "culturalEvent");
  const pressKitHref = siteContent.bookings.press?.kitHref;
  const faq = buildFaq(getLandingFaqItems(siteContent, "culturalEvent"), [
    {
      question: "Voor wat voor culturele events werkt Bohèm goed?",
      answer: "Voor culturele avonden, kleine podia en programma's waar muziek niet alleen moet opluisteren, maar ook een inhoudelijke rol mag dragen."
    },
    {
      question: "Past Bohèm binnen een bestaand programma of cultureel seizoen?",
      answer: "Ja. Bohèm kan zowel een volledige bijdrage dragen als gericht worden afgestemd op een bestaand programma, avond of seizoenscontext."
    },
    {
      question: "Welke informatie is handig voor een eerste aanvraag?",
      answer: "Vertel iets over het event, het publiek, de setting en de rol die muziek in de avond moet spelen. Dan kunnen we gericht meedenken."
    }
  ], content.faqTitle || "Veelgestelde vragen over muziek voor culturele events");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Programmafit", "#highlights"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Muziek voor cultureel event",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Voor programmeurs en cultuurorganisaties die zoeken naar muziek met sfeer, lijn en publieksaandacht.",
      listenCue: buildListenCue(siteContent, "Luister alvast hoe Bohèm sfeer, verhaal en aandacht combineert."),
      image: content.image || siteContent.about.photoMoments?.[0] || siteContent.hero.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : { label: "Bespreek een cultureel event", href: "#highlights", variant: "primary" },
      secondaryCta: { label: "Bekijk de persinfo", href: "/pers", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Programmafit",
      title: content.positioningTitle || "Waarom dit goed landt in een cultureel programma",
      intro: content.positioningBody || content.intro,
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "editorial-list"
    },
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch voor programmeurs en curatoren", "Afstemming", "facts"),
    socialProof: buildSocialProof(content.socialProofItems, "Wat deze vorm oplevert in een cultureel programma", "Reacties"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Bespreek of Bohèm bij jullie culturele event past",
      body: content.ctaContextBody || "Vertel iets over het event, het publiek en de rol die muziek in de avond moet spelen. Dan denken we gericht mee over een passende vorm.",
      proofIntro: content.ctaProofIntro || "Ook in een vroege programmeerfase kunnen we al helpen toetsen of deze vorm past.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "We stemmen speelduur, opbouw en toon af op event en publiek.",
              "Programmeurinformatie en persmateriaal zijn direct beschikbaar.",
              "De live-vorm blijft compact en past goed in samengestelde avonden."
            ],
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: pressKitHref ? { label: "Download perskit", href: pressKitHref, variant: "secondary" } : { label: "Bekijk pers", href: "/pers", variant: "secondary" }
    }
  };
}

export function buildListeningConcertLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "listeningConcert");
  const faq = buildFaq(getLandingFaqItems(siteContent, "listeningConcert"), [
    {
      question: "Wat maakt dit een luisterconcert en geen gewone live-set?",
      answer: "Een luisterconcert draait om aandacht, opbouw en de manier waarop publiek de muziek beleeft. De liedjes staan centraal en de avond krijgt een duidelijke lijn."
    },
    {
      question: "Past Bohèm in een kleine zaal of culturele luisteravond?",
      answer: "Ja. Juist in kleine zalen en culturele settings waar publiek echt wil luisteren, komen tekst, dynamiek en podiumpresentatie sterk naar voren."
    },
    {
      question: "Hoe stemmen jullie speelduur en opbouw af?",
      answer: "Bohèm kijkt naar ruimte, publiek en het doel van de avond en stemt daar lengte, spanningsboog en sfeer op af."
    }
  ], content.faqTitle || "Veelgestelde vragen over luisterconcert boeken");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Waarom dit werkt", "#highlights"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Luisterconcert boeken",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Voor settings waar aandacht belangrijker is dan volume en de songs echt de ruimte krijgen.",
      listenCue: buildListenCue(siteContent, "Luister alvast hoe Bohèm spanning, stilte en nabijheid in een avond houdt."),
      image: content.image || siteContent.about.photoMoments?.[0] || siteContent.musicExperience.image,
      primaryCta:
        content.cta && !isDirectContactCta(content.cta)
          ? content.cta
          : { label: "Bespreek een luisterconcert", href: "#highlights", variant: "primary" },
      secondaryCta: hasText(siteContent.discography.featuredSingle.href)
        ? { label: "Luister eerst", href: siteContent.discography.featuredSingle.href, variant: "secondary" }
        : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Luistermodus",
      title: content.positioningTitle || "Waarom deze vorm dichtbij blijft",
      intro: content.positioningBody || content.intro,
      items: combineSections(content.highlights, undefined, content.proofTitle, content.fitTitle).slice(0, 3),
      variant: content.highlightsVariant || "editorial-list"
    },
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch voor een luisterconcert", "Praktisch", "facts"),
    socialProof: buildSocialProof(content.socialProofItems, "Wat publiek van deze vorm onthoudt", "Reacties"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Verken of een luisterconcert bij jullie avond past",
      body: content.ctaContextBody || "Vertel iets over de setting, het publiek en de sfeer die je zoekt. Dan laten we snel weten welke vorm past en hoe het concert afgestemd kan worden.",
      proofIntro: content.ctaProofIntro || "Ook zonder volledig uitgewerkt programma kunnen we al goed meedenken over lengte, opbouw en zaalfit.",
      proofItems:
        content.ctaProofItems?.length
          ? content.ctaProofItems
          : [
              "We stemmen speelduur, opbouw en toon af op ruimte en publiek.",
              "De live-opstelling blijft compact en werkt in aandachtige settings sterk.",
              "Je krijgt snel terug hoe deze vorm het best in jullie avond past."
            ],
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: { label: "Bekijk theaterconcerten", href: "/theaterconcert-boeken", variant: "secondary" }
    }
  };
}

export function buildPersLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "press");
  const press = siteContent.bookings.press;
  const facts = press?.facts ?? [];
  const pressKitCta = press?.kitHref && press.kitLabel ? { label: press.kitLabel, href: press.kitHref } : undefined;
  const faq = buildFaq(getLandingFaqItems(siteContent, "press"), [
    { question: "Waar vinden we persinformatie?", answer: press?.kitLabel ? `Via ${press.kitLabel}.` : "Via het persmateriaal en de contactgegevens op deze pagina." },
    { question: "Wie kunnen we benaderen voor pers of boekingen?", answer: "Gebruik het contactadres of telefoonnummer op deze pagina voor een snelle reactie." },
    { question: "Welke informatie is handig voor een aanvraag?", answer: "Noem de locatie, doelgroep, gewenste datum en het soort avond; dan kunnen we gericht meedenken." }
  ], content.faqTitle || "Veelgestelde vragen voor pers en programmeurs");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Kernfeiten", "#highlights"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Pers en boekingsinfo",
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || press?.boilerplate || "Alles wat een redacteur, programmeur of venue snel nodig heeft.",
      image: content.image || siteContent.bookings.highlightImage || siteContent.about.photoMoments?.[0] || siteContent.hero.image,
      primaryCta: content.cta ?? pressKitCta ?? { label: "Bekijk de kernfeiten", href: "#highlights" },
      secondaryCta: press?.contactEmail
        ? { label: "Mail direct", href: `mailto:${press.contactEmail}`, variant: "secondary" }
        : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Kernfeiten",
      title: content.positioningTitle || press?.title || "Bohèm in het kort",
      intro: content.positioningBody || press?.boilerplate || "Feiten, positionering en contactopties zonder omweg.",
      items: toFactItems(content.fitItems || facts).slice(0, 4),
      variant: content.highlightsVariant || "facts"
    },
    socialProof: buildSocialProof(content.socialProofItems, "Kernfeiten voor pers en boekers", "Context"),
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Perskit en contact", "Praktisch", "facts"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Vraag persmateriaal of extra informatie aan",
      body: content.ctaContextBody || "Stuur een bericht voor persinformatie, boekingsvragen of beeldmateriaal. We reageren snel en helder.",
      proofIntro: content.ctaProofIntro,
      proofItems: content.ctaProofItems,
      primaryCta: pressKitCta,
      secondaryCta: { label: "Bekijk nieuws", href: "/nieuws", variant: "secondary" }
    }
  };
}
