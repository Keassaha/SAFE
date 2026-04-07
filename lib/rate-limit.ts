/**
 * Simple in-memory rate limiter.
 * Tracks requests by key (IP or email) with a sliding window.
 */

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check if a key has exceeded the rate limit.
 * @param key - Unique identifier (IP address, email, etc.)
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns true if rate limited (should block), false if allowed
 */
export function isRateLimited(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    return true;
  }

  return false;
}
