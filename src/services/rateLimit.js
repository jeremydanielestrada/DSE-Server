const buckets = new Map();

function nowMs() {
  return Date.now();
}

function getClientIp(req) {
  const xff = req.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0].trim();
  const realIp = req.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Simple fixed-window in-memory rate limiter.
 * Note: In serverless environments this is best-effort (memory is per-instance).
 */
export function rateLimit(req, { keyPrefix, limit, windowMs }) {
  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  const now = nowMs();
  const windowStart = now - windowMs;

  const entry = buckets.get(key) || { hits: [] };
  entry.hits = entry.hits.filter((t) => t > windowStart);

  if (entry.hits.length >= limit) {
    const oldest = entry.hits[0] || now;
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    buckets.set(key, entry);
    return {
      allowed: false,
      key,
      remaining: 0,
      retryAfterMs,
    };
  }

  entry.hits.push(now);
  buckets.set(key, entry);
  return {
    allowed: true,
    key,
    remaining: Math.max(0, limit - entry.hits.length),
    retryAfterMs: 0,
  };
}

