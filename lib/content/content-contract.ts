export const CONTENT_FIELD_KEYS = [
  "hero_title",
  "hero_subtitle",
  "about_text",
  "arthur_bio",
  "bettina_bio",
  "booking_cta_label",
  "booking_cta_url",
  "contact_email",
  "hero_image_url"
] as const;

export type ContentFieldKey = (typeof CONTENT_FIELD_KEYS)[number];

export type ContentFields = Record<ContentFieldKey, string>;

type ValidationResult = {
  valid: true;
} | {
  valid: false;
  message: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasLength(value: string, min: number, max: number) {
  const len = value.trim().length;
  return len >= min && len <= max;
}

function isAllowedUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/") || value.startsWith("#");
}

function validateField(key: ContentFieldKey, value: string): ValidationResult {
  switch (key) {
    case "hero_title":
      return hasLength(value, 3, 120) ? { valid: true } : { valid: false, message: "Titel moet tussen 3 en 120 tekens zijn." };
    case "hero_subtitle":
      return hasLength(value, 8, 220) ? { valid: true } : { valid: false, message: "Subtitel moet tussen 8 en 220 tekens zijn." };
    case "about_text":
      return hasLength(value, 20, 3500) ? { valid: true } : { valid: false, message: "Over-tekst moet tussen 20 en 3500 tekens zijn." };
    case "arthur_bio":
      return hasLength(value, 20, 2000) ? { valid: true } : { valid: false, message: "Arthur bio moet tussen 20 en 2000 tekens zijn." };
    case "bettina_bio":
      return hasLength(value, 20, 2000) ? { valid: true } : { valid: false, message: "Bettina bio moet tussen 20 en 2000 tekens zijn." };
    case "booking_cta_label":
      return hasLength(value, 2, 60) ? { valid: true } : { valid: false, message: "CTA label moet tussen 2 en 60 tekens zijn." };
    case "booking_cta_url":
      return isAllowedUrl(value) ? { valid: true } : { valid: false, message: "CTA URL moet beginnen met http(s)://, / of #." };
    case "contact_email":
      return EMAIL_REGEX.test(value) ? { valid: true } : { valid: false, message: "E-mailadres is ongeldig." };
    case "hero_image_url":
      return isAllowedUrl(value) ? { valid: true } : { valid: false, message: "Afbeelding URL moet beginnen met http(s)://, / of #." };
    default:
      return { valid: false, message: "Onbekend veld." };
  }
}

export function sanitizeInputValue(value: string, key: ContentFieldKey): string {
  const withoutControls = value.replace(/[\u0000-\u001F\u007F]/g, " ");
  const singleSpaced = withoutControls.replace(/\s+/g, " ").trim();

  if (key === "contact_email") return singleSpaced.toLowerCase();
  return singleSpaced;
}

export function validateFullContent(fields: ContentFields) {
  const errors: Partial<Record<ContentFieldKey, string[]>> = {};
  for (const key of CONTENT_FIELD_KEYS) {
    const result = validateField(key, fields[key]);
    if (!result.valid) {
      errors[key] = [result.message];
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}

export function validatePatchPayload(input: unknown) {
  const errors: Partial<Record<ContentFieldKey, string[]>> = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, code: "INVALID_BODY", errors: {}, unknownFields: [] as string[], sanitized: {} as Partial<ContentFields> };
  }

  const payload = input as Record<string, unknown>;
  const unknownFields = Object.keys(payload).filter((key) => !CONTENT_FIELD_KEYS.includes(key as ContentFieldKey));
  const sanitized: Partial<ContentFields> = {};

  for (const key of CONTENT_FIELD_KEYS) {
    if (!(key in payload)) continue;
    const raw = payload[key];
    if (typeof raw !== "string") {
      errors[key] = ["Waarde moet tekst zijn."];
      continue;
    }

    const cleaned = sanitizeInputValue(raw, key);
    const result = validateField(key, cleaned);
    if (!result.valid) {
      errors[key] = [result.message];
      continue;
    }

    sanitized[key] = cleaned;
  }

  const hasValidationErrors = Object.keys(errors).length > 0;
  return {
    ok: !hasValidationErrors && unknownFields.length === 0 && Object.keys(sanitized).length > 0,
    code: hasValidationErrors ? "VALIDATION_ERROR" : Object.keys(sanitized).length === 0 ? "NO_FIELDS" : "UNKNOWN_FIELDS",
    errors,
    unknownFields,
    sanitized
  };
}
