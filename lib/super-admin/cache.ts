export type CacheFieldErrors = Record<string, string[]>;

function addError(errors: CacheFieldErrors, field: string, message: string) {
  if (!errors[field]) errors[field] = [];
  errors[field].push(message);
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function isValidTtl(value: number) {
  return Number.isInteger(value) && value >= 5 && value <= 3600;
}

export function validateCacheSettingsPatch(input: unknown) {
  const fieldErrors: CacheFieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, fieldErrors: { body: ["Body moet een object zijn."] } };
  }

  const raw = input as Record<string, unknown>;
  const patch: { public_content_ttl_seconds?: number; seo_settings_ttl_seconds?: number } = {};

  if ("public_content_ttl_seconds" in raw) {
    const value = Number(raw.public_content_ttl_seconds);
    if (!isValidTtl(value)) addError(fieldErrors, "public_content_ttl_seconds", "TTL moet tussen 5 en 3600 seconden liggen.");
    else patch.public_content_ttl_seconds = value;
  }

  if ("seo_settings_ttl_seconds" in raw) {
    const value = Number(raw.seo_settings_ttl_seconds);
    if (!isValidTtl(value)) addError(fieldErrors, "seo_settings_ttl_seconds", "TTL moet tussen 5 en 3600 seconden liggen.");
    else patch.seo_settings_ttl_seconds = value;
  }

  if (!("public_content_ttl_seconds" in raw) && !("seo_settings_ttl_seconds" in raw)) {
    addError(fieldErrors, "body", "Geen cachevelden opgegeven.");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, fieldErrors };
  }

  return { ok: true as const, patch };
}

export function validateCacheInvalidateBody(input: unknown) {
  const fieldErrors: CacheFieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, fieldErrors: { body: ["Body moet een object zijn."] } };
  }

  const raw = input as Record<string, unknown>;
  const scope = typeof raw.scope === "string" ? sanitizeText(raw.scope) : "";
  const routePathRaw = typeof raw.routePath === "string" ? sanitizeText(raw.routePath) : "";
  const reason = typeof raw.reason === "string" ? sanitizeText(raw.reason).slice(0, 200) : "";

  if (scope !== "sitewide" && scope !== "route") {
    addError(fieldErrors, "scope", "Kies sitewide of route.");
  }

  if (scope === "route") {
    if (!routePathRaw || !routePathRaw.startsWith("/")) {
      addError(fieldErrors, "routePath", "Route moet met een slash beginnen, bijvoorbeeld /.");
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, fieldErrors };
  }

  return {
    ok: true as const,
    value: {
      scope: scope as "sitewide" | "route",
      routePath: scope === "route" ? routePathRaw : null,
      reason: reason || null
    }
  };
}
