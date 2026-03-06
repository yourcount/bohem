import type { SiteContent } from "@/lib/types";
import { getCachePolicySafe } from "@/lib/cache/policy";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache/tags";
import { hasRuntimeCacheKey, readRuntimeCache, writeRuntimeCache } from "@/lib/cache/runtime-cache";
import { buildHomeJsonLd } from "@/lib/seo";
import { readSeoSettings, type SeoSettingsPatchDb, type SeoSettingsRow } from "@/lib/db/seo-settings-db";
import { unstable_cache } from "next/cache";

type FieldErrors = Record<string, string[]>;

export type SeoSettings = {
  global_title_template: string;
  global_meta_template: string;
  home_title: string;
  home_description: string;
  home_og_title: string;
  home_og_description: string;
  home_canonical: string;
  home_robots_index: boolean;
  home_robots_follow: boolean;
  home_json_ld_mode: "auto" | "custom";
  home_json_ld_custom: string;
};

const ALLOWED_KEYS = [
  "global_title_template",
  "global_meta_template",
  "home_title",
  "home_description",
  "home_og_title",
  "home_og_description",
  "home_canonical",
  "home_robots_index",
  "home_robots_follow",
  "home_json_ld_mode",
  "home_json_ld_custom"
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

type PatchValidationResult =
  | { ok: true; sanitized: Partial<SeoSettings>; unknownFields: string[] }
  | { ok: false; fieldErrors: FieldErrors; unknownFields: string[] };

function addError(errors: FieldErrors, field: string, message: string) {
  if (!errors[field]) {
    errors[field] = [];
  }
  errors[field].push(message);
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function applyTemplate(value: string, template: string) {
  if (!template.includes("%s")) {
    return value;
  }
  return template.replaceAll("%s", value).trim();
}

function isValidCanonical(value: string) {
  if (value.startsWith("/")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseJsonLdString(input: string) {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false as const, error: "JSON-LD moet een object zijn." };
    }

    const graph = (parsed as Record<string, unknown>)["@graph"];
    if (graph && !Array.isArray(graph)) {
      return { ok: false as const, error: "@graph moet een array zijn als deze is opgegeven." };
    }

    return { ok: true as const, parsed };
  } catch {
    return { ok: false as const, error: "JSON-LD is geen geldige JSON." };
  }
}

export function mapSeoRowToSettings(row: SeoSettingsRow): SeoSettings {
  return {
    global_title_template: row.global_title_template,
    global_meta_template: row.global_meta_template,
    home_title: row.home_title,
    home_description: row.home_description,
    home_og_title: row.home_og_title,
    home_og_description: row.home_og_description,
    home_canonical: row.home_canonical,
    home_robots_index: row.home_robots_index === 1,
    home_robots_follow: row.home_robots_follow === 1,
    home_json_ld_mode: row.home_json_ld_mode,
    home_json_ld_custom: row.home_json_ld_custom ?? ""
  };
}

export function mapSettingsPatchToDbPatch(patch: Partial<SeoSettings>): SeoSettingsPatchDb {
  const dbPatch: SeoSettingsPatchDb = {};
  if (patch.global_title_template !== undefined) dbPatch.global_title_template = patch.global_title_template;
  if (patch.global_meta_template !== undefined) dbPatch.global_meta_template = patch.global_meta_template;
  if (patch.home_title !== undefined) dbPatch.home_title = patch.home_title;
  if (patch.home_description !== undefined) dbPatch.home_description = patch.home_description;
  if (patch.home_og_title !== undefined) dbPatch.home_og_title = patch.home_og_title;
  if (patch.home_og_description !== undefined) dbPatch.home_og_description = patch.home_og_description;
  if (patch.home_canonical !== undefined) dbPatch.home_canonical = patch.home_canonical;
  if (patch.home_robots_index !== undefined) dbPatch.home_robots_index = patch.home_robots_index ? 1 : 0;
  if (patch.home_robots_follow !== undefined) dbPatch.home_robots_follow = patch.home_robots_follow ? 1 : 0;
  if (patch.home_json_ld_mode !== undefined) dbPatch.home_json_ld_mode = patch.home_json_ld_mode;
  if (patch.home_json_ld_custom !== undefined) {
    dbPatch.home_json_ld_custom = patch.home_json_ld_custom.trim().length > 0 ? patch.home_json_ld_custom : null;
  }

  return dbPatch;
}

export function validateSeoSettingsPatch(input: unknown): PatchValidationResult {
  const fieldErrors: FieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, fieldErrors: { body: ["Body moet een object zijn."] }, unknownFields: [] };
  }

  const raw = input as Record<string, unknown>;
  const unknownFields = Object.keys(raw).filter((key) => !ALLOWED_KEYS.includes(key as AllowedKey));

  const sanitized: Partial<SeoSettings> = {};

  for (const key of ALLOWED_KEYS) {
    if (!(key in raw)) continue;

    const value = raw[key];

    if (key === "home_robots_index" || key === "home_robots_follow") {
      if (typeof value !== "boolean") {
        addError(fieldErrors, key, "Kies ja of nee.");
      } else {
        sanitized[key] = value;
      }
      continue;
    }

    if (key === "home_json_ld_mode") {
      if (value !== "auto" && value !== "custom") {
        addError(fieldErrors, key, "Kies een geldige JSON-LD modus.");
      } else {
        sanitized[key] = value;
      }
      continue;
    }

    if (typeof value !== "string") {
      addError(fieldErrors, key, "Moet tekst zijn.");
      continue;
    }

    const next = sanitizeText(value);
    sanitized[key] = next;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, unknownFields };
  }

  return { ok: true, sanitized, unknownFields };
}

