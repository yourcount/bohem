import type { Metadata } from "next";

import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export type NewsItemType = "release" | "show" | "media";

export type NewsLink = {
  label: string;
  href: string;
};

export type NewsImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  focusX?: number;
  focusY?: number;
};

export type NewsItem = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  type: NewsItemType;
  seoTitle: string;
  seoDescription: string;
  body: string[];
  image: NewsImage;
  relatedLinks: NewsLink[];
  internalLinks: NewsLink[];
};

const NEWS_ITEMS: NewsItem[] = [
  {
    title: "Nieuwe single Vroeger uit",
    slug: "nieuwe-single-vroeger-uit",
    excerpt:
      "Bohèm heeft op 6 februari 2026 de single Vroeger uitgebracht: een verhalend lied over nabijheid, stilte en het moment waarop twee mensen elkaar nog wel zien, maar elkaar niet meer echt bereiken.",
    publishedAt: "2026-02-06",
    type: "release",
    seoTitle: "Nieuwe single Vroeger uit | Bohèm nieuws",
    seoDescription:
      "Bohèm brengt op 6 februari 2026 de single Vroeger uit. Lees meer over het nummer, de thematiek en waar je kunt luisteren.",
    body: [
      "Bohèm heeft op vrijdag 6 februari 2026 de single Vroeger uitgebracht. Het nummer duurt 4 minuten en 26 seconden en markeert een volgende publieke stap in het traject rond de nieuwe muziek van Arthur Bont en Bettina Kraaieveld. Voor wie Bohèm al live heeft gehoord, voelt deze release als een logisch vervolg: persoonlijk, melodisch en dichtbij, zonder klein te worden.",
      "Vroeger draait om iets wat veel mensen herkennen, maar moeilijk onder woorden krijgen: samen zijn en elkaar toch langzaam kwijtraken in de stiltes die tussen twee mensen ontstaan. Dat maakt het geen groot gebaar om het grote gebaar, maar een lied dat zijn werking juist vindt in detail, herkenning en het spanningsveld tussen troost en gemis.",
      "Voor Bohèm is deze release ook inhoudelijk belangrijk. De muziek beweegt zich niet richting vluchtige singlelogica, maar sluit aan bij de lijn die ook live hoorbaar is: liedjes met verhaal, ruimte voor nuance en een vorm die net zo goed in een luisterconcert als in een cultureel programma overeind blijft. Vroeger voelt daardoor niet als een los moment, maar als onderdeel van een bredere muzikale koers.",
      "Wie de single hoort, krijgt meteen een goed beeld van wat Bohèm als duo onderscheidt. De combinatie van directheid, melodie en verhalende opbouw maakt dat de song zowel toegankelijk als gelaagd binnenkomt. Dat is ook precies waarom dit nummer een sterke ingang vormt voor wie Bohèm nog niet kent, maar wel zoekt naar live muziek of Nederlandstalige en Engelstalige songs die iets openlaten in plaats van alles dicht te timmeren.",
      "Met Vroeger staat er nu ook op het eigen domein een duidelijk nieuwsankerpunt voor deze release. Daarmee hoeft de context rond nieuwe muziek niet alleen via streamingdiensten of externe platforms gevonden te worden, maar kan Bohèm zelf de eerste duiding geven: wat het nummer is, waar het over gaat en waar het past binnen de bredere live- en releasebeweging van dit jaar."
    ],
    image: {
      src: "/images/music/vroeger-cover.webp",
      alt: "Cover art van de single Vroeger van Bohèm",
      width: 640,
      height: 640,
      focusX: 50,
      focusY: 50
    },
    relatedLinks: [
      { label: "Luister Vroeger op Spotify", href: "https://open.spotify.com/track/2TaHQl5PVOSHIs1xCjbD1W?si=117282ba1c4740b1" },
      { label: "Bekijk de Amazon Music release", href: "https://music.amazon.co.uk/albums/B0GKN76FM6" }
    ],
    internalLinks: [
      { label: "Pers en materiaal van Bohèm", href: "/pers" },
      { label: "Bohèm boeken als live muziekduo", href: "/muziekduo-boeken" }
    ]
  },
  {
    title: "Albumrelease-show van Bohèm",
    slug: "albumrelease-show-van-bohem",
    excerpt:
      "Op zondag 15 maart 2026 presenteert Bohèm het debuutalbum Hemelwater tijdens Sunday Sessions in Xinix Poppodium in Nieuwendijk: een intieme middag met live muziek, verhalen en echte ontmoeting.",
    publishedAt: "2026-03-10",
    type: "show",
    seoTitle: "Albumrelease-show van Bohèm in Xinix | Hemelwater",
    seoDescription:
      "Bohèm presenteert op 15 maart 2026 het debuutalbum Hemelwater tijdens Sunday Sessions in Xinix Poppodium in Nieuwendijk.",
    body: [
      "Op zondag 15 maart 2026 staat Bohèm in Xinix Poppodium in Nieuwendijk voor een speciale Sunday Sessions-editie rond de release van het debuutalbum Hemelwater. Volgens de openbare eventinformatie wordt het geen grootse productie om de productie zelf, maar een middag die draait om live muziek, verhalen en echte ontmoeting. Dat past precies bij de manier waarop Bohèm zich als duo profileert: warm, aandachtig en inhoudelijk sterk genoeg om een middag echt te dragen.",
      "De openbare aankondiging noemt Hemelwater expliciet het debuutalbum van Bohèm. Daarbij worden ook titels genoemd als Rose of Jericho, Regen en Waar ben jij, waarmee meteen duidelijk wordt dat de albumlijn niet alleen over één sfeer of één onderwerp gaat, maar over een breder palet aan liefde, verlies, hoop en veerkracht. Dat maakt deze release-show niet alleen interessant voor bestaande luisteraars, maar ook voor programmeurs en bezoekers die Bohèm juist via een live-context willen leren kennen.",
      "Wat deze middag extra sterk maakt, is de setting. Sunday Sessions in Xinix is bij uitstek een context waarin liedjes, verhalen en publiek echt in één ruimte kunnen landen. De eventinformatie noemt daarnaast ondersteuning van Lucas Beukers op bas en Marten Scheffer op gitaar, mandoline en viool. Daarmee krijgt de middag een rijkere livekleur, zonder de directe kern van Bohèm kwijt te raken.",
      "Voor Bohèm is dit het soort publiek moment dat op het eigen domein thuishoort. Een albumrelease-show is niet alleen een agenda-item, maar een duidelijk merkmoment: nieuwe muziek, een concreet podium, extra musici en een verhaal dat doorloopt naar pers, boekingen en verdere live-programmering. Door dit ook op musicbybohem.nl te markeren, ontstaat er een eigen contextpagina die meer doet dan alleen doorverwijzen naar tickets.",
      "Wie wil aansluiten bij deze releasebeweging, kan via de eventpagina meer praktische informatie vinden. Voor wie Bohèm eerder inhoudelijk wil verkennen, liggen de logische vervolgsporen op de site bij de persinformatie, de live-duopagina en de routes voor luisterconcerten en culturele events. Zo werkt deze release-show niet alleen als een losse datum, maar als een stevig scharnierpunt in hoe Bohèm dit jaar zichtbaar is."
    ],
    image: {
      src: "/images/bohem-hero.jpg",
      alt: "Arthur Bont en Bettina Kraaieveld in warm podiumlicht",
      width: 1536,
      height: 864,
      focusX: 50,
      focusY: 12
    },
    relatedLinks: [
      { label: "Sunday Sessions - Bohèm Album Release", href: "https://www.artistguide.nl/party.p/552596/sunday-sessions-bohm-album-release" },
      { label: "Xinix Poppodium", href: "https://xinix.nl" }
    ],
    internalLinks: [
      { label: "Muziek voor cultureel event", href: "/muziek-voor-cultureel-event" },
      { label: "Pers en programmeerinformatie", href: "/pers" }
    ]
  },
  {
    title: "Bohèm live in Tilburg met Reizigers",
    slug: "bohem-live-in-tilburg-met-reizigers",
    excerpt:
      "Op zondag 19 april 2026 speelt Bohèm bij Backstage Bridges in Wijcentrum Heyhoef in Tilburg met het programma Reizigers: een middag vol eigen liedjes, verhalen en directe publieksnabijheid.",
    publishedAt: "2026-04-10",
    type: "show",
    seoTitle: "Bohèm live in Tilburg met Reizigers | 19 april 2026",
    seoDescription:
      "Bohèm speelt op 19 april 2026 in Wijcentrum Heyhoef in Tilburg met het programma Reizigers tijdens Backstage Bridges.",
    body: [
      "Op zondag 19 april 2026 speelt Bohèm bij Backstage Bridges in Wijcentrum Heyhoef in Tilburg. De openbare evenementpagina zet het programma neer als een muzikale reis vol eigen liedjes die raken, verrassen en verbinden. Daarmee is deze show niet alleen een losse speeldate, maar ook een duidelijke publieke ingang tot Reizigers, het live-programma waarmee Bohèm publiek meeneemt langs verhalen, melodie en ontmoeting.",
      "De aankondiging maakt helder waarom deze middag goed aansluit bij de vorm van Bohèm. De setting is seated, de speelduur is compact en de context nodigt uit tot echt luisteren. In plaats van een avond die vooral op volume of tempo leunt, draait het hier om hoe liedjes landen, hoe verhalen doorwerken en hoe publiek dichtbij genoeg zit om nuance, humor en verstilling mee te maken. Juist daar komt Bohèm sterk tot zijn recht.",
      "Tilburg is in die zin ook inhoudelijk een logische plek voor dit programma. Niet omdat een stad op zichzelf alles oplost, maar omdat deze showcontext precies de combinatie biedt waar Reizigers voor gemaakt lijkt: aandacht, een persoonlijke setting en ruimte voor een concertvorm die niet op achtergrond hoeft te functioneren. Dat maakt de middag interessant voor bezoekers, maar ook voor programmeurs die willen zien hoe Bohèm live werkt in een aandachtige omgeving.",
      "De eventtekst noemt Reizigers expliciet als een muzikaal avontuur in het Nederlands en Engels, met eigen songs aangevuld met enkele verrassende covers. Het motto dat daar wordt aangehaald, benadrukt dat het programma draait om leven in al zijn facetten: open reizen, lachen, huilen, bewegen en ruimte maken voor wat een lied kan losmaken. Dat geeft de voorstelling een heldere identiteit die verder gaat dan een standaard singer-songwriter set.",
      "Voor Bohèm is het waardevol om ook dit soort externe podia op het eigen domein te verankeren. Niet om agenda's van anderen over te doen, maar om duidelijk te maken waar, hoe en in welke context het duo te zien is. Deze Tilburg-datum laat goed zien wat Bohèm live kan zijn: persoonlijk, professioneel en geschikt voor settings waar een optreden iets mag openen in plaats van alleen iets opvullen."
    ],
    image: {
      src: "/images/bohem-hero.jpg",
      alt: "Arthur Bont en Bettina Kraaieveld in warm podiumlicht",
      width: 1536,
      height: 864,
      focusX: 50,
      focusY: 12
    },
    relatedLinks: [
      { label: "Backstage Bridges - Seated - Bohèm", href: "https://tilburgwijzer.nl/evenement/backstage-bridges-seated-stipsgoulding/" },
      { label: "TilburgWijzer tagpagina Bohèm", href: "https://tilburgwijzer.nl/tagcloud/bohem/" }
    ],
    internalLinks: [
      { label: "Luisterconcert boeken", href: "/luisterconcert-boeken" },
      { label: "Bohèm boeken als live muziekduo", href: "/muziekduo-boeken" }
    ]
  },
  {
    title: "Wat Bohèm live brengt in Reizigers",
    slug: "wat-bohem-live-brengt-in-reizigers",
    excerpt:
      "Reizigers is het live-programma waarmee Bohèm eigen liedjes, verhalen en publieksnabijheid samenbrengt in een vorm die even goed werkt voor luisteravonden als voor culturele programmering.",
    publishedAt: "2026-03-24",
    type: "media",
    seoTitle: "Wat Bohèm live brengt in Reizigers | programma en context",
    seoDescription:
      "Lees wat Bohèm live brengt in Reizigers: een verhalend programma met eigen liedjes, publieksnabijheid en ruimte voor luisterende settings.",
    body: [
      "Wie Bohèm live ziet, hoort niet alleen losse songs, maar stapt een programma binnen dat bewust als geheel is opgebouwd. Die lijn komt samen in Reizigers, de naam waaronder Arthur Bont en Bettina Kraaieveld hun eigen liedjes, verhalen en publiekscontact bundelen tot een herkenbare live-vorm. Openbare eventteksten rond Bohèm beschrijven dat programma als een muzikale reis waarin Nederlands- en Engelstalige songs, een paar verrassende covers en een open sfeer elkaar versterken.",
      "Dat beeld past ook bij de vroege openbare context rond Bohèm. Op een eventpagina uit maart 2025 werd het duo omschreven als een kersverse samenwerking, ontstaan nadat Arthur Bont en Bettina Kraaieveld samen een lied schreven voor het Songfestival 2024. Daar werd ook genoemd dat er toen al twaalf nieuwe liedjes klaarstonden om opgenomen te worden. Dat maakt Reizigers niet tot een later bedachte verpakking, maar tot een logisch live-vervolg op een samenwerking die vanaf het begin draaide om nieuw repertoire en een gedeelde muzikale taal.",
      "Wat Reizigers sterk maakt, is dat het niet vastzit aan één zaaltype. De vorm werkt in aandachtige settings waar publiek echt wil luisteren, maar kan ook landen binnen culturele programma's waar muziek een inhoudelijke rol mag spelen. De kern zit niet in decor of effect, maar in hoe Bohèm songs opbouwt, hoe verhalen ertussen bewegen en hoe nabijheid wordt toegelaten zonder dat het vrijblijvend wordt.",
      "Openbare beschrijvingen van het programma leggen daarbij de nadruk op leven in al zijn facetten: liefde, verlies, hoop, veerkracht, lichtheid en herkenning. Dat zijn grote woorden als je ze los neerzet, maar live werken ze juist omdat Bohèm ze klein genoeg houdt om menselijk te blijven. Daardoor ontstaat geen thematisch statement van bovenaf, maar een avond waarin publiek zichzelf kan herkennen in wat langskomt.",
      "Voor wie Bohèm programmeert, is Reizigers daarom een nuttig referentiepunt. Het maakt zichtbaar dat er een eigen live-identiteit ligt achter het duo: niet alleen liedjes, niet alleen sfeer, maar een programma met lijn. Voor bezoekers is het een eenvoudige manier om te begrijpen wat ze kunnen verwachten. En voor het eigen domein is het precies het soort context dat branded zoekverkeer verdient: een eigen, heldere uitleg van wat Bohèm live eigenlijk brengt."
    ],
    image: {
      src: "/images/bohem-hero.jpg",
      alt: "Arthur Bont en Bettina Kraaieveld in warm podiumlicht",
      width: 1536,
      height: 864,
      focusX: 50,
      focusY: 12
    },
    relatedLinks: [
      { label: "Sunday Sessions: Bohèm (2025)", href: "https://www.artistguide.nl/party.p/515502/sunday-sessions-bohm" },
      { label: "Backstage Bridges - Seated - Bohèm", href: "https://tilburgwijzer.nl/evenement/backstage-bridges-seated-stipsgoulding/" }
    ],
    internalLinks: [
      { label: "Luisterconcert boeken", href: "/luisterconcert-boeken" },
      { label: "Muziek voor cultureel event", href: "/muziek-voor-cultureel-event" }
    ]
  },
  {
    title: "Pers en programmeerinfo voor Bohèm",
    slug: "pers-en-programmeerinfo-voor-bohem",
    excerpt:
      "Voor redacties, programmeurs en venues die Bohèm snel goed willen plaatsen, staat er nu een duidelijke combinatie van persinformatie, live-context en relevante boekingsroutes op het eigen domein.",
    publishedAt: "2026-02-20",
    type: "media",
    seoTitle: "Pers en programmeerinfo voor Bohèm | context en boekingsroutes",
    seoDescription:
      "Pers en programmeerinfo voor Bohèm: wat het duo speelt, waar het live past en waar redacties en programmeurs direct de juiste informatie vinden.",
    body: [
      "Wie Bohèm snel goed wil plaatsen, zoekt meestal niet alleen een losse bio of één foto, maar vooral context. Wat voor duo is dit? In welke setting werkt het sterk? Waar sluit het live op aan? En hoe kom je snel bij het juiste materiaal of contactpunt uit? Precies daarom is het waardevol om pers en programmeerinfo niet alleen op externe platforms te laten zwerven, maar ook op het eigen domein helder samen te brengen.",
      "Bohèm beweegt zich in een vrij specifieke ruimte: liedjes met verhaal, directe podiumpresentatie en een vorm die goed landt in luisterende en culturele settings. Daardoor is het voor programmeurs belangrijk om meteen te kunnen zien welke ingang het meest logisch is. Soms is dat de algemene duo-pagina, soms juist een luisterconcert, soms een culturele event-context. Goede programmeerinfo helpt dus niet alleen pers, maar ook de juiste selectie en doorverwijzing.",
      "Ook voor redacties is een eigen contextpagina nuttig. Een externe agenda noemt vaak wel datum, locatie en een korte beschrijving, maar mist meestal de bredere lijn: hoe releases, live-programma en boekingsroutes samenhangen. Op het eigen domein kan Bohèm dat wel goed neerzetten. Daardoor wordt het makkelijker om een aankondiging, korte intro of programmatekst te schrijven die klopt met hoe het duo zichzelf live en muzikaal neerzet.",
      "Deze nieuwslaag sluit daar direct op aan. Door releases, shows en live-context op musicbybohem.nl zelf te plaatsen, ontstaat niet alleen meer grip op branded zoekresultaten, maar ook een sterkere doorstroming naar de juiste vaste pagina's. Persinformatie blijft op de perspagina staan, maar krijgt via nieuwsberichten extra actualiteit en vindbaarheid. Dat is precies de functie van deze compacte nieuwssectie: geen blog om het bloggen, maar een manier om merkmomenten en programmeercontext op het eigen domein te claimen.",
      "Voor wie snel verder wil, zijn de relevante routes nu duidelijker dan voorheen: persmateriaal op één plek, live-ingangen per setting, en nieuwsberichten die actuele momenten van extra context voorzien. Daarmee wordt Bohèm online niet alleen beter vindbaar, maar ook eenvoudiger te plaatsen voor de mensen die over publicatie, programmering of boeking beslissen."
    ],
    image: {
      src: "/images/bohem-hero.jpg",
      alt: "Arthur Bont en Bettina Kraaieveld in warm podiumlicht",
      width: 1536,
      height: 864,
      focusX: 50,
      focusY: 12
    },
    relatedLinks: [
      { label: "Perskit van Bohèm", href: "/brand/docs/bohem-press-kit.pdf" },
      { label: "Sunday Sessions - Bohèm Album Release", href: "https://www.artistguide.nl/party.p/552596/sunday-sessions-bohm-album-release" }
    ],
    internalLinks: [
      { label: "Perspagina van Bohèm", href: "/pers" },
      { label: "Live muziek boeken", href: "/live-muziek-boeken" }
    ]
  }
];

