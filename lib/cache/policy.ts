import { readCacheSettings } from "@/lib/db/cache-management-db";

export type CachePolicy = {
  publicContentTtlSeconds: number;
  seoSettingsTtlSeconds: number;
};

const DEFAULT_POLICY: CachePolicy = {
  publicContentTtlSeconds: 90,
  seoSettingsTtlSeconds: 120
};

function clampTtl(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(5, Math.min(3600, Math.floor(value)));
}

export function getCachePolicySafe(): CachePolicy {
  try {
    const row = readCacheSettings();
    if (!row) return DEFAULT_POLICY;

    return {
      publicContentTtlSeconds: clampTtl(row.public_content_ttl_seconds, DEFAULT_POLICY.publicContentTtlSeconds),
      seoSettingsTtlSeconds: clampTtl(row.seo_settings_ttl_seconds, DEFAULT_POLICY.seoSettingsTtlSeconds)
    };
  } catch {
    return DEFAULT_POLICY;
  }
}
