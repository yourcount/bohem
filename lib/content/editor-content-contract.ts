import { siteContent } from "@/lib/content";
import { ensureShowsNavigationItem } from "@/lib/content/navigation";
import { sanitizeSiteContent } from "@/lib/content/sanitize-site-content";
import type { SiteContent } from "@/lib/types";

type FieldErrors = Record<string, string[]>;

export const EDITOR_CONTENT_KEYS = [
  "brand",
  "navigation",
  "hero",
  "about",
  "discography",
  "video",
  "kampvuur",
  "bookings",
  "contact",
  "footer"
] as const;

export type EditorContent = Pick<SiteContent, (typeof EDITOR_CONTENT_KEYS)[number]>;

type ValidationResult =
  | {
      ok: true;
      value: EditorContent;
    }
  | {
      ok: false;
      fieldErrors: FieldErrors;
    };

function stripKampvuurFormatChoiceFields(kampvuur: SiteContent["kampvuur"]): SiteContent["kampvuur"] {
  return Object.fromEntries(
    Object.entries(kampvuur).filter(([key]) => !["packagesTitle", "packages", "packageCta"].includes(key))
  ) as SiteContent["kampvuur"];
}

function stripBookingsRouteChoiceFields(bookings: SiteContent["bookings"]): SiteContent["bookings"] {
  return Object.fromEntries(
    Object.entries(bookings).filter(([key]) => !["routeTitle", "routeItems"].includes(key))
  ) as SiteContent["bookings"];
}

function normalizeContactTemplates(contact: SiteContent["contact"]): SiteContent["contact"] {
  const fallback = siteContent.contact.emailTemplates;
  const incoming = contact.emailTemplates;

  if (!fallback) return contact;

  return {
    ...siteContent.contact,
    ...contact,
    emailTemplates: {
      admin: {
        ...fallback.admin,
        ...(incoming?.admin ?? {})
      },
      sender: {
        ...fallback.sender,
        ...(incoming?.sender ?? {})
      }
    }
  };
}

function addFieldError(errors: FieldErrors, path: string, message: string) {
  if (!errors[path]) {
    errors[path] = [];
  }
  errors[path].push(message);
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

function normalizeDuplicateHttpPrefixes(value: string) {
  let href = value.trim();
  const matches: string[] = [];

  while (true) {
    const match = href.match(/^(https?:)(\/\/)?/i);
    if (!match) break;
    matches.push(match[1].toLowerCase());
    href = href.slice(match[0].length);
    if (!/^(https?:)(\/\/)?/i.test(href)) break;
  }

  if (matches.length <= 1) {
    return value.trim();
  }

  const finalScheme = matches[matches.length - 1];
  return `${finalScheme}//${href.replace(/^\/+/, "")}`;
}

const INTERNAL_ANCHOR_ALIASES: Record<string, string> = {
  bio: "#bio",
  over: "#bio",
  discografie: "#discografie",
  muziek: "#muziek",
  shows: "#shows",
  show: "#shows",
  agenda: "#shows",
  kampvuur: "#kampvuurklanken",
  kampvuurklanken: "#kampvuurklanken",
  boekingen: "#boekingen",
  bookings: "#boekingen",
  pers: "#pers",
  contact: "#contact"
};

const OPTIONAL_EMPTY_TEXT_PATH_SUFFIXES = [".website", ".ticketsHref", ".infoHref"];

function isOptionalEmptyTextPath(path: string) {
  return OPTIONAL_EMPTY_TEXT_PATH_SUFFIXES.some((suffix) => path.endsWith(suffix));
}

const ESSENTIAL_REQUIRED_TEXT_EXACT_PATHS = new Set(["content.meta.locale"]);
const ESSENTIAL_REQUIRED_TEXT_SUFFIXES = [".id", ".type"];

function isEssentialRequiredTextPath(path: string) {
  if (ESSENTIAL_REQUIRED_TEXT_EXACT_PATHS.has(path)) return true;
  return ESSENTIAL_REQUIRED_TEXT_SUFFIXES.some((suffix) => path.endsWith(suffix));
}

const URL_FIELD_KEYS = new Set(["href", "website", "ticketsHref", "infoHref", "kitHref", "embedUrl", "youtubeHref", "instagramHref"]);

function getFieldKeyFromPath(path: string) {
  const clean = path.replace(/^content\./, "");
  const parts = clean.split(".");
  return parts[parts.length - 1] ?? "";
}

function isValidAbsoluteHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikePhone(value: string) {
  const normalized = value.replace(/[\s().-]+/g, "");
  return /^\+?[0-9]{8,}$/.test(normalized);
}

function normalizePhoneHref(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  if (normalized.startsWith("00")) {
    return `+${normalized.slice(2)}`;
  }
  return normalized;
}

function normalizeEditorHrefInput(value: string) {
  const href = normalizeDuplicateHttpPrefixes(value);
  if (!href) return href;
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(href)) return href;

  const normalizedAlias = INTERNAL_ANCHOR_ALIASES[normalizeSearchText(href)];
  if (normalizedAlias) {
    return normalizedAlias;
  }

  if (looksLikeEmail(href)) {
    return `mailto:${href}`;
  }

  if (looksLikePhone(href)) {
    return `tel:${normalizePhoneHref(href)}`;
  }

  return href;
}