function compareByPublishedAtDesc(a: NewsItem, b: NewsItem) {
  return b.publishedAt.localeCompare(a.publishedAt);
}

export function getAllNewsItems() {
  return [...NEWS_ITEMS].sort(compareByPublishedAtDesc);
}

export function getNewsItemBySlug(slug: string) {
  return NEWS_ITEMS.find((item) => item.slug === slug);
}

export function formatNewsDate(date: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam"
  }).format(new Date(`${date}T12:00:00+01:00`));
}

export function getNewsTypeLabel(type: NewsItemType) {
  switch (type) {
    case "release":
      return "Release";
    case "show":
      return "Show";
    case "media":
      return "Media";
    default:
      return "Nieuws";
  }
}

export function buildNewsIndexMetadata(): Metadata {
  const url = `${getSiteUrl()}/nieuws`;
  const title = "Nieuws | Bohèm";
  const description =
    "Nieuws van Bohèm over releases, shows en media: compacte updates met context, luisterlinks en programmeerinformatie.";

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "website",
      locale: "nl_NL",
      url,
      siteName: "Bohèm",
      title,
      description,
      images: [
        {
          url: "/images/bohem-hero.jpg",
          width: 1536,
          height: 864,
          alt: "Arthur Bont en Bettina Kraaieveld in warm podiumlicht"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/bohem-hero.jpg"]
    }
  };
}

