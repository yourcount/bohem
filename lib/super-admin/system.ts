import type { FeatureFlagKey } from "@/lib/db/system-controls-db";

type FieldErrors = Record<string, string[]>;

const ALLOWED_FLAG_KEYS: FeatureFlagKey[] = [
  "enable_kampvuur_section",
  "enable_sticky_listen_bar",
  "enable_mobile_sticky_cta",
  "enable_discography_section"
];

function addError(errors: FieldErrors, field: string, message: string) {
  if (!errors[field]) errors[field] = [];
  errors[field].push(message);
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
    return null;
  }

  return null;
}

export function validateFeatureFlagsPatch(input: unknown) {
  const fieldErrors: FieldErrors = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, fieldErrors: { body: ["Body moet een object zijn."] } };
  }

  const raw = input as Record<string, unknown>;
  const unknown = Object.keys(raw).filter((key) => !ALLOWED_FLAG_KEYS.includes(key as FeatureFlagKey));
  if (unknown.length > 0) {
    return { ok: false as const, fieldErrors: { body: [`Onbekende flags: ${unknown.join(", ")}`] } };
  }

  const patch: Partial<Record<FeatureFlagKey, boolean>> = {};
  for (const key of ALLOWED_FLAG_KEYS) {
    if (!(key in raw)) continue;
    const parsed = coerceBoolean(raw[key]);
    if (parsed === null) {
      addError(fieldErrors, key, "Waarde moet true of false zijn.");
      continue;
    }
    patch[key] = parsed;
  }

  if (Object.keys(patch).length === 0) {
    addError(fieldErrors, "body", "Geen feature flags opgegeven.");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, fieldErrors };
  }

  return { ok: true as const, patch };
}

export function validateTechnicalSettingsPatch(input: unknown) {
  const fieldErrors: FieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, fieldErrors: { body: ["Body moet een object zijn."] } };
  }

  const raw = input as Record<string, unknown>;
  const patch: {
    jobs_enabled?: number;
    jobs_poll_interval_seconds?: number;
    cache_auto_invalidate_on_update?: number;
  } = {};

  if ("jobs_enabled" in raw) {
    if (typeof raw.jobs_enabled !== "boolean") addError(fieldErrors, "jobs_enabled", "Kies ja of nee.");
    else patch.jobs_enabled = raw.jobs_enabled ? 1 : 0;
  }

  if ("cache_auto_invalidate_on_update" in raw) {
    if (typeof raw.cache_auto_invalidate_on_update !== "boolean") {
      addError(fieldErrors, "cache_auto_invalidate_on_update", "Kies ja of nee.");
    } else {
      patch.cache_auto_invalidate_on_update = raw.cache_auto_invalidate_on_update ? 1 : 0;
    }
  }

  if ("jobs_poll_interval_seconds" in raw) {
    const value = Number(raw.jobs_poll_interval_seconds);
    if (!Number.isInteger(value) || value < 10 || value > 3600) {
      addError(fieldErrors, "jobs_poll_interval_seconds", "Kies een waarde tussen 10 en 3600 seconden.");
    } else {
      patch.jobs_poll_interval_seconds = value;
    }
  }

  if (Object.keys(patch).length === 0) {
    addError(fieldErrors, "body", "Geen technische instellingen opgegeven.");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, fieldErrors };
  }

  return { ok: true as const, patch };
}

export function buildSafeEnvironmentProfile() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const siteUrl = sanitizeText(process.env.NEXT_PUBLIC_SITE_URL || "https://musicbybohem.nl");
  const authSecretSet = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);

  return {
    nodeEnv,
    siteUrl,
    authSecretSet,
    authSecretPreview: authSecretSet ? "configured (hidden)" : "missing",
    runtime: "next-app-router",
    region: sanitizeText(process.env.VERCEL_REGION || "local")
  };
}
