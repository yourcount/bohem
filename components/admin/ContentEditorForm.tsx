"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";

import type { SiteContent } from "@/lib/types";

type EditorManagedContent = Pick<
  SiteContent,
  "brand" | "navigation" | "hero" | "about" | "discography" | "musicExperience" | "kampvuur" | "bookings" | "contact" | "footer"
>;
type UpcomingShow = NonNullable<SiteContent["bookings"]["upcomingShows"]>[number];

type ApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  validationSummary?: Array<{ path: string; message: string }>;
};

type AdminEditorContentResponse = {
  content: EditorManagedContent;
  updated_at: string;
  updated_by: string;
};

type EditableField = {
  path: string;
  section: string;
  label: string;
  helper: string;
  multiline: boolean;
  value: string;
};

type MediaFile = {
  src: string;
  name: string;
  tags: string[];
  kind?: "photo" | "asset";
};

type SearchTarget =
  | {
      id: string;
      kind: "section";
      sectionTitle: string;
      label: string;
      description: string;
      keywords: string[];
    }
  | {
      id: string;
      kind: "field";
      sectionTitle: string;
      path: string;
      label: string;
      description: string;
      keywords: string[];
    }
  | {
      id: string;
      kind: "release";
      sectionTitle: string;
      path: string;
      label: string;
      description: string;
      keywords: string[];
      itemIndex: number;
    }
  | {
      id: string;
      kind: "show";
      sectionTitle: string;
      path: string;
      label: string;
      description: string;
      keywords: string[];
      itemIndex: number;
    };

type StatusTone = "neutral" | "success" | "error";
type EditorMode = "form" | "visual";
const RELEASE_FORMAT_OPTIONS: Array<SiteContent["discography"]["releases"][number]["format"]> = [
  "Single",
  "EP",
  "Live Session",
  "Album"
];
const DISC_SECTION_TITLE = "Releases beheren";
const SHOWS_SECTION_TITLE = "Volgende shows beheren";
const HIDDEN_EDITOR_SECTIONS = new Set(["brand"]);
const HIDDEN_EDITOR_PATHS = new Set(["hero.eyebrow", "bookings.cta.variant"]);
const HIDDEN_EDITOR_PATH_PREFIXES = [
  "meta.",
  "discography.releases.",
  "bookings.upcomingShows.",
  "hero.listenNow.",
  "hero.intentLinks.",
  "bookings.miniCases.",
  "bookings.highlightImage.",
  "kampvuur.packages.",
  "kampvuur.packageCta."
];

const sectionLabels: Record<string, string> = {
  brand: "Bovenaan de pagina",
  navigation: "Navigatie",
  hero: "Bovenaan de pagina",
  about: "Over Bohèm",
  discography: "Discografie",
  musicExperience: "Muziekbeleving",
  kampvuur: "Kampvuurklanken",
  bookings: "Boekingen",
  contact: "Contact",
  footer: "Onderaan de pagina en socials"
};

const keyLabels: Record<string, string> = {
  name: "Naam",
  label: "Label",
  href: "Link",
  eyebrow: "Boventitel",
  featuredSingleEyebrow: "Boventitel boven uitgelichte single",
  artistEyebrow: "Boventitel boven artiestblok",
  headline: "Hoofdtitel",
  subhead: "Subtitel",
  src: "Afbeelding",
  alt: "Afbeelding omschrijving",
  intro: "Intro",
  text: "Tekst",
  website: "Persoonlijke website",
  body: "Tekstblok",
  quote: "Quote die zichtbaar wordt",
  source: "Naam onder quote",
  city: "Plaats",
  venue: "Locatie",
  date: "Datum",
  ticketsHref: "Tickets link",
  infoHref: "Extra info link",
  contactEmail: "E-mailadres",
  contactPhone: "Telefoon",
  email: "E-mailadres",
  responseTimeText: "Reactietijd",
  intakeHint: "Formulier hint",
  copyright: "Footertekst",
  youtubeHref: "YouTube link",
  instagramHref: "Instagram link",
  format: "Type release",
  year: "Jaar",
  note: "Toelichting",
  embedUrl: "Spotify embed link",
  ctaLabel: "Knoptekst",
  showsBadgeLabel: "Label boven shows",
  bookabilityTitle: "Titel boven beschikbaarheid",
  requestStepsTitle: "Titel boven aanvraagstappen",
  availabilityText: "Kleine tekst onder aanvraagstappen",
  emailTemplates: "E-mailberichten",
  admin: "Mail naar Bohèm",
  sender: "Bevestiging naar afzender",
  preheader: "Korte tekst bovenin de mail"
};

const helperByKey: Record<string, string> = {
  href: "Hiermee bepaal je waar deze knop of link naartoe gaat. Gebruik een volledige link (https://...) of een pagina-anker (#contact).",
  ticketsHref: "Voorbeeld: https://ticketshop.nl/event of #contact. Laat leeg om de knop te verbergen.",
  infoHref: "Voorbeeld: https://jouwsite.nl/meer-info of #contact. Laat leeg om de knop te verbergen.",
  website: "Gebruik een volledige link, bijvoorbeeld https://arthurbont.nl.",
  kitHref: "Gebruik een volledige link naar de perskit, bijvoorbeeld https://.../perskit.pdf.",
  email: "Gebruik een geldig e-mailadres.",
  contactEmail: "Gebruik een geldig e-mailadres.",
  contactPhone: "Gebruik internationaal formaat, bijvoorbeeld +31 6...",
  alt: "Beschrijf kort wat er op de foto te zien is. Deze tekst helpt ook bij toegankelijkheid.",
  embedUrl: "Dit vult het Spotify afspeelvak op de site. Plak hier de Spotify embed-link.",
  youtubeHref: "Gebruik een volledige link naar het YouTube-profiel.",
  instagramHref: "Gebruik een volledige link naar het Instagram-profiel."
};

const PATH_LABELS: Record<string, string> = {
  "discography.featuredSingle.href": "Link van de pop-up muziekknop",
  "discography.featuredSingle.ctaLabel": "Knoptekst van de pop-up muziekknop",
  "discography.featuredSingle.image.src": "Cover van de pop-up muziekbalk",
  "discography.featuredSingle.image.alt": "Omschrijving van de cover in de pop-up muziekbalk",
  "hero.image.src": "Hero-foto",
  "hero.image.alt": "Omschrijving van de hero-foto",
  "musicExperience.image.src": "Foto bij muziekbeleving",
  "musicExperience.image.alt": "Omschrijving van de foto bij muziekbeleving",
  "bookings.coverKoffer.image.src": "Foto bij coverkoffer",
  "bookings.coverKoffer.image.alt": "Omschrijving van de coverkoffer-foto",
  "footer.youtubeHref": "YouTube-link in de footer",
  "footer.instagramHref": "Instagram-link in de footer"
};

const PATH_HELPERS: Record<string, string> = {
  "discography.featuredSingle.href": "Deze link opent als iemand in de pop-up muziekbalk op de knop klikt.",
  "discography.featuredSingle.ctaLabel": "Deze tekst staat op de knop in de pop-up muziekbalk.",
  "discography.featuredSingle.image.src": "Deze cover wordt in de pop-up muziekbalk getoond zodra die zichtbaar wordt.",
  "discography.featuredSingle.image.alt": "Korte beschrijving van de cover in de pop-up muziekbalk.",
  "footer.youtubeHref": "Als je dit leeg laat, wordt het YouTube-icoon in de footer niet getoond.",
  "footer.instagramHref": "Als je dit leeg laat, wordt het Instagram-icoon in de footer niet getoond."
};

const PATH_VISIBILITY_HINTS: Record<string, string> = {
  "discography.featuredSingle.href": "Leeg = de knop in de pop-up muziekbalk verdwijnt.",
  "discography.featuredSingle.ctaLabel": "Leeg = de knop in de pop-up muziekbalk verdwijnt.",
  "discography.featuredSingle.image.src": "Leeg = de cover in de pop-up muziekbalk valt terug op de standaardafbeelding.",
  "musicExperience.cta.href": "Leeg = de knop in Muziekbeleving verdwijnt.",
  "musicExperience.cta.label": "Leeg = de knop in Muziekbeleving verdwijnt.",
  "bookings.cta.href": "Leeg = de hoofdknop in Boekingen verdwijnt.",
  "bookings.cta.label": "Leeg = de hoofdknop in Boekingen verdwijnt.",
  "bookings.press.kitHref": "Leeg = de perskit-knop wordt niet getoond.",
  "bookings.press.contactEmail": "Leeg = de e-mailknop in Pers wordt niet getoond.",
  "bookings.press.contactPhone": "Leeg = de telefoonknop in Pers wordt niet getoond.",
  "footer.youtubeHref": "Leeg = het YouTube-icoon in de footer verdwijnt.",
  "footer.instagramHref": "Leeg = het Instagram-icoon in de footer verdwijnt."
};

const SECTION_SEARCH_TERMS: Record<string, string[]> = {
  "Bovenaan de pagina": ["hero", "bovenaan", "bovenkant", "eerste scherm", "hoofdfoto", "openingsscherm", "introblok"],
  "Over Bohèm": ["bio", "over", "over bohem", "bandinfo", "leden", "bettina", "arthur"],
  Discografie: ["muziek", "liedjes", "single", "releases", "spotify", "pop-up", "muziekbalk", "luisterbalk", "cover"],
  Muziekbeleving: ["muziekbeleving", "muzikale beleving", "boom foto", "verhaal", "beleving"],
  Kampvuurklanken: ["kampvuur", "kampvuurklanken", "teams", "management", "team sessie", "vuur"],
  Boekingen: ["boekingen", "live", "optredens", "agenda", "aanvragen", "beschikbaarheid", "pers", "coverkoffer"],
  Contact: ["contact", "formulier", "stuur bericht", "mail", "telefoon"],
  "Onderaan de pagina en socials": ["footer", "onderaan", "onderkant", "socials", "instagram", "youtube"],
  [DISC_SECTION_TITLE]: ["releases", "liedjes", "muziek", "single", "ep", "album", "nummers"],
  [SHOWS_SECTION_TITLE]: ["shows", "optredens", "agenda", "live agenda", "volgende optredens", "tickets", "extra info"]
};