function invalidUrlMessage(path: string, fieldKey: string) {
  if (fieldKey === "ticketsHref") {
    return "De Tickets-knop verschijnt pas als hier een geldige link staat.";
  }
  if (fieldKey === "infoHref") {
    return "De Extra info-knop verschijnt pas als hier een geldige link staat.";
  }
  if (fieldKey === "kitHref") {
    return "De perskit-knop werkt alleen met een geldige download- of paginalink.";
  }
  if (fieldKey === "embedUrl") {
    return "Het Spotify afspeelvak werkt alleen met een geldige Spotify embed-link.";
  }
  if (fieldKey === "youtubeHref") {
    return "Het YouTube-icoon in de footer wordt alleen getoond met een geldige link.";
  }
  if (fieldKey === "instagramHref") {
    return "Het Instagram-icoon in de footer wordt alleen getoond met een geldige link.";
  }
  if (fieldKey === "website") {
    return "De websiteknop verschijnt pas als hier een geldige link staat.";
  }
  if (path === "content.discography.featuredSingle.href") {
    return "De knop in de pop-up muziekbalk werkt alleen met een geldige link.";
  }
  return "Deze knop of link werkt alleen met een geldige link.";
}

function isValidEditorHref(value: string) {
  const href = value.trim();
  if (!href) return false;
  if (href.startsWith("#")) return true;
  if (href.startsWith("/")) return !href.startsWith("//");
  if (href.startsWith("mailto:")) return href.length > "mailto:".length;
  if (href.startsWith("tel:")) return href.length > "tel:".length;
  return isValidAbsoluteHttpUrl(href);
}

function validateAndSanitizeByTemplate(input: unknown, template: unknown, path: string, errors: FieldErrors): unknown {
  if (typeof input === "undefined") {
    return structuredClone(template);
  }

  if (typeof template === "string") {
    if (typeof input !== "string") {
      addFieldError(errors, path, "Vul hier tekst in.");
      return template;
    }

    const fieldKey = getFieldKeyFromPath(path);
    const nextValue = URL_FIELD_KEYS.has(fieldKey) ? normalizeEditorHrefInput(sanitizeText(input)) : sanitizeText(input);
    const isOptionalPath = isOptionalEmptyTextPath(path);
    const isEssentialPath = isEssentialRequiredTextPath(path);
    if (!isOptionalPath && isEssentialPath && nextValue.length === 0) {
      addFieldError(errors, path, "Dit veld is essentieel en mag niet leeg zijn.");
    }
    if (nextValue.length > 8000) {
      addFieldError(errors, path, "Deze tekst is te lang.");
    }

    if (URL_FIELD_KEYS.has(fieldKey) && nextValue.length > 0 && !isValidEditorHref(nextValue)) {
      addFieldError(errors, path, invalidUrlMessage(path, fieldKey));
    }
    return nextValue;
  }

  if (typeof template === "number") {
    if (typeof input !== "number" || !Number.isFinite(input)) {
      addFieldError(errors, path, "Vul een geldig getal in.");
      return template;
    }
    return input;
  }

  if (typeof template === "boolean") {
    if (typeof input !== "boolean") {
      addFieldError(errors, path, "Kies ja of nee.");
      return template;
    }
    return input;
  }

  if (Array.isArray(template)) {
    if (!Array.isArray(input)) {
      addFieldError(errors, path, "Gebruik een lijst met items.");
      return template;
    }

    if (template.length === 0) {
      return input;
    }

    return input.map((item, index) => {
      const itemTemplate = template[Math.min(index, template.length - 1)];
      return validateAndSanitizeByTemplate(item, itemTemplate, `${path}.${index}`, errors);
    });
  }

  if (template && typeof template === "object") {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      addFieldError(errors, path, "Dit onderdeel heeft ongeldige gegevens.");
      return template;
    }

    const templateObject = template as Record<string, unknown>;
    const inputObject = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(templateObject)) {
      output[key] = validateAndSanitizeByTemplate(inputObject[key], templateObject[key], `${path}.${key}`, errors);
    }

    const unknownKeys = Object.keys(inputObject).filter((key) => !(key in templateObject));
    for (const key of unknownKeys) {
      addFieldError(errors, `${path}.${key}`, "Onbekend veld.");
    }

    return output;
  }

  return template;
}

