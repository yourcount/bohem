import type { LandingExtraSection, LandingHighlightItem, LandingSocialProofItem, NavItem, SiteContent } from "@/lib/types";
import { filterFutureShows } from "@/lib/content/shows";
import { getLandingFaqItems, getLandingPageContent, type LandingPageKey } from "@/lib/content/landing-pages";

export type LandingRouteView = {
  navigation: NavItem[];
  intro: {
    eyebrow?: string;
    audienceLabel?: string;
    title: string;
    intro: string;
    note?: string;
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
    items.push(...toHighlightItems(highlights));
  }

  if (Array.isArray(fitItems)) {
    items.push(...toHighlightItems(fitItems));
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
  eyebrow?: string
): LandingRouteView["practicalInfo"] {
  const visibleItems = (items ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
  if (!hasText(title) || visibleItems.length === 0) return undefined;

  return {
    eyebrow,
    title,
    items: visibleItems
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
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Een avond die dichtbij voelt, muzikaal blijft boeien en zonder afstand gespeeld wordt.",
      image: content.image || siteContent.hero.image,
      primaryCta: content.cta ?? { label: "Leg je idee aan ons voor", href: "#contact" },
      secondaryCta: visibleShows.length > 0 ? { label: "Bekijk de shows", href: "#shows", variant: "secondary" } : { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Wat je neerzet",
      title: content.positioningTitle || "Waarom dit als avond blijft hangen",
      intro: content.positioningBody || content.intro,
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
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
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch om te weten", "Praktisch"),
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
      image: content.image || siteContent.about.photoMoments?.[0] || siteContent.hero.image,
      primaryCta: content.cta ?? { label: "Bespreek je programma", href: "#contact" },
      secondaryCta: visibleShows.length > 0 ? { label: "Bekijk de shows", href: "#shows", variant: "secondary" } : { label: "Bekijk de highlights", href: "#highlights", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Programmafit",
      title: content.positioningTitle || "Waarom dit in een theaterzaal zo goed werkt",
      intro: content.positioningBody || "Een avond die dichtbij voelt, maar stevig genoeg is om een zaal te dragen.",
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
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
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch voor programmeurs", "Afstemming"),
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
      image: content.image || siteContent.kampvuur.image || siteContent.hero.image,
      primaryCta: content.cta ?? { label: "Bekijk de beleving", href: "#kampvuurklanken" },
      secondaryCta: { label: "Lees wat dit losmaakt", href: "#highlights", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Voor teams en organisaties",
      title: content.positioningTitle || "Wat dit in een groep losmaakt",
      intro: content.positioningBody || siteContent.kampvuur.body?.[0],
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
    },
    socialProof: buildSocialProof(content.socialProofItems, "Waarom groepen hierop reageren", "Terug uit teams"),
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Hoe we dit afstemmen", "Praktisch"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Verken of Kampvuurklanken bij jullie groep past",
      body: content.ctaContextBody || siteContent.kampvuur.contactPrompt || "Vertel kort voor welke groep en welke avond je zoekt, dan maken we samen een passende opzet.",
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
      audienceLabel: content.audienceLabel,
      title: content.title,
      intro: content.intro,
      note: content.positioningBody || "Een avond die klein mag voelen, maar groot binnenkomt.",
      image: content.image || siteContent.musicExperience.image,
      primaryCta: content.cta ?? { label: "Leg je avond aan ons voor", href: "#contact" },
      secondaryCta: { label: "Bekijk de mogelijkheden", href: "#highlights", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Dicht op het publiek",
      title: content.positioningTitle || "Waarom dit in een kleine setting zo sterk werkt",
      intro: content.positioningBody || "De ruimte is klein, de aandacht juist groot.",
      items: combineSections(content.highlights, content.fitItems, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
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
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Praktisch voor een huiskamerconcert", "Praktisch"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Vertel iets over je ruimte en gezelschap",
      body: content.ctaContextBody || "Stuur een korte beschrijving van de ruimte en het gezelschap; dan denken we mee over een passende opzet.",
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
      quickPanel: {
        title: "Direct beschikbaar",
        items: [
          press?.kitLabel ? `${press.kitLabel} staat direct voor je klaar.` : "",
          press?.contactEmail ? `Pers en boekingen: ${press.contactEmail}` : "",
          press?.contactPhone ? `Telefoon: ${press.contactPhone}` : ""
        ].filter((item) => hasText(item)),
        primaryCta: pressKitCta,
        secondaryCta: press?.contactEmail
          ? { label: "Mail direct", href: `mailto:${press.contactEmail}`, variant: "secondary" }
          : undefined
      },
      image: content.image || siteContent.bookings.highlightImage || siteContent.about.photoMoments?.[0] || siteContent.hero.image,
      primaryCta: content.cta ?? pressKitCta ?? { label: "Bekijk de kernfeiten", href: "#highlights" },
      secondaryCta: { label: "Lees de FAQ", href: "#faq", variant: "secondary" }
    },
    highlights: {
      eyebrow: content.proofTitle || "Kernfeiten",
      title: content.positioningTitle || press?.title || "Bohèm in het kort",
      intro: content.positioningBody || press?.boilerplate || "Feiten, positionering en contactopties zonder omweg.",
      items: combineSections(content.highlights, content.fitItems || facts, content.extraSections, content.proofTitle, content.fitTitle).slice(0, 6)
    },
    socialProof: buildSocialProof(content.socialProofItems, "Kernfeiten voor pers en boekers", "Context"),
    practicalInfo: buildPracticalInfo(content.practicalInfoItems, "Perskit en contact", "Praktisch"),
    faq,
    cta: {
      eyebrow: "Contact",
      title: content.ctaContextTitle || "Vraag persmateriaal of extra informatie aan",
      body: content.ctaContextBody || "Stuur een bericht voor persinformatie, boekingsvragen of beeldmateriaal. We reageren snel en helder.",
      primaryCta: pressKitCta,
      secondaryCta: press?.contactEmail
        ? { label: "Mail direct", href: `mailto:${press.contactEmail}`, variant: "secondary" }
        : undefined
    }
  };
}
