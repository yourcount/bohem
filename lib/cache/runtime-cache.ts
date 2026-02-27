type CacheKey = "site_content" | "seo_settings" | "feature_flags";

type Entry = {
  value: unknown;
  expiresAt: number;
  createdAt: number;
};

const runtimeCache = new Map<CacheKey, Entry>();

function nowMs() {
  return Date.now();
}

export function readRuntimeCache<T>(key: CacheKey): T | null {
  const entry = runtimeCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    runtimeCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function hasRuntimeCacheKey(key: CacheKey) {
  const entry = runtimeCache.get(key);
  if (!entry) return false;
  if (entry.expiresAt <= nowMs()) {
    runtimeCache.delete(key);
    return false;
  }
  return true;
}

export function writeRuntimeCache<T>(key: CacheKey, value: T, ttlSeconds: number) {
  const safeTtl = Number.isFinite(ttlSeconds) ? Math.max(5, Math.min(3600, Math.floor(ttlSeconds))) : 60;
  const createdAt = nowMs();
  runtimeCache.set(key, {
    value,
    createdAt,
    expiresAt: createdAt + safeTtl * 1000
  });
}

export function invalidateSiteRuntimeCache() {
  const size = runtimeCache.size;
  runtimeCache.clear();
  return { invalidatedEntries: size, invalidatedKeys: ["site_content", "seo_settings", "feature_flags"] as CacheKey[] };
}

export function invalidateRuntimeCacheByRoute(routePath: string) {
  if (routePath === "/") {
    return invalidateSiteRuntimeCache();
  }
  return { invalidatedEntries: 0, invalidatedKeys: [] as CacheKey[] };
}

export function readRuntimeCacheStatus() {
  const keys: Array<{ key: CacheKey; createdAt: string; expiresAt: string; secondsRemaining: number }> = [];
  const now = nowMs();

  for (const [key, entry] of runtimeCache.entries()) {
    const secondsRemaining = Math.max(0, Math.floor((entry.expiresAt - now) / 1000));
    keys.push({
      key,
      createdAt: new Date(entry.createdAt).toISOString(),
      expiresAt: new Date(entry.expiresAt).toISOString(),
      secondsRemaining
    });
  }

  return {
    entries: keys.length,
    keys
  };
}