export function validateResolvedSeoSettings(settings: SeoSettings) {
  const fieldErrors: FieldErrors = {};

  const stringConstraints: Array<{ key: keyof SeoSettings; min: number; max: number; label: string }> = [
    { key: "global_title_template", min: 2, max: 120, label: "Titel template" },
    { key: "global_meta_template", min: 2, max: 300, label: "Meta template" },
    { key: "home_title", min: 8, max: 90, label: "Home titel" },
    { key: "home_description", min: 20, max: 320, label: "Home beschrijving" },
    { key: "home_og_title", min: 8, max: 110, label: "OG titel" },
    { key: "home_og_description", min: 20, max: 320, label: "OG beschrijving" }
  ];

  for (const rule of stringConstraints) {
    const value = settings[rule.key];
    if (typeof value !== "string") continue;
    if (value.length < rule.min) addError(fieldErrors, rule.key, `${rule.label} is te kort.`);
    if (value.length > rule.max) addError(fieldErrors, rule.key, `${rule.label} is te lang.`);
  }

  if (!settings.global_title_template.includes("%s")) {
    addError(fieldErrors, "global_title_template", "Gebruik %s als placeholder voor de paginatitel.");
  }

  if (!settings.global_meta_template.includes("%s")) {
    addError(fieldErrors, "global_meta_template", "Gebruik %s als placeholder voor de paginabeschrijving.");
  }

  if (!isValidCanonical(settings.home_canonical)) {
    addError(fieldErrors, "home_canonical", "Gebruik een pad (/...) of volledige URL (https://...).");
  }

  if (settings.home_json_ld_mode === "custom") {
    if (!settings.home_json_ld_custom || settings.home_json_ld_custom.length < 2) {
      addError(fieldErrors, "home_json_ld_custom", "Vul JSON-LD in of zet de modus op automatisch.");
    } else if (settings.home_json_ld_custom.length > 20000) {
      addError(fieldErrors, "home_json_ld_custom", "JSON-LD is te groot (max 20.000 tekens).");
    } else {
      const parsed = parseJsonLdString(settings.home_json_ld_custom);
      if (!parsed.ok) {
        addError(fieldErrors, "home_json_ld_custom", parsed.error);
      }
    }
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors
  };
}

export async function getSeoSettingsSafe(): Promise<SeoSettings | null> {
  if (process.env.VERCEL) {
    return getSeoSettingsCached();
  }

  if (hasRuntimeCacheKey("seo_settings")) {
    const cached = readRuntimeCache<SeoSettings | null>("seo_settings");
    return cached;
  }

  try {
    const row = readSeoSettings();
    const resolved = row ? mapSeoRowToSettings(row) : null;
    const policy = getCachePolicySafe();
    writeRuntimeCache("seo_settings", resolved, policy.seoSettingsTtlSeconds);
    return resolved;
  } catch {
    return null;
  }
}

const getSeoSettingsCached = unstable_cache(
  async (): Promise<SeoSettings | null> => {
    try {
      const row = readSeoSettings();
      return row ? mapSeoRowToSettings(row) : null;
    } catch {
      return null;
    }
  },
  ["seo-settings-v1"],
  {
    tags: [CACHE_TAGS.seoSettings],
    revalidate: CACHE_REVALIDATE_SECONDS.seoSettings
  }
);

export function resolveHomeSeo(content: SiteContent, settings: SeoSettings | null) {
  const baseTitle = settings?.home_title || content.meta.title;
  const baseDescription = settings?.home_description || content.meta.description;
  const baseOgTitle = settings?.home_og_title || content.meta.ogTitle || baseTitle;
  const baseOgDescription = settings?.home_og_description || content.meta.ogDescription || baseDescription;

  return {
    title: applyTemplate(baseTitle, settings?.global_title_template || "%s"),
    description: applyTemplate(baseDescription, settings?.global_meta_template || "%s"),
    ogTitle: applyTemplate(baseOgTitle, settings?.global_title_template || "%s"),
    ogDescription: applyTemplate(baseOgDescription, settings?.global_meta_template || "%s"),
    canonical: settings?.home_canonical || content.meta.canonical || "/",
    robotsIndex: settings?.home_robots_index ?? true,
    robotsFollow: settings?.home_robots_follow ?? true
  };
}

export function resolveHomeJsonLd(content: SiteContent, settings: SeoSettings | null) {
  if (!settings || settings.home_json_ld_mode !== "custom") {
    return buildHomeJsonLd(content);
  }

  const parsed = parseJsonLdString(settings.home_json_ld_custom);
  if (!parsed.ok) {
    return buildHomeJsonLd(content);
  }

  return parsed.parsed;
}