const FIELD_SEARCH_TERMS: Record<string, string[]> = {
  "discography.featuredSingle.title": ["pop-up", "muziekbalk", "luisterbalk", "spotify", "single", "uitgelichte single"],
  "discography.featuredSingle.href": ["pop-up knop", "spotify knop", "muziekknop", "luisterknop", "speel knop"],
  "discography.featuredSingle.ctaLabel": ["pop-up knop", "spotify knop", "knoptekst", "tekst op knop"],
  "discography.featuredSingle.image.src": ["cover", "single cover", "spotify cover", "muziekbalk foto", "luisterbalk foto", "albumhoes"],
  "discography.featuredSingle.image.alt": ["cover omschrijving", "beschrijving cover"],
  "hero.image.src": ["hero foto", "hoofdfoto", "bovenste foto", "grote foto"],
  "hero.headline": ["titel bovenaan", "hoofdtitel", "grote titel"],
  "hero.subhead": ["ondertitel bovenaan", "subtitel"],
  "musicExperience.image.src": ["boom foto", "foto bij muziekbeleving"],
  "bookings.coverKoffer.image.src": ["coverkoffer foto", "koffer foto"],
  "bookings.press.kitHref": ["perskit", "technische rider", "media download"],
  "bookings.press.contactPhone": ["telefoon pers", "pers telefoon"],
  "bookings.press.contactEmail": ["pers mail", "email pers"],
  "contact.ctaLabel": ["formulier knop", "verstuur knop", "knop contactformulier"],
  "contact.responseTimeText": ["antwoordtijd", "reactietijd"],
  "contact.emailTemplates.admin.subject": ["mail naar bohem", "melding voor bohem", "admin mail"],
  "contact.emailTemplates.sender.subject": ["bevestigingsmail", "mail naar afzender", "antwoordmail"],
  "footer.instagramHref": ["instagram", "instagram link", "socials"],
  "footer.youtubeHref": ["youtube", "youtube link", "socials"]
};

