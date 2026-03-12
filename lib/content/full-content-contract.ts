import { siteContent } from "@/lib/content";
import type { SiteContent } from "@/lib/types";

type FieldErrors = Record<string, string[]>;

type ValidationResult =
  | {
      ok: true;
      value: SiteContent;
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

const ESSENTIAL_REQUIRED_TEXT_EXACT_PATHS = new Set(["content.meta.locale"]);
const ESSENTIAL_REQUIRED_TEXT_SUFFIXES = [".id", ".type"];

function isEssentialRequiredTextPath(path: string) {
  if (ESSENTIAL_REQUIRED_TEXT_EXACT_PATHS.has(path)) return true;
  return ESSENTIAL_REQUIRED_TEXT_SUFFIXES.some((suffix) => path.endsWith(suffix));
}

function validateAndSanitizeByTemplate(
  input: unknown,
  template: unknown,
  path: string,
  errors: FieldErrors
): unknown {
  if (typeof input === "undefined") {
    return structuredClone(template);
  }

  if (typeof template === "string") {
    if (typeof input !== "string") {
      addFieldError(errors, path, "Vul hier tekst in.");
      return template;
    }

    const nextValue = sanitizeText(input);
    if (isEssentialRequiredTextPath(path) && nextValue.length === 0) {
      addFieldError(errors, path, "Dit veld is essentieel en mag niet leeg zijn.");
    }
    if (nextValue.length > 8000) {
      addFieldError(errors, path, "Deze tekst is te lang.");
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

    return output;
  }

  return template;
}

export function validateAndSanitizeFullSiteContent(input: unknown): ValidationResult {
  const errors: FieldErrors = {};
  const sanitized = validateAndSanitizeByTemplate(input, siteContent, "content", errors) as SiteContent;

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      fieldErrors: errors
    };
  }

  return {
    ok: true,
    value: sanitized
  };
}
