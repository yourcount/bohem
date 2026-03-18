import type { LandingExtraSection, LandingHighlightItem, NavItem, SiteContent } from "@/lib/types";
import { filterFutureShows } from "@/lib/content/shows";
import { getLandingFaqItems, getLandingPageContent, type LandingPageKey } from "@/lib/content/landing-pages";

export type LandingRouteView = {
  navigation: NavItem[];
  intro: {
    eyebrow?: string;
    title: string;
    intro: string;
    note?: string;
    image?: SiteContent["hero"]["image"] | SiteContent["musicExperience"]["image"] | SiteContent["kampvuur"]["image"];
    primaryCta: { label: string; href: string; variant?: "primary" | "secondary" };
    secondaryCta?: { label: string; href: string; variant?: "primary" | "secondary" };
  };
  highlights?: {
    eyebrow?: string;
    title: string;
    intro?: string;
    items: LandingHighlightItem[];
  };
  localArea?: {
    title: string;
    intro?: string;
    cities: string[];
    proofTitle?: string;
    proofItems: string[];
    cta?: { label: string; href: string; variant?: "primary" | "secondary" };
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

function toHighlightItems(items: LandingHighlightItem[] | string[] | undefined, titlePrefix = "Punt"): LandingHighlightItem[] {
  if (!items || items.length === 0) return [];

  return items
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          title: `${titlePrefix} ${index + 1}`,
          body: item.trim()
        };
      }

      return {
        title: item.title?.trim() || `${titlePrefix} ${index + 1}`,
        body: item.body.trim()
      };
    })
    .filter((item) => hasText(item.body));
}

function limitFaq(items: Array<{ question: string; answer: string }>, fallback: Array<{ question: string; answer: string }>) {
  const source = items.filter((item) => hasText(item.question) && hasText(item.answer));
  return source.length > 0 ? source : fallback;
}

function combineSections(
  highlights: LandingHighlightItem[] | string[] | undefined,
  fitItems: string[] | undefined,
  extraSections: LandingExtraSection[] | undefined,
  proofTitle?: string,
  fitTitle?: string
): LandingHighlightItem[] {
  const items: LandingHighlightItem[] = [];

  if (Array.isArray(highlights)) {
    items.push(...toHighlightItems(highlights, "Punt"));
  }

  if (Array.isArray(fitItems)) {
    items.push(...toHighlightItems(fitItems, "Pluspunt"));
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

function toTelHref(phone: string | undefined | null) {
  if (!hasText(phone)) return undefined;
  const normalizedPhone = String(phone).trim().replace(/\s+/g, "");
  return `tel:${normalizedPhone}`;
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
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Compact, muzikaal en zonder overbodige franje.",
      image: content.image || siteContent.hero.image,
      primaryCta: content.cta ?? { label: "Vraag beschikbaarheid aan", href: "#contact" },
      secondaryCta: visibleShows.length > 0 ? { label: "Bekijk de shows", href: "#shows", variant: "secondary" } : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Waar Bohèm past",
      title: content.positioningTitle || "Waarom dit werkt als boeking",
      intro: content.positioningBody || content.intro,
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
    },
    localArea: buildLocalArea(
      content.localAreaTitle,
      content.localAreaIntro,
      content.priorityCities,
      content.localProofTitle,
      content.localProofItems,
      content.localLinkLabel && content.localLinkHref ? { label: content.localLinkLabel, href: content.localLinkHref, variant: "secondary" } : undefined
    ),
    faq,
    shows: visibleShows.length > 0 ? {
      eyebrow: siteContent.bookings.showsEyebrow ?? "Live agenda",
      title: siteContent.bookings.showsTitle ?? "Komende shows",
      badgeLabel: siteContent.bookings.showsBadgeLabel ?? "Actueel"
    } : undefined,
    cta: {
      eyebrow: "Contact",
      title: "Plan direct een boeking",
      body: "Stuur een korte vraag, dan kijken we samen naar datum, setting en geschiktheid.",
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: toTelHref(siteContent.bookings.press?.contactPhone)
        ? { label: "Bel direct", href: toTelHref(siteContent.bookings.press?.contactPhone)!, variant: "secondary" }
        : undefined
    }
  };
}