export function buildNewsArticleMetadata(item: NewsItem): Metadata {
  const url = `${getSiteUrl()}/nieuws/${item.slug}`;

  return {
    title: item.seoTitle,
    description: item.seoDescription,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "article",
      locale: "nl_NL",
      url,
      siteName: "Bohèm",
      title: item.seoTitle,
      description: item.seoDescription,
      publishedTime: `${item.publishedAt}T09:00:00+01:00`,
      images: [
        {
          url: item.image.src,
          width: item.image.width,
          height: item.image.height,
          alt: item.image.alt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: item.seoTitle,
      description: item.seoDescription,
      images: [item.image.src]
    }
  };
}

export function buildNewsIndexJsonLd(items: NewsItem[]) {
  const url = `${getSiteUrl()}/nieuws`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: "Nieuws | Bohèm",
        description: "Nieuws van Bohèm over releases, shows en media.",
        inLanguage: "nl-NL",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${getSiteUrl()}/#website`
        }
      },
      {
        "@type": "ItemList",
        "@id": `${url}#itemlist`,
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${url}/${item.slug}`,
          name: item.title
        }))
      }
    ]
  };
}

export function buildNewsArticleJsonLd(item: NewsItem) {
  const url = `${getSiteUrl()}/nieuws/${item.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: item.title,
        description: item.seoDescription,
        articleSection: getNewsTypeLabel(item.type),
        datePublished: `${item.publishedAt}T09:00:00+01:00`,
        dateModified: `${item.publishedAt}T09:00:00+01:00`,
        mainEntityOfPage: url,
        url,
        inLanguage: "nl-NL",
        image: absoluteUrl(item.image.src),
        author: {
          "@type": "Organization",
          name: "Bohèm",
          url: getSiteUrl()
        },
        publisher: {
          "@type": "Organization",
          name: "Bohèm",
          url: getSiteUrl(),
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/brand/logos/bohem-logo-white-moon-color.webp")
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: getSiteUrl()
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Nieuws",
            item: `${getSiteUrl()}/nieuws`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: item.title,
            item: url
          }
        ]
      }
    ]
  };
}