function isDisallowedReleaseLinkLabel(label: string) {
  return label.toLowerCase().includes("artiestprofiel");
}

function stripDisallowedReleaseLinksFromDiscography(content: EditorContent): EditorContent {
  const normalized = sanitizeSiteContent({
    ...siteContent,
    ...content
  });

  return {
    brand: normalized.brand,
    navigation: ensureShowsNavigationItem(normalized.navigation, {
      hasShows: (normalized.bookings.upcomingShows?.length ?? 0) > 0
    }),
    hero: normalized.hero,
    about: normalized.about,
    discography: {
      ...normalized.discography,
      releases: normalized.discography.releases.map((release) => {
        const filteredLinks = release.links.filter((link) => !isDisallowedReleaseLinkLabel(link.label));
        return {
          ...release,
          links: filteredLinks.length > 0 ? filteredLinks : release.links
        };
      })
    },
    video: normalized.video,
    kampvuur: stripKampvuurFormatChoiceFields(normalized.kampvuur),
    bookings: stripBookingsRouteChoiceFields(normalized.bookings),
    contact: normalizeContactTemplates(normalized.contact),
    footer: normalized.footer
  };
}

export function pickEditorContent(full: SiteContent): EditorContent {
  const editorContent: EditorContent = {
    brand: full.brand,
    navigation: full.navigation,
    hero: full.hero,
    about: full.about,
    discography: full.discography,
    video: full.video,
    kampvuur: stripKampvuurFormatChoiceFields(full.kampvuur),
    bookings: stripBookingsRouteChoiceFields(full.bookings),
    contact: normalizeContactTemplates(full.contact),
    footer: full.footer
  };

  return stripDisallowedReleaseLinksFromDiscography(editorContent);
}

export function mergeEditorContent(full: SiteContent, editorContent: EditorContent): SiteContent {
  return {
    ...full,
    ...editorContent,
    // Keep non-editor (hidden) kampvuur fields intact when editor payload omits them.
    kampvuur: {
      ...full.kampvuur,
      ...editorContent.kampvuur
    },
    // Keep non-editor (hidden) bookings fields intact when editor payload omits them.
    bookings: {
      ...full.bookings,
      ...editorContent.bookings
    },
    contact: normalizeContactTemplates({
      ...full.contact,
      ...editorContent.contact
    })
  };
}

export function validateAndSanitizeEditorContent(input: unknown): ValidationResult {
  const errors: FieldErrors = {};
  const editorTemplate: SiteContent = {
    ...siteContent,
    kampvuur: stripKampvuurFormatChoiceFields(siteContent.kampvuur),
    bookings: stripBookingsRouteChoiceFields(siteContent.bookings)
  };

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      fieldErrors: { content: ["Content moet een object zijn."] }
    };
  }

  const raw = input as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const key of EDITOR_CONTENT_KEYS) {
    const sanitizedValue = validateAndSanitizeByTemplate(raw[key], editorTemplate[key], `content.${key}`, errors);
    output[key] = sanitizedValue;
  }

  const unknownTopLevel = Object.keys(raw).filter((key) => !EDITOR_CONTENT_KEYS.includes(key as (typeof EDITOR_CONTENT_KEYS)[number]));
  for (const key of unknownTopLevel) {
    addFieldError(errors, `content.${key}`, "Onbekend veld.");
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      fieldErrors: errors
    };
  }

  return {
    ok: true,
    value: stripDisallowedReleaseLinksFromDiscography(output as EditorContent)
  };
}
