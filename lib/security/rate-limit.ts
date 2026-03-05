type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function consumeInMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, remaining: Math.max(limit - current.count, 0), resetAt: current.resetAt };
}

async function callUpstash(command: string[]) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis REST is not configured.");
  }

  const url = `${UPSTASH_REDIS_REST_URL}/${command.map((item) => encodeURIComponent(item)).join("/")}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Upstash command failed (${response.status}).`);
  }

  const payload = (await response.json()) as { result?: unknown };
  return payload.result;
}

async function consumeUpstashRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const namespacedKey = `rl:${key}`;
  const now = Date.now();
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  const incrResult = await callUpstash(["INCR", namespacedKey]);
  const currentCount = Number(incrResult);
  if (!Number.isFinite(currentCount)) {
    throw new Error("Invalid INCR result from Upstash.");
  }

  if (currentCount === 1) {
    await callUpstash(["EXPIRE", namespacedKey, String(windowSeconds)]);
  }

  const ttlResult = await callUpstash(["PTTL", namespacedKey]);
  const ttlMs = Number(ttlResult);
  const effectiveTtlMs = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : windowMs;
  const resetAt = now + effectiveTtlMs;

  if (currentCount > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: Math.max(limit - currentCount, 0),
    resetAt
  };
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await consumeUpstashRateLimit(key, limit, windowMs);
    } catch {
      return consumeInMemoryRateLimit(key, limit, windowMs);
    }
  }

  return consumeInMemoryRateLimit(key, limit, windowMs);
}
