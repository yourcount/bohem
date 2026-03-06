import { getCachePolicySafe } from "@/lib/cache/policy";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache/tags";
import { hasRuntimeCacheKey, readRuntimeCache, writeRuntimeCache } from "@/lib/cache/runtime-cache";
import { listFeatureFlags, type FeatureFlagKey } from "@/lib/db/system-controls-db";
import { unstable_cache } from "next/cache";

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

const DEFAULT_FLAGS: FeatureFlags = {
  enable_kampvuur_section: true,
  enable_sticky_listen_bar: true,
  enable_mobile_sticky_cta: true,
  enable_discography_section: true
};

const FEATURE_CACHE_KEY = "feature_flags";

export async function getFeatureFlagsSafe(): Promise<FeatureFlags> {
  if (process.env.VERCEL) {
    return getFeatureFlagsCached();
  }

  if (hasRuntimeCacheKey(FEATURE_CACHE_KEY)) {
    const fromCache = readRuntimeCache<FeatureFlags>(FEATURE_CACHE_KEY);
    if (fromCache) {
      return fromCache;
    }
  }

  try {
    const flags = listFeatureFlags();
    const resolved: FeatureFlags = { ...DEFAULT_FLAGS };

    for (const row of flags) {
      resolved[row.key] = row.enabled === 1;
    }

    const policy = getCachePolicySafe();
    writeRuntimeCache(FEATURE_CACHE_KEY, resolved, policy.publicContentTtlSeconds);

    return resolved;
  } catch {
    return DEFAULT_FLAGS;
  }
}

const getFeatureFlagsCached = unstable_cache(
  async (): Promise<FeatureFlags> => {
    try {
      const flags = listFeatureFlags();
      const resolved: FeatureFlags = { ...DEFAULT_FLAGS };

      for (const row of flags) {
        resolved[row.key] = row.enabled === 1;
      }

      return resolved;
    } catch {
      return DEFAULT_FLAGS;
    }
  },
  ["feature-flags-v1"],
  {
    tags: [CACHE_TAGS.featureFlags],
    revalidate: CACHE_REVALIDATE_SECONDS.featureFlags
  }
);
