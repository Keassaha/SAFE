/**
 * Serverless-safe fixed-window rate limiter.
 *
 * In production, configure either Vercel KV or Upstash Redis REST variables:
 * - KV_REST_API_URL + KV_REST_API_TOKEN
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *
 * Local/dev falls back to process memory only.
 */

const memoryStore = new Map<string, { count: number; resetAt: number }>();

type RateLimitResult = {
  limited: boolean;
  remaining: number;
  resetAt: number;
};

function redisRestConfig() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function memoryRateLimit(key: string, maxAttempts: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { limited: false, remaining: Math.max(0, maxAttempts - 1), resetAt };
  }

  entry.count += 1;
  return {
    limited: entry.count > maxAttempts,
    remaining: Math.max(0, maxAttempts - entry.count),
    resetAt: entry.resetAt,
  };
}

async function redisRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const config = redisRestConfig();
  if (!config) return null;

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const resetAt = Date.now() + windowSeconds * 1000;

  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
      ]),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const [incr] = (await response.json()) as Array<{ result?: number | string }>;
    const count = Number(incr?.result ?? 0);

    return {
      limited: count > maxAttempts,
      remaining: Math.max(0, maxAttempts - count),
      resetAt,
    };
  } catch (error) {
    console.error("[rate-limit] Redis REST failed, falling back to memory:", error);
    return null;
  }
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const prefixedKey = `safe:rate-limit:${key}`;
  return (
    (await redisRateLimit(prefixedKey, maxAttempts, windowMs)) ??
    memoryRateLimit(prefixedKey, maxAttempts, windowMs)
  );
}

export async function isRateLimited(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000
): Promise<boolean> {
  return (await checkRateLimit(key, maxAttempts, windowMs)).limited;
}