function pathParts(path: string) {
  return path.split(".");
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

function tokenizeSearchText(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function prettifyPart(part: string) {
  if (/^\d+$/.test(part)) {
    return `Item ${Number(part) + 1}`;
  }
  return keyLabels[part] ?? part.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function helperForPath(path: string) {
  if (PATH_HELPERS[path]) {
    return PATH_HELPERS[path];
  }
  if (path.startsWith("navigation.") && path.endsWith(".href")) {
    return "Gebruik een volledige link (https://...), een pagina-anker (#contact) of #shows als je de shows-sectie in het menu wilt tonen.";
  }
  if (path.includes("emailTemplates.")) {
    return "Je kunt placeholders gebruiken: {{name}}, {{email}}, {{phone}}, {{subject}}, {{message}}.";
  }
  const parts = pathParts(path);
  const leaf = parts[parts.length - 1] ?? "";
  return helperByKey[leaf] ?? "";
}

function visibilityHintForPath(path: string) {
  return PATH_VISIBILITY_HINTS[path] ?? "";
}

function labelForPath(path: string) {
  if (PATH_LABELS[path]) {
    return PATH_LABELS[path];
  }
  const parts = pathParts(path);
  if (parts.length === 0) return path;
  const leaf = parts[parts.length - 1] ?? "";
  const parent = parts.length > 1 ? prettifyPart(parts[parts.length - 2] ?? "") : "";

  if (/^\d+$/.test(parts[parts.length - 2] ?? "")) {
    const grandParent = parts.length > 2 ? prettifyPart(parts[parts.length - 3] ?? "") : "Item";
    return `${grandParent} - ${prettifyPart(parts[parts.length - 2] ?? "")} - ${prettifyPart(leaf)}`;
  }

  return parent ? `${parent} - ${prettifyPart(leaf)}` : prettifyPart(leaf);
}

function buildSearchKeywordSet(...values: Array<string | string[] | undefined>) {
  const keywords = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const parts = Array.isArray(value) ? value : [value];
    for (const part of parts) {
      const normalized = normalizeSearchText(part);
      if (normalized) {
        keywords.add(normalized);
      }
    }
  }
  return Array.from(keywords);
}

function scoreSearchTarget(queryTokens: string[], target: SearchTarget) {
  const haystacks = [normalizeSearchText(target.label), normalizeSearchText(target.description), ...target.keywords];
  let score = 0;

  for (const token of queryTokens) {
    const inLabel = haystacks[0]?.includes(token);
    const inDescription = haystacks[1]?.includes(token);
    const inKeywords = haystacks.slice(2).some((entry) => entry.includes(token));

    if (inLabel) score += 6;
    if (inDescription) score += 3;
    if (inKeywords) score += 5;
    if (haystacks.some((entry) => entry === token)) score += 4;
  }

  if (normalizeSearchText(target.label).startsWith(queryTokens.join(" "))) {
    score += 4;
  }

  return score;
}

function searchTargetPriority(target: SearchTarget) {
  switch (target.kind) {
    case "section":
      return 0;
    case "field":
      return 1;
    case "release":
      return 2;
    case "show":
      return 3;
    default:
      return 9;
  }
}

function flattenEditableFields(value: unknown, path = "", section = ""): EditableField[] {
  if (typeof value === "string") {
    const parts = pathParts(path);
    const leaf = parts[parts.length - 1] ?? "";
    return [
      {
        path,
        section,
        label: labelForPath(path),
        helper: helperForPath(path),
        multiline:
          value.length > 80 ||
          ["description", "text", "body", "intro", "boilerplate", "note", "quote", "subhead"].includes(leaf),
        value
      }
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenEditableFields(item, path ? `${path}.${index}` : String(index), section));
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return Object.entries(objectValue).flatMap(([key, nested]) => {
      const nextPath = path ? `${path}.${key}` : key;
      const nextSection = section || key;
      return flattenEditableFields(nested, nextPath, nextSection);
    });
  }

  return [];
}

function setValueAtPath<T>(input: T, path: string, value: unknown): T {
  const draft = structuredClone(input) as unknown;
  const parts = pathParts(path);
  let current: unknown = draft;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (Array.isArray(current)) {
      current = current[Number(part)];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(current)) {
    current[Number(last)] = value;
  } else {
    (current as Record<string, unknown>)[last] = value;
  }

  return draft as T;
}

function readValueAtPath(input: unknown, path: string): unknown {
  const parts = pathParts(path);
  let current: unknown = input;

  for (const part of parts) {
    if (current == null) return undefined;
    if (Array.isArray(current)) {
      current = current[Number(part)];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

function normalizeApiFieldErrors(fieldErrors?: Record<string, string[]>) {
  const normalized: Record<string, string[]> = {};
  if (!fieldErrors) return normalized;

  for (const [path, messages] of Object.entries(fieldErrors)) {
    const cleanPath = path.startsWith("content.") ? path.slice("content.".length) : path;
    normalized[cleanPath] = messages;
  }

  return normalized;
}

function formatValidationPath(path: string) {
  const clean = path.replace(/^content\./, "");
  return clean
    .split(".")
    .map((part) => {
      if (/^\d+$/.test(part)) return `#${Number(part) + 1}`;
      return keyLabels[part] ?? part.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toLowerCase();
    })
    .join(" > ");
}

function isImageSourcePath(path: string) {
  return path.endsWith(".src");
}

function isManagedLibraryImage(src: string) {
  return src.startsWith("/uploads/library/");
}

function toFocusPath(srcPath: string, key: "focusX" | "focusY") {
  return srcPath.replace(/\.src$/, `.${key}`);
}

function toNumberInRange(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, parsed));
}

function sectionToId(sectionTitle: string) {
  return `editor-section-${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function normalizeEditorContent(content: EditorManagedContent): EditorManagedContent {
  return structuredClone(content);
}

export function ContentEditorForm() {
  const [editorMode, setEditorMode] = useState<EditorMode>("form");
  const [content, setContent] = useState<EditorManagedContent | null>(null);
  const [initialContent, setInitialContent] = useState<EditorManagedContent | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [lastSavedBy, setLastSavedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [statusDetails, setStatusDetails] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTargetPath, setMediaTargetPath] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [deletingMediaSrc, setDeletingMediaSrc] = useState<string | null>(null);
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaTag, setMediaTag] = useState("");
  const [mediaKind, setMediaKind] = useState<"photo" | "all">("photo");
  const [mediaTags, setMediaTags] = useState<string[]>([]);
  const [activeFocusPath, setActiveFocusPath] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isSectionMenuCompact, setIsSectionMenuCompact] = useState(false);
  const [visualSelectedSection, setVisualSelectedSection] = useState<string | null>(null);
  const [visualSelectedPath, setVisualSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [highlightedFieldPath, setHighlightedFieldPath] = useState<string | null>(null);

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const fieldContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDetailsElement | null>>({});
  const sectionMenuRef = useRef<HTMLDivElement | null>(null);
  const releaseItemRefs = useRef<Record<number, HTMLLIElement | null>>({});
  const showItemRefs = useRef<Record<number, HTMLLIElement | null>>({});
  const searchHighlightTimeoutRef = useRef<number | null>(null);

  const scrollReleaseIntoView = (index: number) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        releaseItemRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  const scrollShowIntoView = (index: number) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        showItemRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatusMessage("");
      setStatusTone("neutral");
      setStatusDetails([]);

      try {
        const response = await fetch("/api/content/admin/editor-full", { method: "GET" });
        const payload = (await response.json()) as AdminEditorContentResponse & ApiError;

        if (!response.ok || !("content" in payload)) {
          setStatusMessage(payload.error ?? "Kon content niet laden.");
          setStatusTone("error");
          return;
        }

        const normalizedContent = normalizeEditorContent(payload.content);
        setContent(normalizedContent);
        setInitialContent(normalizedContent);
        setLastSavedAt(payload.updated_at);
        setLastSavedBy(payload.updated_by);
      } catch {
        setStatusMessage("Er ging iets mis bij laden. Ververs de pagina.");
        setStatusTone("error");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const editableFields = useMemo(() => {
    if (!content) return [];
    return flattenEditableFields(content).filter(
      (field) =>
        !HIDDEN_EDITOR_SECTIONS.has(field.section) &&
        !HIDDEN_EDITOR_PATHS.has(field.path) &&
        !HIDDEN_EDITOR_PATH_PREFIXES.some((prefix) => field.path.startsWith(prefix))
    );
  }, [content]);

  const groupedFields = useMemo(() => {
    const groups = new Map<string, EditableField[]>();

    for (const field of editableFields) {
      const section = sectionLabels[field.section] ?? prettifyPart(field.section);
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)?.push(field);
    }

    return Array.from(groups.entries());
  }, [editableFields]);

  const managedSectionTitles = useMemo(
    () => [DISC_SECTION_TITLE, SHOWS_SECTION_TITLE, ...groupedFields.map(([sectionTitle]) => sectionTitle)],
    [groupedFields]
  );
  const groupedFieldsMap = useMemo(() => new Map(groupedFields), [groupedFields]);
  const releases = content?.discography.releases ?? [];
  const shows = content?.bookings.upcomingShows ?? [];

  const searchTargets = useMemo<SearchTarget[]>(() => {
    const targets: SearchTarget[] = [];

    for (const sectionTitle of managedSectionTitles) {
      targets.push({
        id: `section:${sectionTitle}`,
        kind: "section",
        sectionTitle,
        label: sectionTitle,
        description: "Ga direct naar deze sectie",
        keywords: buildSearchKeywordSet(sectionTitle, SECTION_SEARCH_TERMS[sectionTitle])
      });
    }

    for (const field of editableFields) {
      const sectionTitle = sectionLabels[field.section] ?? prettifyPart(field.section);
      targets.push({
        id: `field:${field.path}`,
        kind: "field",
        sectionTitle,
        path: field.path,
        label: field.label,
        description: sectionTitle,
        keywords: buildSearchKeywordSet(
          field.label,
          field.helper,
          field.path,
          field.section,
          field.value,
          SECTION_SEARCH_TERMS[sectionTitle],
          FIELD_SEARCH_TERMS[field.path]
        )
      });
    }

    releases.forEach((release, index) => {
      const releaseBase = `discography.releases.${index}`;
      const itemLabel = release.title?.trim() || `Release ${index + 1}`;
      const commonKeywords = [DISC_SECTION_TITLE, itemLabel, "release", "liedje", "single", "muziek", "nummer"];
      targets.push(
        {
          id: `release:${index}:title`,
          kind: "release",
          sectionTitle: DISC_SECTION_TITLE,
          path: `${releaseBase}.title`,
          label: `Release ${index + 1} - titel`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["titel", itemLabel]),
          itemIndex: index
        },
        {
          id: `release:${index}:year`,
          kind: "release",
          sectionTitle: DISC_SECTION_TITLE,
          path: `${releaseBase}.year`,
          label: `Release ${index + 1} - jaar`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["jaar", "releasejaar"]),
          itemIndex: index
        },
        {
          id: `release:${index}:format`,
          kind: "release",
          sectionTitle: DISC_SECTION_TITLE,
          path: `${releaseBase}.format`,
          label: `Release ${index + 1} - type`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["type", "soort", "ep", "album", "single"]),
          itemIndex: index
        },
        {
          id: `release:${index}:note`,
          kind: "release",
          sectionTitle: DISC_SECTION_TITLE,
          path: `${releaseBase}.note`,
          label: `Release ${index + 1} - toelichting`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["toelichting", "beschrijving", "tekst"]),
          itemIndex: index
        }
      );
      release.links.forEach((link, linkIndex) => {
        targets.push(
          {
            id: `release:${index}:link:${linkIndex}:label`,
            kind: "release",
            sectionTitle: DISC_SECTION_TITLE,
            path: `${releaseBase}.links.${linkIndex}.label`,
            label: `Release ${index + 1} - knoptekst link ${linkIndex + 1}`,
            description: itemLabel,
            keywords: buildSearchKeywordSet(commonKeywords, ["knoptekst", "linktekst", "tekst op knop", link.label]),
            itemIndex: index
          },
          {
            id: `release:${index}:link:${linkIndex}:href`,
            kind: "release",
            sectionTitle: DISC_SECTION_TITLE,
            path: `${releaseBase}.links.${linkIndex}.href`,
            label: `Release ${index + 1} - link ${linkIndex + 1}`,
            description: itemLabel,
            keywords: buildSearchKeywordSet(commonKeywords, ["spotify", "apple music", "link", "url", link.href]),
            itemIndex: index
          }
        );
      });
    });

    shows.forEach((show, index) => {
      const showBase = `bookings.upcomingShows.${index}`;
      const itemLabel = [show.venue, show.city].filter(Boolean).join(", ") || `Show ${index + 1}`;
      const commonKeywords = [SHOWS_SECTION_TITLE, itemLabel, "show", "optreden", "concert", "agenda", "live"];
      targets.push(
        {
          id: `show:${index}:date`,
          kind: "show",
          sectionTitle: SHOWS_SECTION_TITLE,
          path: `${showBase}.date`,
          label: `Show ${index + 1} - datum`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["datum", "speeldatum", show.date]),
          itemIndex: index
        },
        {
          id: `show:${index}:venue`,
          kind: "show",
          sectionTitle: SHOWS_SECTION_TITLE,
          path: `${showBase}.venue`,
          label: `Show ${index + 1} - locatie`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["locatie", "zaal", "venue", show.venue]),
          itemIndex: index
        },
        {
          id: `show:${index}:city`,
          kind: "show",
          sectionTitle: SHOWS_SECTION_TITLE,
          path: `${showBase}.city`,
          label: `Show ${index + 1} - plaats`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["plaats", "stad", show.city]),
          itemIndex: index
        },
        {
          id: `show:${index}:tickets`,
          kind: "show",
          sectionTitle: SHOWS_SECTION_TITLE,
          path: `${showBase}.ticketsHref`,
          label: `Show ${index + 1} - tickets link`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["tickets", "tickets knop", "kaartjes"], show.ticketsHref),
          itemIndex: index
        },
        {
          id: `show:${index}:info`,
          kind: "show",
          sectionTitle: SHOWS_SECTION_TITLE,
          path: `${showBase}.infoHref`,
          label: `Show ${index + 1} - extra info link`,
          description: itemLabel,
          keywords: buildSearchKeywordSet(commonKeywords, ["extra info", "meer info", "informatie"], show.infoHref),
          itemIndex: index
        }
      );
    });

    return targets;
  }, [editableFields, managedSectionTitles, releases, shows]);

  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return [];

    const queryTokens = tokenizeSearchText(trimmed);
    if (queryTokens.length === 0) return [];

    return searchTargets
      .map((target) => ({ target, score: scoreSearchTarget(queryTokens, target) }))
      .filter((item) => item.score > 0)
      .sort(
        (left, right) =>
          searchTargetPriority(left.target) - searchTargetPriority(right.target) ||
          right.score - left.score ||
          left.target.label.localeCompare(right.target.label, "nl")
      )
      .slice(0, 10)
      .map((item) => item.target);
  }, [searchQuery, searchTargets]);

  useEffect(() => {
    setOpenSections((previous) => {
      const next: Record<string, boolean> = {};
      for (const sectionTitle of managedSectionTitles) {
        next[sectionTitle] = previous[sectionTitle] ?? false;
      }
      return next;
    });
  }, [managedSectionTitles]);

  useEffect(() => {
    if (managedSectionTitles.length === 0) {
      setVisualSelectedSection(null);
      return;
    }
    setVisualSelectedSection((previous) => (previous && managedSectionTitles.includes(previous) ? previous : managedSectionTitles[0]));
  }, [managedSectionTitles]);

  useEffect(() => {
    const onScroll = () => {
      setIsSectionMenuCompact(window.scrollY > 120);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setActiveSearchIndex(searchResults.length > 0 ? 0 : -1);
  }, [searchResults.length]);

  const isPristine = useMemo(() => {
    if (!content || !initialContent) return true;
    return JSON.stringify(content) === JSON.stringify(initialContent);
  }, [content, initialContent]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isPristine) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (isPristine) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor) return;
      if (anchor.getAttribute("target") === "_blank") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;
      if (href.startsWith("javascript:")) return;

      const confirmed = window.confirm("Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je deze pagina wilt verlaten?");
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [isPristine]);

  const setDirty = () => {
    if (statusTone !== "error") {
      setStatusMessage("Niet-opgeslagen wijzigingen.");
      setStatusTone("neutral");
    }
  };

  const onSetFieldValue = (path: string, value: unknown) => {
    setContent((prev) => (prev ? setValueAtPath(prev, path, value) : prev));
    setFieldErrors((prev) => ({ ...prev, [path]: [] }));
    setDirty();
  };

  const onChangeField = (path: string, value: string) => {
    onSetFieldValue(path, value);
  };

  const onReset = () => {
    if (!initialContent) return;
    setContent(initialContent);
    setFieldErrors({});
    setStatusMessage("Wijzigingen teruggezet.");
    setStatusTone("neutral");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content) return;

    setIsSaving(true);
    setStatusMessage("Opslaan...");
    setStatusTone("neutral");
    setStatusDetails([]);
    setFieldErrors({});

    try {
      const response = await fetch("/api/content/admin/editor-full", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      const payload = (await response.json()) as
        | { ok: true; content: EditorManagedContent; updated_at: string; updated_by: string }
        | ApiError;

      if (!response.ok) {
        const apiError = payload as ApiError;
        const normalizedErrors = normalizeApiFieldErrors(apiError.fieldErrors);
        setFieldErrors(normalizedErrors);
        const summaryLines =
          apiError.validationSummary?.map((item) => `${formatValidationPath(item.path)}: ${item.message}`) ??
          Object.entries(apiError.fieldErrors ?? {})
            .slice(0, 6)
            .map(([path, messages]) => `${formatValidationPath(path)}: ${messages.join(" ")}`);
        setStatusDetails(summaryLines);
        setStatusMessage(apiError.error ?? "Opslaan is niet gelukt. Controleer de velden hieronder.");
        setStatusTone("error");

        const firstPath = Object.keys(normalizedErrors)[0];
        if (firstPath) {
          const firstField = fieldRefs.current[firstPath];
          firstField?.focus();
          firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      if ("content" in payload) {
        const normalizedContent = normalizeEditorContent(payload.content);
        setContent(normalizedContent);
        setInitialContent(normalizedContent);
        setLastSavedAt(payload.updated_at);
        setLastSavedBy(payload.updated_by);
      }

      setStatusMessage("Wijzigingen opgeslagen en live.");
      setStatusTone("success");
      setStatusDetails([]);
    } catch {
      setStatusMessage("Er ging iets mis bij opslaan. Probeer opnieuw.");
      setStatusTone("error");
      setStatusDetails([]);
    } finally {
      setIsSaving(false);
    }
  };

  const loadMediaLibrary = async (options?: { query?: string; tag?: string; kind?: "photo" | "all" }) => {
    setIsMediaLoading(true);
    setMediaError("");

    try {
      const params = new URLSearchParams();
      const query = options?.query ?? mediaQuery;
      const tag = options?.tag ?? mediaTag;
      const kind = options?.kind ?? mediaKind;
      if (query.trim()) params.set("q", query.trim());
      if (tag.trim()) params.set("tag", tag.trim());
      params.set("kind", kind);
      const response = await fetch(`/api/content/admin/media?${params.toString()}`, { method: "GET" });
      const payload = (await response.json()) as { ok?: boolean; files?: MediaFile[]; tags?: string[]; error?: string };

      if (!response.ok || !payload.ok) {
        setMediaError(payload.error ?? "Mediabibliotheek kon niet geladen worden.");
        return;
      }

      setMediaFiles(payload.files ?? []);
      setMediaTags(payload.tags ?? []);
    } catch {
      setMediaError("Mediabibliotheek kon niet geladen worden.");
    } finally {
      setIsMediaLoading(false);
    }
  };

  const openMediaModal = (path: string) => {
    setMediaTargetPath(path);
    setMediaQuery("");
    setMediaTag("");
    setMediaKind("photo");
    setIsMediaModalOpen(true);
    void loadMediaLibrary({ query: "", tag: "", kind: "photo" });
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setMediaTargetPath(null);
    setMediaError("");
  };

  const onSelectMedia = (src: string) => {
    if (!mediaTargetPath) return;
    onChangeField(mediaTargetPath, src);
    closeMediaModal();
  };

  const onUploadMedia = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setIsUploadingMedia(true);
    setMediaError("");

    try {
      const body = new FormData();
      body.append("file", selected);
      if (mediaTag) {
        body.append("tags", mediaTag);
      }

      const response = await fetch("/api/content/admin/media", {
        method: "POST",
        body
      });

      const payload = (await response.json()) as
        | { ok: true; file: { src: string; name: string } }
        | { error?: string };

      if (!response.ok || !("ok" in payload)) {
        const errorPayload = payload as { error?: string };
        setMediaError(errorPayload.error ?? "Uploaden is mislukt.");
        return;
      }

      if (mediaTargetPath) {
        onChangeField(mediaTargetPath, payload.file.src);
      }

      await loadMediaLibrary();
    } catch {
      setMediaError("Uploaden is mislukt.");
    } finally {
      setIsUploadingMedia(false);
      event.target.value = "";
    }
  };

  const getFocusForPath = (srcPath: string) => {
    if (!content) return { x: 50, y: 50 };
    const rawX = readValueAtPath(content, toFocusPath(srcPath, "focusX"));
    const rawY = readValueAtPath(content, toFocusPath(srcPath, "focusY"));
    return {
      x: toNumberInRange(rawX, 50),
      y: toNumberInRange(rawY, 50)
    };
  };

  const setFocusForPath = (srcPath: string, x: number, y: number) => {
    onSetFieldValue(toFocusPath(srcPath, "focusX"), Math.round(toNumberInRange(x, 50)));
    onSetFieldValue(toFocusPath(srcPath, "focusY"), Math.round(toNumberInRange(y, 50)));
  };

  const onDeleteMediaFile = async (src: string) => {
    if (!isManagedLibraryImage(src)) {
      setMediaError("Alleen geuploade bibliotheekfoto's kunnen verwijderd worden.");
      return;
    }

    const confirmed = window.confirm("Weet je zeker dat je deze foto uit de fotobibliotheek wilt verwijderen?");
    if (!confirmed) return;

    setDeletingMediaSrc(src);
    setMediaError("");

    try {
      const response = await fetch("/api/content/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src })
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setMediaError(payload.error ?? "Foto verwijderen is mislukt.");
        return;
      }

      setMediaFiles((prev) => prev.filter((file) => file.src !== src));
      if (mediaTargetPath && typeof readValueAtPath(content, mediaTargetPath) === "string" && readValueAtPath(content, mediaTargetPath) === src) {
        onChangeField(mediaTargetPath, "");
      }
    } catch {
      setMediaError("Foto verwijderen is mislukt.");
    } finally {
      setDeletingMediaSrc(null);
    }
  };

  const addRelease = () => {
    let nextIndex = -1;
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.discography.releases.push({
        title: "Nieuwe release",
        year: String(new Date().getFullYear()),
        format: "Single",
        note: "",
        links: [{ label: "Luister op Spotify", href: "https://" }]
      });
      nextIndex = next.discography.releases.length - 1;
      return next;
    });
    if (nextIndex >= 0) {
      scrollReleaseIntoView(nextIndex);
    }
    setDirty();
  };

  const addShow = () => {
    let nextIndex = -1;
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (!next.bookings.upcomingShows) {
        next.bookings.upcomingShows = [];
      }
      const firstTicketsHref = next.bookings.upcomingShows[0]?.ticketsHref || "";
      const firstInfoHref = next.bookings.upcomingShows[0]?.infoHref || "";
      const nextDate = new Date();
      const month = nextDate.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "");
      const newShow: UpcomingShow = {
        date: `${String(nextDate.getDate()).padStart(2, "0")} ${month} ${nextDate.getFullYear()}`,
        venue: "Nieuwe locatie",
        city: "Plaats",
        ticketsHref: firstTicketsHref,
        infoHref: firstInfoHref
      };
      next.bookings.upcomingShows.push(newShow);
      nextIndex = next.bookings.upcomingShows.length - 1;
      return next;
    });
    if (nextIndex >= 0) {
      scrollShowIntoView(nextIndex);
    }
    setDirty();
  };

  const removeShow = (index: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (!next.bookings.upcomingShows || next.bookings.upcomingShows.length === 0) return prev;
      next.bookings.upcomingShows.splice(index, 1);
      return next;
    });
    setDirty();
  };

  const moveShow = (showIndex: number, direction: "up" | "down") => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const showsList = next.bookings.upcomingShows;
      if (!showsList || showsList.length < 2) return prev;
      const toIndex = direction === "up" ? showIndex - 1 : showIndex + 1;
      if (toIndex < 0 || toIndex >= showsList.length) return prev;
      const [item] = showsList.splice(showIndex, 1);
      showsList.splice(toIndex, 0, item);
      return next;
    });
    scrollShowIntoView(direction === "up" ? showIndex - 1 : showIndex + 1);
    setDirty();
  };

  const updateShowField = (
    showIndex: number,
    key: keyof UpcomingShow,
    value: string
  ) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (!next.bookings.upcomingShows) return prev;
      const show = next.bookings.upcomingShows[showIndex];
      if (!show) return prev;
      show[key] = value;
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((fieldKey) => {
        if (fieldKey.startsWith(`bookings.upcomingShows.${showIndex}.`)) {
          delete next[fieldKey];
        }
      });
      next[`bookings.upcomingShows.${showIndex}.${key}`] = [];
      return next;
    });
    setDirty();
  };

  const moveRelease = (releaseIndex: number, direction: "up" | "down") => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const toIndex = direction === "up" ? releaseIndex - 1 : releaseIndex + 1;
      if (toIndex < 0 || toIndex >= next.discography.releases.length) return prev;
      const [item] = next.discography.releases.splice(releaseIndex, 1);
      next.discography.releases.splice(toIndex, 0, item);
      return next;
    });
    scrollReleaseIntoView(direction === "up" ? releaseIndex - 1 : releaseIndex + 1);
    setDirty();
  };

  const removeRelease = (index: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      if (prev.discography.releases.length === 0) return prev;
      const next = structuredClone(prev);
      next.discography.releases.splice(index, 1);
      return next;
    });
    setDirty();
  };

  const addReleaseLink = (releaseIndex: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.discography.releases[releaseIndex]?.links.push({ label: "Nieuwe link", href: "https://" });
      return next;
    });
    setDirty();
  };

  const removeReleaseLink = (releaseIndex: number, linkIndex: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const links = next.discography.releases[releaseIndex]?.links;
      if (!links || links.length <= 1) return prev;
      links.splice(linkIndex, 1);
      return next;
    });
    setDirty();
  };

  const updateReleaseField = (
    releaseIndex: number,
    key: keyof SiteContent["discography"]["releases"][number],
    value: string
  ) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const release = next.discography.releases[releaseIndex];
      if (!release) return prev;

      if (key === "format") {
        release.format = value as SiteContent["discography"]["releases"][number]["format"];
      } else if (key !== "links") {
        release[key] = value as never;
      }

      return next;
    });
    setFieldErrors((prev) => ({
      ...prev,
      [`discography.releases.${releaseIndex}.${key}`]: []
    }));
    setDirty();
  };

  const updateReleaseLinkField = (releaseIndex: number, linkIndex: number, key: "label" | "href", value: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const link = next.discography.releases[releaseIndex]?.links[linkIndex];
      if (!link) return prev;
      link[key] = value;
      return next;
    });
    setFieldErrors((prev) => ({
      ...prev,
      [`discography.releases.${releaseIndex}.links.${linkIndex}.${key}`]: []
    }));
    setDirty();
  };

  const setAllSectionsOpen = (isOpen: boolean) => {
    setOpenSections(() => {
      const next: Record<string, boolean> = {};
      for (const sectionTitle of managedSectionTitles) {
        next[sectionTitle] = isOpen;
      }
      return next;
    });
  };

  const onToggleSection = (sectionTitle: string, isOpen: boolean) => {
    setOpenSections((previous) => ({ ...previous, [sectionTitle]: isOpen }));
  };

  const onJumpToSection = (sectionTitle: string) => {
    if (editorMode === "visual") {
      setVisualSelectedSection(sectionTitle);
      setVisualSelectedPath(null);
      return;
    }
    setOpenSections((previous) => ({ ...previous, [sectionTitle]: true }));
    const sectionId = sectionToId(sectionTitle);
    const node = sectionRefs.current[sectionId] ?? document.getElementById(sectionId);
    if (!node) return;

    requestAnimationFrame(() => {
      const menuHeight = sectionMenuRef.current?.getBoundingClientRect().height ?? 0;
      const offset = Math.ceil(menuHeight) + 24;
      const targetTop = node.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    });
  };

  const scrollNodeIntoView = (node: HTMLElement | null) => {
    if (!node) return;

    requestAnimationFrame(() => {
      const menuHeight = sectionMenuRef.current?.getBoundingClientRect().height ?? 0;
      const offset = Math.ceil(menuHeight) + 24;
      const targetTop = node.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      requestAnimationFrame(() => {
        if ("focus" in node) {
          node.focus({ preventScroll: true });
        }
      });
    });
  };

  const highlightFieldPath = (path: string) => {
    setHighlightedFieldPath(path);
    if (searchHighlightTimeoutRef.current) {
      window.clearTimeout(searchHighlightTimeoutRef.current);
    }
    searchHighlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedFieldPath((current) => (current === path ? null : current));
    }, 2200);
  };

  const focusFieldPath = (sectionTitle: string, path: string) => {
    setOpenSections((previous) => ({ ...previous, [sectionTitle]: true }));
    if (editorMode === "visual") {
      setEditorMode("form");
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const node = fieldRefs.current[path] ?? fieldContainerRefs.current[path] ?? null;
        scrollNodeIntoView(node);
        highlightFieldPath(path);
      });
    });
  };

  const onSelectSearchResult = (target: SearchTarget) => {
    setSearchQuery("");
    setActiveSearchIndex(-1);

    if (target.kind === "section") {
      onJumpToSection(target.sectionTitle);
      return;
    }

    focusFieldPath(target.sectionTitle, target.path);
  };

  const selectVisualField = (sectionTitle: string, path: string) => {
    setVisualSelectedSection(sectionTitle);
    setVisualSelectedPath(path);
  };

  const visualSectionFields = visualSelectedSection ? groupedFieldsMap.get(visualSelectedSection) ?? [] : [];
  const visualSelectedField =
    visualSelectedPath && visualSectionFields.length > 0
      ? visualSectionFields.find((field) => field.path === visualSelectedPath) ?? null
      : null;

  if (isLoading) {
    return <p className="text-[#d9c6ac]">Inhoud laden...</p>;
  }

  if (!content) {
    return <p className="text-[#ffb4a8]">Geen content gevonden om te bewerken.</p>;
  }

  const statusColorClass =
    statusTone === "success" ? "text-[#b6efb9]" : statusTone === "error" ? "text-[#ffb4a8]" : "text-[#d9c6ac]";
  const editorInputClass =
    "mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]";

  return (
    <section
      aria-labelledby="content-editor-title"
      className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-5 sm:p-6"
    >
      <h2 id="content-editor-title" className="mb-2 font-display text-3xl">
        Website-inhoud
      </h2>
      <p className="mb-4 text-sm text-[#d9c6ac]">Pas hier alle zichtbare website-inhoud aan.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditorMode("form")}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            editorMode === "form"
              ? "border-transparent bg-[var(--color-accent-amber)] text-[var(--color-bg-deep)]"
              : "border-[var(--color-line-muted)] text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
          }`}
          aria-pressed={editorMode === "form"}
        >
          Formuliermodus
        </button>
        <button
          type="button"
          onClick={() => setEditorMode("visual")}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            editorMode === "visual"
              ? "border-transparent bg-[var(--color-accent-amber)] text-[var(--color-bg-deep)]"
              : "border-[var(--color-line-muted)] text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
          }`}
          aria-pressed={editorMode === "visual"}
        >
          Visuele modus
        </button>
      </div>
      <div className="mb-4 rounded-xl border border-[rgba(67,135,133,0.45)] bg-[rgba(18,30,46,0.55)] p-4 text-sm text-[#e7d7c1]">
        <p className="font-semibold text-[#f8f5f1]">Inhoud wijzigen in 2 minuten</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs sm:text-sm">
          {editorMode === "visual" ? (
            <>
              <li>Kies links een sectie en klik in de preview op het onderdeel dat je wilt aanpassen.</li>
              <li>Pas rechts tekst, links of foto&apos;s aan.</li>
              <li>Klik onderaan op <strong>Opslaan</strong>.</li>
              <li>Gebruik <strong>Voorbeeld</strong> om de live weergave te controleren.</li>
            </>
          ) : (
            <>
              <li>Kies een sectie in het sectiemenu.</li>
              <li>Pas tekst, links of foto&apos;s aan.</li>
              <li>Klik onderaan op <strong>Opslaan</strong>.</li>
              <li>Gebruik <strong>Voorbeeld</strong> om de live weergave te controleren.</li>
            </>
          )}
        </ol>
      </div>

      <div
        ref={sectionMenuRef}
        className={`sticky z-30 mb-6 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.92)] shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur transition-all ${
          isSectionMenuCompact ? "top-1 p-2.5" : "top-2 p-4"
        }`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-amber)]">Sectiemenu</p>
            {!isSectionMenuCompact ? <p className="mt-1 text-sm text-[#d9c6ac]">Ga direct naar een sectie en beheer alles zonder scrollen.</p> : null}
            <p className={`${isSectionMenuCompact ? "mt-1" : "mt-2"} text-xs ${statusColorClass}`} aria-live="polite">
              {statusTone === "success" && statusMessage ? <span aria-hidden="true" className="success-pop">✓</span> : null}
              {statusMessage || "Geen openstaande wijzigingen."}
            </p>
          </div>
          {editorMode === "form" ? (
            <div className="grid grid-cols-2 gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setAllSectionsOpen(true)}
                className={`inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.08)] text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.16)] ${
                  isSectionMenuCompact ? "px-3 py-1.5" : "px-4 py-2"
                }`}
              >
                Alles open
              </button>
              <button
                type="button"
                onClick={() => setAllSectionsOpen(false)}
                className={`inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.08)] text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.16)] ${
                  isSectionMenuCompact ? "px-3 py-1.5" : "px-4 py-2"
                }`}
              >
                Alles dicht
              </button>
            </div>
          ) : null}
        </div>

        {!isSectionMenuCompact && statusDetails.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[#ffb4a8]">
            {statusDetails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {!isSectionMenuCompact && statusTone === "error" ? (
          <p className="mt-2 text-xs text-[#ffd1c9]">
            Wat nu? Controleer de gemarkeerde velden hieronder en klik daarna opnieuw op Opslaan.
          </p>
        ) : null}

        <div className={isSectionMenuCompact ? "mt-2" : "mt-4"}>
          {!isSectionMenuCompact ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#d9c6ac]">Zoek veld of inhoud</p> : null}
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (searchResults.length === 0) {
                  if (event.key === "Escape") {
                    setSearchQuery("");
                  }
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveSearchIndex((current) => (current + 1) % searchResults.length);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSearchIndex((current) => (current <= 0 ? searchResults.length - 1 : current - 1));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const target = searchResults[activeSearchIndex] ?? searchResults[0];
                  if (target) {
                    onSelectSearchResult(target);
                  }
                } else if (event.key === "Escape") {
                  setSearchQuery("");
                  setActiveSearchIndex(-1);
                }
              }}
              placeholder="Zoek op foto, quote, spotify, shows, mail, instagram..."
              className={`w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.34)] text-[var(--color-text-primary)] placeholder:text-[#d9c6ac] ${
                isSectionMenuCompact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
              }`}
              aria-label="Zoek naar een veld of sectie in de editor"
            />
            {searchQuery.trim() ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(10,14,22,0.98)] p-2 shadow-[0_16px_32px_rgba(0,0,0,0.4)]">
                {searchResults.length > 0 ? (
                  <ul className="space-y-1">
                    {searchResults.map((result, index) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => onSelectSearchResult(result)}
                          className={`block w-full rounded-lg px-3 py-2 text-left transition-colors ${
                            index === activeSearchIndex
                              ? "bg-[rgba(242,139,14,0.16)] text-[#f8f5f1]"
                              : "text-[var(--color-text-primary)] hover:bg-[rgba(36,58,86,0.5)]"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{result.label}</span>
                          <span className="mt-0.5 block text-xs text-[#d9c6ac]">
                            {result.description}
                            {result.kind !== "section" ? ` · ${result.sectionTitle}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-xs text-[#d9c6ac]">
                    Geen resultaat gevonden. Probeer bijvoorbeeld <span className="font-semibold text-[#f8f5f1]">foto</span>, <span className="font-semibold text-[#f8f5f1]">spotify</span>, <span className="font-semibold text-[#f8f5f1]">quote</span> of <span className="font-semibold text-[#f8f5f1]">bevestigingsmail</span>.
                  </div>
                )}
              </div>
            ) : null}
          </div>
          {!isSectionMenuCompact ? (
            <p className="mt-2 text-xs text-[#d9c6ac]">
              Zoek op gewone taal zoals <span className="font-semibold text-[#f8f5f1]">hero foto</span>, <span className="font-semibold text-[#f8f5f1]">pop-up muziekbalk</span>, <span className="font-semibold text-[#f8f5f1]">tickets knop</span> of <span className="font-semibold text-[#f8f5f1]">instagram</span>.
            </p>
          ) : null}
        </div>

        <div className={isSectionMenuCompact ? "mt-2" : "mt-4"}>
          {!isSectionMenuCompact ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#d9c6ac]">Snel naar sectie</p> : null}
          <div className={`grid gap-2 ${isSectionMenuCompact ? "sm:grid-cols-3 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {managedSectionTitles.map((sectionTitle) => (
              <button
                key={`jump-${sectionTitle}`}
                type="button"
                onClick={() => onJumpToSection(sectionTitle)}
                className={`inline-flex items-center justify-between rounded-lg border text-left font-medium transition-colors ${
                  visualSelectedSection === sectionTitle && editorMode === "visual"
                    ? "border-[var(--color-accent-amber)] bg-[rgba(242,139,14,0.16)] text-[#f8f5f1]"
                    : "border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.34)] text-[var(--color-text-primary)] hover:bg-[rgba(36,58,86,0.5)]"
                } ${
                  isSectionMenuCompact ? "min-h-8 px-2.5 py-1.5 text-xs" : "min-h-10 px-3 py-2 text-sm"
                }`}
              >
                <span className="truncate">{sectionTitle}</span>
                <span aria-hidden="true" className="ml-2 text-xs text-[#d9c6ac]">{editorMode === "visual" ? "✓" : "→"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {editorMode === "visual" ? (
        <div className="mb-6 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_360px]">
          <aside className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.52)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-amber)]">Secties</p>
            <ul className="space-y-2">
              {managedSectionTitles.map((sectionTitle) => (
                <li key={`visual-nav-${sectionTitle}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setVisualSelectedSection(sectionTitle);
                      setVisualSelectedPath(null);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      visualSelectedSection === sectionTitle
                        ? "border-[var(--color-accent-amber)] bg-[rgba(242,139,14,0.16)] text-[#f8f5f1]"
                        : "border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.34)] text-[var(--color-text-primary)] hover:bg-[rgba(36,58,86,0.5)]"
                    }`}
                  >
                    {sectionTitle}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(11,16,25,0.9)] p-4">
            <div className="mx-auto w-full max-w-[980px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#151b26_0%,#0f1420_100%)]">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-4 py-2 text-xs text-[#d9c6ac]">
                <span>Visual Editor Canvas (desktop)</span>
                <span>{visualSelectedSection ?? "Geen sectie"}</span>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-auto p-4">
                {managedSectionTitles.map((sectionTitle) => {
                  const sectionFields = groupedFieldsMap.get(sectionTitle) ?? [];
                  const isSpecialSection = sectionTitle === DISC_SECTION_TITLE || sectionTitle === SHOWS_SECTION_TITLE;
                  const isActiveSection = visualSelectedSection === sectionTitle;
                  return (
                    <article
                      key={`visual-section-${sectionTitle}`}
                      className={`rounded-xl border p-4 transition-colors ${
                        isActiveSection
                          ? "border-[var(--color-accent-amber)] bg-[rgba(242,139,14,0.08)]"
                          : "border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.24)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setVisualSelectedSection(sectionTitle);
                          setVisualSelectedPath(null);
                        }}
                        className="mb-3 text-left font-display text-2xl text-[#f8f5f1]"
                      >
                        {sectionTitle}
                      </button>
                      {isSpecialSection ? (
                        <div className="space-y-2 text-sm text-[#d9c6ac]">
                          {sectionTitle === DISC_SECTION_TITLE ? (
                            <>
                              <p>Aantal releases: {releases.length}</p>
                              {releases.slice(0, 4).map((release, index) => (
                                <button
                                  key={`visual-release-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setVisualSelectedSection(DISC_SECTION_TITLE);
                                    setVisualSelectedPath(`discography.releases.${index}.title`);
                                  }}
                                  className="block w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-left hover:bg-[rgba(36,58,86,0.5)]"
                                >
                                  {index + 1}. {release.title || "Nieuwe release"}
                                </button>
                              ))}
                            </>
                          ) : (
                            <>
                              <p>Aantal shows: {shows.length}</p>
                              {shows.slice(0, 4).map((show, index) => (
                                <button
                                  key={`visual-show-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setVisualSelectedSection(SHOWS_SECTION_TITLE);
                                    setVisualSelectedPath(`bookings.upcomingShows.${index}.venue`);
                                  }}
                                  className="block w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-left hover:bg-[rgba(36,58,86,0.5)]"
                                >
                                  {index + 1}. {show.venue || "Nieuwe show"}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          {sectionFields.slice(0, 12).map((field) => {
                            const isActiveField = visualSelectedPath === field.path;
                            const isImageField = isImageSourcePath(field.path);
                            const imageAltPath = isImageField ? field.path.replace(/\.src$/, ".alt") : "";
                            const imageAltRaw = imageAltPath ? readValueAtPath(content, imageAltPath) : "";
                            const imageAlt = typeof imageAltRaw === "string" && imageAltRaw.trim().length > 0 ? imageAltRaw : "Afbeelding preview";
                            const focusPoint = isImageField ? getFocusForPath(field.path) : { x: 50, y: 50 };

                            return (
                              <button
                                key={`visual-field-${field.path}`}
                                type="button"
                                onClick={() => selectVisualField(sectionTitle, field.path)}
                                className={`rounded-lg border p-3 text-left transition-colors ${
                                  isActiveField
                                    ? "border-[var(--color-accent-amber)] bg-[rgba(242,139,14,0.16)]"
                                    : "border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] hover:bg-[rgba(36,58,86,0.5)]"
                                }`}
                              >
                                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-[#d9c6ac]">{field.label}</p>
                                {isImageField && field.value ? (
                                  <Image
                                    src={field.value}
                                    alt={imageAlt}
                                    width={420}
                                    height={240}
                                    className="h-24 w-full rounded-md object-cover"
                                    style={{ objectPosition: `${focusPoint.x}% ${focusPoint.y}%` }}
                                  />
                                ) : (
                                  <p className="line-clamp-2 text-sm text-[#f8f5f1]">{field.value || "Leeg"}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.52)] p-4">
            <h3 className="mb-2 font-display text-2xl text-[#f8f5f1]">Inspector</h3>
            <p className="mb-4 text-xs text-[#d9c6ac]">
              {visualSelectedPath
                ? "Je bewerkt nu een specifiek onderdeel."
                : "Kies links een sectie of klik in de canvas op tekst/knop/foto."}
            </p>
            {visualSelectedSection === DISC_SECTION_TITLE ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addRelease}
                    className="rounded-full border border-transparent bg-[var(--color-accent-amber)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg-deep)] hover:bg-[var(--color-accent-copper)]"
                  >
                    Release toevoegen
                  </button>
                </div>
                {releases.map((release, index) => (
                  <div key={`visual-release-edit-${index}`} className="rounded-lg border border-[var(--color-line-muted)] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#f8f5f1]">{index + 1}. {release.title || "Nieuwe release"}</p>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveRelease(index, "up")} disabled={index === 0} className="rounded border border-[var(--color-line-muted)] px-2 py-1 text-[11px] disabled:opacity-50">↑</button>
                        <button type="button" onClick={() => moveRelease(index, "down")} disabled={index === releases.length - 1} className="rounded border border-[var(--color-line-muted)] px-2 py-1 text-[11px] disabled:opacity-50">↓</button>
                        <button type="button" onClick={() => removeRelease(index)} className="rounded border border-[var(--color-line-muted)] px-2 py-1 text-[11px]">Verwijder</button>
                      </div>
                    </div>
                    <input value={release.title} onChange={(event) => updateReleaseField(index, "title", event.target.value)} className={editorInputClass} />
                  </div>
                ))}
              </div>
            ) : visualSelectedSection === SHOWS_SECTION_TITLE ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addShow}
                    className="rounded-full border border-transparent bg-[var(--color-accent-amber)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg-deep)] hover:bg-[var(--color-accent-copper)]"
                  >
                    Show toevoegen
                  </button>
                </div>
                {shows.map((show, index) => (
                  <div key={`visual-show-edit-${index}`} className="rounded-lg border border-[var(--color-line-muted)] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#f8f5f1]">{index + 1}. {show.venue || "Nieuwe show"}</p>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveShow(index, "up")} disabled={index === 0} className="rounded border border-[var(--color-line-muted)] px-2 py-1 text-[11px] disabled:opacity-50">↑</button>
                        <button type="button" onClick={() => moveShow(index, "down")} disabled={index === shows.length - 1} className="rounded border border-[var(--color-line-muted)] px-2 py-1 text-[11px] disabled:opacity-50">↓</button>
                        <button type="button" onClick={() => removeShow(index)} className="rounded border border-[var(--color-line-muted)] px-2 py-1 text-[11px]">Verwijder</button>
                      </div>
                    </div>
                    <input value={show.venue} onChange={(event) => updateShowField(index, "venue", event.target.value)} className={editorInputClass} />
                  </div>
                ))}
              </div>
            ) : visualSelectedField ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#d9c6ac]">{visualSelectedField.label}</label>
                {isImageSourcePath(visualSelectedField.path) ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openMediaModal(visualSelectedField.path)}
                      className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                    >
                      Kies uit fotobibliotheek
                    </button>
                    <input
                      value={String(readValueAtPath(content, visualSelectedField.path) ?? "")}
                      onChange={(event) => onChangeField(visualSelectedField.path, event.target.value)}
                      className={editorInputClass}
                    />
                  </div>
                ) : visualSelectedField.multiline ? (
                  <textarea
                    rows={5}
                    value={String(readValueAtPath(content, visualSelectedField.path) ?? "")}
                    onChange={(event) => onChangeField(visualSelectedField.path, event.target.value)}
                    className={`${editorInputClass} min-h-32`}
                  />
                ) : (
                  <input
                    value={String(readValueAtPath(content, visualSelectedField.path) ?? "")}
                    onChange={(event) => onChangeField(visualSelectedField.path, event.target.value)}
                    className={editorInputClass}
                  />
                )}
                {fieldErrors[visualSelectedField.path]?.[0] ? (
                  <p className="text-xs text-[#ffb4a8]">{fieldErrors[visualSelectedField.path]?.[0]}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {visualSectionFields.map((field) => (
                  <button
                    key={`visual-inspector-field-${field.path}`}
                    type="button"
                    onClick={() => setVisualSelectedPath(field.path)}
                    className="block w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.34)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[rgba(36,58,86,0.5)]"
                  >
                    {field.label}
                  </button>
                ))}
                {visualSectionFields.length === 0 ? <p className="text-sm text-[#d9c6ac]">Geen velden gevonden voor deze sectie.</p> : null}
              </div>
            )}
          </aside>
        </div>
      ) : null}

      <div className={editorMode === "form" ? "" : "hidden"}>
      <details
        id={sectionToId(DISC_SECTION_TITLE)}
        ref={(node) => {
          sectionRefs.current[sectionToId(DISC_SECTION_TITLE)] = node;
        }}
        open={openSections[DISC_SECTION_TITLE] ?? false}
        onToggle={(event) => onToggleSection(DISC_SECTION_TITLE, (event.currentTarget as HTMLDetailsElement).open)}
        className="mb-6 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.52)] p-4 [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex w-full cursor-pointer list-none items-center justify-between rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] px-3 py-2 text-base font-semibold text-[#f8f5f1]">
          <span>Releases beheren</span>
          <span aria-hidden="true" className="text-sm text-[#d9c6ac]">Open/dicht</span>
        </summary>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#d9c6ac]">Voeg hier nieuwe liedjes/releases toe of verwijder ze.</p>
          <button
            type="button"
            onClick={addRelease}
            className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-deep)] hover:bg-[var(--color-accent-copper)]"
          >
            Nieuw liedje toevoegen
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {releases.map((release, index) => (
            <li
              key={`release-${index}`}
              ref={(node) => {
                releaseItemRefs.current[index] = node;
              }}
              className="rounded-lg border border-[var(--color-line-muted)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#f8f5f1]">
                  {index + 1}. {release.title || "Nieuwe release"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveRelease(index, "up")}
                    disabled={index === 0}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Omhoog
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRelease(index, "down")}
                    disabled={index === releases.length - 1}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Omlaag
                  </button>
                  <button
                    type="button"
                    onClick={() => addReleaseLink(index)}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                  >
                    Link toevoegen
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRelease(index)}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Titel
                  <input
                    ref={(node) => {
                      fieldRefs.current[`discography.releases.${index}.title`] = node;
                    }}
                    value={release.title}
                    onChange={(event) => updateReleaseField(index, "title", event.target.value)}
                    className={editorInputClass}
                  />
                  {fieldErrors[`discography.releases.${index}.title`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.title`]?.[0]}</span>
                  ) : null}
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Jaar
                  <input
                    ref={(node) => {
                      fieldRefs.current[`discography.releases.${index}.year`] = node;
                    }}
                    value={release.year}
                    onChange={(event) => updateReleaseField(index, "year", event.target.value)}
                    className={editorInputClass}
                  />
                  {fieldErrors[`discography.releases.${index}.year`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.year`]?.[0]}</span>
                  ) : null}
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Type
                  <select
                    ref={(node) => {
                      fieldRefs.current[`discography.releases.${index}.format`] = node;
                    }}
                    value={release.format}
                    onChange={(event) => updateReleaseField(index, "format", event.target.value)}
                    className={editorInputClass}
                  >
                    {RELEASE_FORMAT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {fieldErrors[`discography.releases.${index}.format`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.format`]?.[0]}</span>
                  ) : null}
                </label>
              </div>

              <label className="mt-3 block text-xs font-semibold text-[#d9c6ac]">
                Korte toelichting
                <textarea
                  ref={(node) => {
                    fieldRefs.current[`discography.releases.${index}.note`] = node;
                  }}
                  rows={3}
                  value={release.note}
                  onChange={(event) => updateReleaseField(index, "note", event.target.value)}
                  className={editorInputClass}
                />
                {fieldErrors[`discography.releases.${index}.note`]?.[0] ? (
                  <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.note`]?.[0]}</span>
                ) : null}
              </label>

              <p className="mt-3 text-xs font-semibold text-[#d9c6ac]">Links in deze release: {release.links.length}</p>
              <div className="mt-2 space-y-2">
                {release.links.map((link, linkIndex) => (
                  <div key={`release-link-${index}-${linkIndex}`} className="rounded-lg border border-[var(--color-line-muted)] p-2">
                    <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto] md:items-end">
                      <label className="text-xs font-semibold text-[#d9c6ac]">
                        Linktekst
                        <input
                          ref={(node) => {
                            fieldRefs.current[`discography.releases.${index}.links.${linkIndex}.label`] = node;
                          }}
                          value={link.label}
                          onChange={(event) => updateReleaseLinkField(index, linkIndex, "label", event.target.value)}
                          className={editorInputClass}
                        />
                      </label>
                      <label className="text-xs font-semibold text-[#d9c6ac]">
                        Link URL
                        <input
                          ref={(node) => {
                            fieldRefs.current[`discography.releases.${index}.links.${linkIndex}.href`] = node;
                          }}
                          value={link.href}
                          onChange={(event) => updateReleaseLinkField(index, linkIndex, "href", event.target.value)}
                          className={editorInputClass}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeReleaseLink(index, linkIndex)}
                        disabled={release.links.length <= 1}
                        className="h-10 rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Verwijder
                      </button>
                    </div>
                    {fieldErrors[`discography.releases.${index}.links.${linkIndex}.label`]?.[0] ? (
                      <p className="mt-1 text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.links.${linkIndex}.label`]?.[0]}</p>
                    ) : null}
                    {fieldErrors[`discography.releases.${index}.links.${linkIndex}.href`]?.[0] ? (
                      <p className="mt-1 text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.links.${linkIndex}.href`]?.[0]}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </details>

      <details
        id={sectionToId(SHOWS_SECTION_TITLE)}
        ref={(node) => {
          sectionRefs.current[sectionToId(SHOWS_SECTION_TITLE)] = node;
        }}
        open={openSections[SHOWS_SECTION_TITLE] ?? false}
        onToggle={(event) => onToggleSection(SHOWS_SECTION_TITLE, (event.currentTarget as HTMLDetailsElement).open)}
        className="mb-6 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.52)] p-4 [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex w-full cursor-pointer list-none items-center justify-between rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] px-3 py-2 text-base font-semibold text-[#f8f5f1]">
          <span>Volgende shows beheren</span>
          <span aria-hidden="true" className="text-sm text-[#d9c6ac]">Open/dicht</span>
        </summary>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#d9c6ac]">Voeg shows toe en beheer per show de Tickets-link en Extra info-link.</p>
          <button
            type="button"
            onClick={addShow}
            className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-deep)] hover:bg-[var(--color-accent-copper)]"
          >
            Show toevoegen
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {shows.map((show, index) => (
            <li
              key={`show-${index}`}
              ref={(node) => {
                showItemRefs.current[index] = node;
              }}
              className="rounded-lg border border-[var(--color-line-muted)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#f8f5f1]">
                  {index + 1}. {show.venue || "Nieuwe show"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveShow(index, "up")}
                    disabled={index === 0}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Omhoog
                  </button>
                  <button
                    type="button"
                    onClick={() => moveShow(index, "down")}
                    disabled={index === shows.length - 1}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Omlaag
                  </button>
                  <button
                    type="button"
                    onClick={() => removeShow(index)}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Datum
                  <input
                    ref={(node) => {
                      fieldRefs.current[`bookings.upcomingShows.${index}.date`] = node;
                    }}
                    value={show.date}
                    onChange={(event) => updateShowField(index, "date", event.target.value)}
                    className={editorInputClass}
                  />
                  {fieldErrors[`bookings.upcomingShows.${index}.date`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`bookings.upcomingShows.${index}.date`]?.[0]}</span>
                  ) : null}
                </label>

                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Locatie
                  <input
                    ref={(node) => {
                      fieldRefs.current[`bookings.upcomingShows.${index}.venue`] = node;
                    }}
                    value={show.venue}
                    onChange={(event) => updateShowField(index, "venue", event.target.value)}
                    className={editorInputClass}
                  />
                  {fieldErrors[`bookings.upcomingShows.${index}.venue`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`bookings.upcomingShows.${index}.venue`]?.[0]}</span>
                  ) : null}
                </label>

                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Plaats
                  <input
                    ref={(node) => {
                      fieldRefs.current[`bookings.upcomingShows.${index}.city`] = node;
                    }}
                    value={show.city}
                    onChange={(event) => updateShowField(index, "city", event.target.value)}
                    className={editorInputClass}
                  />
                  {fieldErrors[`bookings.upcomingShows.${index}.city`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`bookings.upcomingShows.${index}.city`]?.[0]}</span>
                  ) : null}
                </label>

                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Tickets link
                  <input
                    ref={(node) => {
                      fieldRefs.current[`bookings.upcomingShows.${index}.ticketsHref`] = node;
                    }}
                    value={show.ticketsHref ?? ""}
                    onChange={(event) => updateShowField(index, "ticketsHref", event.target.value)}
                    className={editorInputClass}
                  />
                  <p className="mt-1 text-xs text-[#d9c6ac]">Laat leeg om geen Tickets-knop te tonen.</p>
                  {fieldErrors[`bookings.upcomingShows.${index}.ticketsHref`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`bookings.upcomingShows.${index}.ticketsHref`]?.[0]}</span>
                  ) : null}
                </label>
              </div>

              <label className="mt-3 block text-xs font-semibold text-[#d9c6ac]">
                Extra info link
                <input
                  ref={(node) => {
                    fieldRefs.current[`bookings.upcomingShows.${index}.infoHref`] = node;
                  }}
                  value={show.infoHref ?? ""}
                  onChange={(event) => updateShowField(index, "infoHref", event.target.value)}
                  className={editorInputClass}
                />
                <p className="mt-1 text-xs text-[#d9c6ac]">Laat leeg om geen Extra info-knop te tonen.</p>
                {fieldErrors[`bookings.upcomingShows.${index}.infoHref`]?.[0] ? (
                  <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`bookings.upcomingShows.${index}.infoHref`]?.[0]}</span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      </details>

      <form id="editor-content-form" onSubmit={onSubmit} className="space-y-5 pb-40">
        {groupedFields.map(([sectionTitle, fields]) => (
          <details
            key={sectionTitle}
            id={sectionToId(sectionTitle)}
            ref={(node) => {
              sectionRefs.current[sectionToId(sectionTitle)] = node;
            }}
            open={openSections[sectionTitle] ?? false}
            onToggle={(event) => onToggleSection(sectionTitle, (event.currentTarget as HTMLDetailsElement).open)}
            className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.36)] p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex w-full cursor-pointer list-none items-center justify-between rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] px-3 py-2 text-base font-semibold text-[#f8f5f1]">
              <span>{sectionTitle}</span>
              <span aria-hidden="true" className="text-sm text-[#d9c6ac]">Open/dicht</span>
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {fields.map((field) => {
                const inputId = `field-${field.path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
                const helperId = `${inputId}-helper`;
                const visibilityHintId = `${inputId}-visibility`;
                const errorId = `${inputId}-error`;
                const error = fieldErrors[field.path]?.[0];
                const visibilityHint = visibilityHintForPath(field.path);
                const describedBy = [field.helper ? helperId : "", visibilityHint ? visibilityHintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
                const showImageTools = isImageSourcePath(field.path);
                const imageAltPath = showImageTools ? field.path.replace(/\.src$/, ".alt") : "";
                const imageAltRaw = imageAltPath ? readValueAtPath(content, imageAltPath) : "";
                const imageAlt = typeof imageAltRaw === "string" && imageAltRaw.trim().length > 0 ? imageAltRaw : "Afbeelding preview";
                const focusPoint = showImageTools ? getFocusForPath(field.path) : { x: 50, y: 50 };
                const isEditingFocus = activeFocusPath === field.path;

                return (
                  <div
                    key={field.path}
                    ref={(node) => {
                      fieldContainerRefs.current[field.path] = node;
                    }}
                    className={`${field.multiline ? "md:col-span-2" : ""} ${highlightedFieldPath === field.path ? "rounded-xl ring-2 ring-[var(--color-accent-amber)] ring-offset-2 ring-offset-[rgba(16,22,33,0.7)]" : ""}`}
                  >
                    <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-[#f8f5f1]">
                      {field.label}
                    </label>
                    {field.multiline ? (
                      <textarea
                        id={inputId}
                        ref={(node) => {
                          fieldRefs.current[field.path] = node;
                        }}
                        rows={4}
                        value={field.value}
                        onChange={(event) => onChangeField(field.path, event.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)]"
                      />
                    ) : showImageTools ? (
                      <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] p-3">
                        <input
                          id={inputId}
                          ref={(node) => {
                            fieldRefs.current[field.path] = node;
                          }}
                          readOnly
                          value={field.value}
                          aria-invalid={Boolean(error)}
                          aria-describedby={describedBy}
                          className="sr-only"
                        />
                        {field.value ? (
                          <button
                            type="button"
                            ref={(node) => {
                              fieldRefs.current[field.path] = node;
                            }}
                            onClick={() => openMediaModal(field.path)}
                            className="block w-full overflow-hidden rounded-lg border border-[var(--color-line-muted)] transition-colors hover:border-[var(--color-accent-copper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(15,24,37,0.9)]"
                            aria-label="Kies een andere foto uit de fotobibliotheek"
                          >
                            <Image
                              src={field.value}
                              alt={imageAlt}
                              width={960}
                              height={640}
                              unoptimized
                              className="h-44 w-full object-cover"
                              style={{ objectPosition: `${focusPoint.x}% ${focusPoint.y}%` }}
                            />
                          </button>
                        ) : (
                          <button
                            type="button"
                            ref={(node) => {
                              fieldRefs.current[field.path] = node;
                            }}
                            onClick={() => openMediaModal(field.path)}
                            className="flex h-44 w-full items-center justify-center rounded-lg border border-dashed border-[var(--color-line-muted)] text-xs text-[#d9c6ac] transition-colors hover:border-[var(--color-accent-copper)] hover:text-[#f8f5f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(15,24,37,0.9)]"
                          >
                            Nog geen afbeelding geselecteerd
                          </button>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openMediaModal(field.path)}
                            className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                          >
                            Kies uit fotobibliotheek
                          </button>
                          {field.value ? (
                            <button
                              type="button"
                              onClick={() => setActiveFocusPath((prev) => (prev === field.path ? null : field.path))}
                              className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                            >
                              {isEditingFocus ? "Focuspunt sluiten" : "Focuspunt aanpassen"}
                            </button>
                          ) : null}
                          {field.value ? (
                            <a
                              href={field.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline underline-offset-2 text-[#d9c6ac]"
                            >
                              Open origineel
                            </a>
                          ) : null}
                        </div>
                        {field.value && isEditingFocus ? (
                          <div className="mt-3 rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.56)] p-3">
                            <p className="text-xs text-[#d9c6ac]">Klik op de foto waar het belangrijkste deel moet blijven staan.</p>
                            <div className="mt-2 grid gap-3 lg:grid-cols-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const x = ((event.clientX - rect.left) / rect.width) * 100;
                                  const y = ((event.clientY - rect.top) / rect.height) * 100;
                                  setFocusForPath(field.path, x, y);
                                }}
                                className="relative overflow-hidden rounded-lg border border-[var(--color-line-muted)]"
                                aria-label="Kies focuspunt op mobiele uitsnede"
                              >
                                <Image
                                  src={field.value}
                                  alt={imageAlt}
                                  width={480}
                                  height={640}
                                  unoptimized
                                  className="h-48 w-full object-cover"
                                  style={{ objectPosition: `${focusPoint.x}% ${focusPoint.y}%` }}
                                />
                                <span
                                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f8f5f1] bg-[rgba(255,153,51,0.65)] shadow-[0_0_0_2px_rgba(10,12,18,0.6)]"
                                  style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }}
                                />
                                <span className="pointer-events-none absolute left-2 top-2 rounded bg-[rgba(10,12,18,0.6)] px-2 py-0.5 text-[10px] text-[#f8f5f1]">
                                  Mobiel
                                </span>
                              </button>
                              <div className="space-y-2">
                                <div className="relative overflow-hidden rounded-lg border border-[var(--color-line-muted)]">
                                  <Image
                                    src={field.value}
                                    alt={imageAlt}
                                    width={640}
                                    height={360}
                                    unoptimized
                                    className="h-28 w-full object-cover"
                                    style={{ objectPosition: `${focusPoint.x}% ${focusPoint.y}%` }}
                                  />
                                  <span className="pointer-events-none absolute left-2 top-2 rounded bg-[rgba(10,12,18,0.6)] px-2 py-0.5 text-[10px] text-[#f8f5f1]">
                                    Desktop
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { label: "Boven", x: 50, y: 15 },
                                    { label: "Midden", x: 50, y: 50 },
                                    { label: "Onder", x: 50, y: 85 },
                                    { label: "Links", x: 20, y: 50 },
                                    { label: "Rechts", x: 80, y: 50 },
                                    { label: "Reset", x: 50, y: 50 }
                                  ].map((preset) => (
                                    <button
                                      key={`${field.path}-${preset.label}`}
                                      type="button"
                                      onClick={() => setFocusForPath(field.path, preset.x, preset.y)}
                                      className="rounded-md border border-[var(--color-line-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[11px] text-[#d9c6ac]">
                                  Focuspunt: X {Math.round(focusPoint.x)}% · Y {Math.round(focusPoint.y)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <input
                        id={inputId}
                        ref={(node) => {
                          fieldRefs.current[field.path] = node;
                        }}
                        type="text"
                        value={field.value}
                        onChange={(event) => onChangeField(field.path, event.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)]"
                      />
                    )}
                    {field.helper ? (
                      <p id={helperId} className="mt-1 text-xs text-[#d9c6ac]">
                        {field.helper}
                      </p>
                    ) : null}
                    {visibilityHint ? (
                      <p id={visibilityHintId} className="mt-1 text-xs text-[rgba(246,210,160,0.92)]">
                        {visibilityHint}
                      </p>
                    ) : null}
                    {error ? (
                      <p id={errorId} className="mt-1 text-sm text-[#ffb4a8]">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </details>
        ))}

      </form>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 mx-auto w-full max-w-[1120px] rounded-xl border border-[var(--color-line-muted)] bg-[rgba(14,19,30,0.94)] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.36)] backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            form="editor-content-form"
            disabled={isSaving || isPristine}
            className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || isPristine}
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Annuleren
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
          >
            Voorbeeld
          </a>
          <p className="text-xs text-[#d9c6ac]">
            Laatst opgeslagen: {lastSavedAt || "onbekend"} {lastSavedBy ? `door ${lastSavedBy}` : ""}
          </p>
        </div>
        <p aria-live="polite" className={`mt-2 text-sm ${statusColorClass}`}>
          {statusTone === "success" && statusMessage ? <span aria-hidden="true" className="success-pop">✓</span> : null}
          {statusMessage || "Geen openstaande wijzigingen."}
        </p>
        {statusTone === "error" ? (
          <p className="mt-1 text-xs text-[#ffd1c9]">Wat nu? Controleer de gemarkeerde velden en klik opnieuw op Opslaan.</p>
        ) : null}
        {statusDetails.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#ffb4a8]">
            {statusDetails.map((item) => (
              <li key={`bottom-${item}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {isMediaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.72)] p-4" role="dialog" aria-modal="true" aria-label="Fotobibliotheek">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(14,19,30,0.98)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line-muted)] px-4 py-3 sm:px-5">
              <div>
                <p className="text-base font-semibold text-[#f8f5f1]">Fotobibliotheek</p>
                <p className="text-xs text-[#d9c6ac]">Kies een bestaande foto of upload een nieuwe.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => mediaUploadInputRef.current?.click()}
                  disabled={isUploadingMedia}
                  className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingMedia ? "Uploaden..." : "Foto uploaden"}
                </button>
                <button
                  type="button"
                  onClick={closeMediaModal}
                  className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                >
                  Sluiten
                </button>
              </div>
              <input
                ref={mediaUploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={onUploadMedia}
                className="sr-only"
              />
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px_180px_auto] sm:items-end">
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Zoek afbeelding
                  <input
                    value={mediaQuery}
                    onChange={(event) => setMediaQuery(event.target.value)}
                    placeholder="Zoek op naam of tag..."
                    className="mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Filter op tag
                  <select
                    value={mediaTag}
                    onChange={(event) => setMediaTag(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  >
                    <option value="">Alle tags</option>
                    {mediaTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Type
                  <select
                    value={mediaKind}
                    onChange={(event) => setMediaKind(event.target.value === "all" ? "all" : "photo")}
                    className="mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  >
                    <option value="photo">Alleen foto&apos;s</option>
                    <option value="all">Alle assets</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void loadMediaLibrary()}
                  className="h-10 rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                >
                  Toepassen
                </button>
              </div>

              {mediaError ? <p className="mb-3 text-sm text-[#ffb4a8]">{mediaError}</p> : null}
              {isMediaLoading ? <p className="text-sm text-[#d9c6ac]">Fotobibliotheek laden...</p> : null}
              {!isMediaLoading && mediaFiles.length === 0 ? (
                <p className="text-sm text-[#d9c6ac]">Nog geen afbeeldingen gevonden.</p>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {mediaFiles.map((file) => (
                  <div
                    key={file.src}
                    className="overflow-hidden rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.6)] text-left"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectMedia(file.src)}
                      className="block w-full text-left transition-colors hover:border-[var(--color-accent-copper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)] focus-visible:ring-inset"
                    >
                      <Image
                        src={file.src}
                        alt={file.name}
                        width={480}
                        height={280}
                        className="h-28 w-full object-cover"
                      />
                      <p className="truncate px-2 py-2 text-[11px] text-[#d9c6ac]" title={file.src}>
                        {file.src}
                      </p>
                    </button>
                    {file.tags.length > 0 || file.kind ? (
                      <div className="flex flex-wrap gap-1 px-2 pb-2">
                        {file.kind ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${
                              file.kind === "photo"
                                ? "border-[rgba(118,203,147,0.4)] text-[#b6efb9]"
                                : "border-[var(--color-line-muted)] text-[#d9c6ac]"
                            }`}
                          >
                            {file.kind === "photo" ? "foto" : "asset"}
                          </span>
                        ) : null}
                        {file.tags.slice(0, 3).map((tag) => (
                          <span key={`${file.src}-${tag}`} className="rounded-full border border-[var(--color-line-muted)] px-2 py-0.5 text-[10px] text-[#d9c6ac]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {isManagedLibraryImage(file.src) ? (
                      <div className="border-t border-[var(--color-line-muted)] px-2 py-2">
                        <button
                          type="button"
                          onClick={() => void onDeleteMediaFile(file.src)}
                          disabled={deletingMediaSrc === file.src}
                          className="w-full rounded-md border border-[rgba(255,136,120,0.45)] px-2 py-1.5 text-[11px] font-semibold text-[#ffc3b8] hover:bg-[rgba(255,136,120,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingMediaSrc === file.src ? "Verwijderen..." : "Verwijder uit bibliotheek"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
