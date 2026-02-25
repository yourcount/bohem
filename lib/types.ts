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
  bookings: {
    title: string;
    body: string;
    socialProofTitle?: string;
    socialProof?: Array<{
      quote: string;
      source: string;
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
  };
  contact: {
    title: string;
    intro: string;
    ctaLabel: string;
    email: string;
    responseTimeText?: string;
    subjectOptions?: string[];
    fields: Array<{
      id: "name" | "email" | "phone" | "message" | "subject";
      label: string;
      type: "text" | "email" | "tel" | "textarea" | "select";
      autoComplete?: string;
      required: boolean;
    }>;
  };
  footer: {
    copyright: string;
  };
};