export function buildTheaterConcertLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "theaterConcert");
  const visibleShows = filterFutureShows(siteContent.bookings.upcomingShows);
  const faq = buildFaq(getLandingFaqItems(siteContent, "theaterConcert"), [
    { question: "Waarom werkt Bohèm in een theater?", answer: "Omdat de muziek ruimte geeft aan tekst, dynamiek en aandacht. Dat past goed bij een luisterpubliek." },
    { question: "Is dit geschikt voor culturele programmering?", answer: "Ja, juist daar komt de combinatie van sfeer, verhaal en performance goed tot zijn recht." }
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
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Voor zalen die een rustig, muzikaal en inhoudelijk sterk programma zoeken.",
      image: content.image || siteContent.about.photoMoments?.[0] || siteContent.hero.image,
      primaryCta: content.cta ?? { label: "Plan een theaterconcert", href: "#contact" },
      secondaryCta: visibleShows.length > 0 ? { label: "Bekijk de shows", href: "#shows", variant: "secondary" } : { label: "Bekijk de highlights", href: "#highlights", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Programmering",
      title: content.positioningTitle || "Waar dit type avond sterk in is",
      intro: content.positioningBody || "Klein genoeg om dichtbij te voelen, rijk genoeg om een avond te dragen.",
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
    },
    localArea: buildLocalArea(
      content.localAreaTitle,
      content.localAreaIntro,
      content.priorityCities,
      content.localProofTitle,
      content.localProofItems,
      content.localLinkLabel && content.localLinkHref ? { label: content.localLinkLabel, href: content.localLinkHref, variant: "secondary" } : undefined
    ),
    faq,
    shows: visibleShows.length > 0 ? {
      eyebrow: siteContent.bookings.showsEyebrow ?? "Speeldata",
      title: siteContent.bookings.showsTitle ?? "Komende shows",
      badgeLabel: siteContent.bookings.showsBadgeLabel ?? "Programmering"
    } : undefined,
    cta: {
      eyebrow: "Contact",
      title: "Vraag een theaterconcert aan",
      body: "Vertel kort wat voor zaal, publiek of programma je voor ogen hebt. Dan denken we mee over een passende invulling.",
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: toTelHref(siteContent.bookings.press?.contactPhone)
        ? { label: "Bel direct", href: toTelHref(siteContent.bookings.press?.contactPhone)!, variant: "secondary" }
        : undefined
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
      ["Beleving", "#kampvuur"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Kampvuurklanken",
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Intiem, gedragen en geschikt voor groepen die echt samen willen luisteren.",
      image: content.image || siteContent.kampvuur.image || siteContent.hero.image,
      primaryCta: content.cta ?? { label: "Vraag Kampvuurklanken aan", href: "#contact" },
      secondaryCta: { label: "Bekijk de beleving", href: "#kampvuur", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Voor teams en organisaties",
      title: content.positioningTitle || "Waarom dit werkt",
      intro: content.positioningBody || siteContent.kampvuur.body?.[0],
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
    },
    faq,
    cta: {
      eyebrow: "Contact",
      title: "Plan een Kampvuurklanken-avond",
      body: siteContent.kampvuur.contactPrompt || "Vertel kort voor welke groep en welke avond je zoekt, dan maken we samen een passende opzet.",
      primaryCta: hasText(siteContent.kampvuur.contactEmail)
        ? { label: "Mail direct", href: `mailto:${siteContent.kampvuur.contactEmail}` }
        : undefined,
      secondaryCta: toTelHref(siteContent.kampvuur.contactPhone)
        ? { label: "Bel direct", href: toTelHref(siteContent.kampvuur.contactPhone)!, variant: "secondary" }
        : undefined
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
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Compact van opzet, rijk in sfeer.",
      image: content.image || siteContent.musicExperience.image,
      primaryCta: content.cta ?? { label: "Boek een huiskamerconcert", href: "#contact" },
      secondaryCta: { label: "Bekijk de mogelijkheden", href: "#highlights", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Intieme setting",
      title: content.positioningTitle || "Waarom een huiskamerconcert werkt",
      intro: content.positioningBody || "De ruimte is klein, de beleving juist groot.",
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
    },
    localArea: buildLocalArea(
      content.localAreaTitle,
      content.localAreaIntro,
      content.priorityCities,
      content.localProofTitle,
      content.localProofItems,
      content.localLinkLabel && content.localLinkHref ? { label: content.localLinkLabel, href: content.localLinkHref, variant: "secondary" } : undefined
    ),
    faq,
    cta: {
      eyebrow: "Contact",
      title: "Vraag een huiskamerconcert aan",
      body: "Stuur een korte beschrijving van de ruimte en het gezelschap; dan denken we mee over een passende opzet.",
      primaryCta: { label: "Mail direct", href: `mailto:${siteContent.bookings.press?.contactEmail || siteContent.contact.email}` },
      secondaryCta: toTelHref(siteContent.bookings.press?.contactPhone)
        ? { label: "Bel direct", href: toTelHref(siteContent.bookings.press?.contactPhone)!, variant: "secondary" }
        : undefined
    }
  };
}

export function buildPersLanding(siteContent: SiteContent): LandingRouteView {
  const content = getLandingPageContent(siteContent, "press");
  const press = siteContent.bookings.press;
  const facts = press?.facts ?? [];
  const faq = buildFaq(getLandingFaqItems(siteContent, "press"), [
    { question: "Waar vinden we persinformatie?", answer: press?.kitLabel ? `Via ${press.kitLabel}.` : "Via het persmateriaal en de contactgegevens op deze pagina." },
    { question: "Wie kunnen we benaderen voor pers of programmering?", answer: "Gebruik het contactadres of telefoonnummer op deze pagina voor een snelle reactie." },
    { question: "Welke informatie is handig voor een programma-aanvraag?", answer: "Noem de locatie, doelgroep, gewenste datum en het type programma; dan kunnen we gericht meedenken." }
  ], content.faqTitle || "Veelgestelde vragen voor pers en programmeurs");

  return {
    navigation: makeNav([
      ["Intro", "#intro"],
      ["Feiten", "#facts"],
      ["FAQ", "#faq"],
      ["Contact", "#contact"]
    ]),
    intro: {
      eyebrow: content.heroLabel || "Pers en programmering",
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Korte briefing, duidelijke feiten en directe contactopties.",
      image: content.image || siteContent.bookings.highlightImage || siteContent.about.photoMoments?.[0] || siteContent.hero.image,
      primaryCta: content.cta ?? { label: "Bekijk de feiten", href: "#facts" },
      secondaryCta: { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Kernfeiten",
      title: content.positioningTitle || press?.title || "Wat handig is om te weten",
      intro: content.positioningBody || "Alles wat programmeurs, redacties en venues snel nodig hebben.",
      items: combineSections(content.highlights, content.fitItems || facts, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
    },
    faq,
    cta: {
      eyebrow: "Contact",
      title: "Vraag persmateriaal aan",
      body: "Stuur een bericht voor persinformatie, programmering of beeldmateriaal. We reageren snel en gericht.",
      primaryCta: press?.kitHref && press.kitLabel ? { label: press.kitLabel, href: press.kitHref } : undefined,
      secondaryCta: press?.contactEmail
        ? { label: "Mail direct", href: `mailto:${press.contactEmail}`, variant: "secondary" }
        : undefined
    }
  };
}
