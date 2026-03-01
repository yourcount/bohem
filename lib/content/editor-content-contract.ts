import { siteContent } from "@/lib/content";
import { sanitizeSiteContent } from "@/lib/content/sanitize-site-content";
import type { SiteContent } from "@/lib/types";

type FieldErrors = Record<string, string[]>;

export const EDITOR_CONTENT_KEYS = [
  "brand",
  "navigation",
  "hero",
  "about",
  "discography",
  "musicExperience",
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

function addFieldError(errors: FieldErrors, path: string, message: string) {
  if (!errors[path]) {
    errors[path] = [];
  }
  errors[path].push(message);
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function validateAndSanitizeByTemplate(input: unknown, template: unknown, path: string, errors: FieldErrors): unknown {
  if (typeof template === "string") {
    if (typeof input !== "string") {
      addFieldError(errors, path, "Moet tekst zijn.");
      return template;
    }

    const nextValue = sanitizeText(input);
    if (template.length > 0 && nextValue.length === 0) {
      addFieldError(errors, path, "Dit veld mag niet leeg zijn.");
    }
    if (nextValue.length > 8000) {
      addFieldError(errors, path, "Tekst is te lang.");
    }
    return nextValue;
  }

  if (typeof template === "number") {
    if (typeof input !== "number" || !Number.isFinite(input)) {
      addFieldError(errors, path, "Moet een geldig getal zijn.");
      return template;
    }
    return input;
  }

  if (typeof template === "boolean") {
    if (typeof input !== "boolean") {
      addFieldError(errors, path, "Moet waar of onwaar zijn.");
      return template;
    }
    return input;
  }

  if (Array.isArray(template)) {
    if (!Array.isArray(input)) {
      addFieldError(errors, path, "Moet een lijst zijn.");
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
      addFieldError(errors, path, "Moet een object zijn.");
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
    navigation: normalized.navigation,
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
    musicExperience: normalized.musicExperience,
    kampvuur: normalized.kampvuur,
    bookings: normalized.bookings,
    contact: normalized.contact,
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
    musicExperience: full.musicExperience,
    kampvuur: full.kampvuur,
    bookings: full.bookings,
    contact: full.contact,
    footer: full.footer
  };

  return stripDisallowedReleaseLinksFromDiscography(editorContent);
}

export function mergeEditorContent(full: SiteContent, editorContent: EditorContent): SiteContent {
  return {
    ...full,
    ...editorContent
  };
}

export function validateAndSanitizeEditorContent(input: unknown): ValidationResult {
  const errors: FieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      fieldErrors: { content: ["Content moet een object zijn."] }
    };
  }

  const raw = input as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const key of EDITOR_CONTENT_KEYS) {
    const sanitizedValue = validateAndSanitizeByTemplate(raw[key], siteContent[key], `content.${key}`, errors);
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
