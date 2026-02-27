export type NavItem = {
  label: string;
  href: string;
};

export type Cta = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export type SiteContent = {
  meta: {
    title: string;
    description: string;
    locale: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
  };
  brand: {
    name: string;
  };
  navigation: NavItem[];
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    image: {
      src: string;
      alt: string;
    };
    ctas: Cta[];
    listenNow?: {
      label: string;
      context: string;
      href: string;
    };
    intentLinks?: Array<{
      label: string;
      href: string;
    }>;
  };
  about: {
    title: string;
    intro: string;
    lineupTitle?: string;
    lineupItems?: string[];
    photoMoments?: Array<{
      src: string;
      alt: string;
      width: number;
      height: number;
    }>;
    bios: Array<{
      name: string;
      text: string;
      website?: string;
    }>;
  };
  discography: {
    title: string;
    intro: string;
    featuredSingle: {
      title: string;
      description: string;
      href: string;
      embedUrl: string;
    };
    artist: {
      title: string;
      description: string;
      href: string;
    };
    productionTitle?: string;
    productionItems?: string[];
    legal?: string;
    releases: Array<{
      title: string;
      year: string;
      format: "Single" | "EP" | "Live Session" | "Album";
      note: string;
      links: Array<{
        label: string;
        href: string;
      }>;
    }>;
  };
  musicExperience: {
    title: string;
    body: string;
    cta: Cta;
    image: {
      src: string;
      alt: string;
      width: number;
      height: number;
    };
  };
  kampvuur: {
    title: string;
    intro: string;
    body: string[];
    benefitsTitle: string;
    benefits: string[];
    quote: string;
    contactPrompt: string;
    contactEmail: string;
    contactPhone: string;
    image?: {
      src: string;
      alt: string;
      width: number;
      height: number;
    };
    packagesTitle?: string;
    packages?: Array<{
      name: string;
      duration: string;
      description: string;
    }>;
    packageCta?: Cta;
  };
  bookings: {
    title: string;
    body: string;
    fitTitle?: string;
    fitItems?: string[];
    routeTitle?: string;
    routeItems?: Array<{
      label: string;
      description: string;
      href: string;
    }>;
    socialProofTitle?: string;
    socialProof?: Array<{
      quote: string;
      source: string;
    }>;
    miniCases?: Array<{
      title: string;
      context: string;
      approach: string;
      result: string;
    }>;
    pressQuotes?: string[];
    upcomingShows?: Array<{
      date: string;
      venue: string;
      city: string;
      ctaLabel: string;
      ctaHref: string;
    }>;
    highlightImage?: {
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    };
    cta: Cta;
    infoTitle: string;
    infoItems: string[];
    bookabilityTitle?: string;
    bookabilityItems?: string[];
    requestStepsTitle?: string;
    requestSteps?: string[];
    availabilityText?: string;
    press?: {
      title: string;
      facts: string[];
      boilerplate: string;
      kitLabel: string;
      kitHref: string;
      contactEmail: string;
      contactPhone: string;
    };
  };
  contact: {
    title: string;
    intro: string;
    ctaLabel: string;
    email: string;
    responseTimeText?: string;
    intakeHint?: string;
    subjectOptions?: string[];
    fields: Array<{
      id: "name" | "email" | "phone" | "message" | "subject";
      label: string;
      type: "text" | "email" | "tel" | "textarea" | "select";
      autoComplete?: string;
      placeholder?: string;
      required: boolean;
    }>;
  };
  footer: {
    copyright: string;
  };
};
