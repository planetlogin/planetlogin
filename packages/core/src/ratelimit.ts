// Rate limiting — brute-force protection for login / magic-link / TOTP. A fixed
// window counter backed by the pluggable SessionStore (store.incr). Default store
// is "none", whose incr() always returns 1, so rate limiting is OFF until an
// operator configures a real store (memory for single-instance, redis/downstream
// when running >1) — same stateless-by-default stance as the rest of PlanetLogin.
//
// FAIL-OPEN by design: if the store throws, we allow the request. A counter
// outage must not lock everyone out of auth. (Brute force is the lesser risk of
// the two; the store being down is already an incident.)
import type { SessionStore } from './store.ts';

export interface RateLimitRule {
  /** Max attempts allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitDecision {
  ok: boolean;
  /** Attempts left in the current window (0 when blocked). */
  remaining: number;
  /** Seconds the caller should wait before retrying (only meaningful when blocked). */
  retryAfter: number;
  limit: number;
}

/** Built-in defaults (per key, fixed window). Tuned for human use; override via
 *  config.security.rateLimit or PLANETLOGIN_RATELIMIT_* env. */
export const DEFAULT_RULES: Record<string, RateLimitRule> = {
  login: { limit: 10, windowSeconds: 300 },   // 10 / 5 min
  magic: { limit: 5, windowSeconds: 900 },    // 5 / 15 min
  totp: { limit: 10, windowSeconds: 300 },
  anon: { limit: 30, windowSeconds: 300 },    // 30 / 5 min — cheap, but cap spam
};

/**
 * Consume one attempt for `key` under `rule`. `key` should already encode the
 * action and a client discriminator (IP and/or identifier), e.g.
 * `login:203.0.113.7` or `magic:user@x.com`. Builders below help.
 */
export async function rateLimit(
  store: SessionStore,
  key: string,
  rule: RateLimitRule,
): Promise<RateLimitDecision> {
  try {
    const count = await store.incr(`rl:${key}`, rule.windowSeconds);
    const remaining = Math.max(0, rule.limit - count);
    if (count > rule.limit) {
      return { ok: false, remaining: 0, retryAfter: rule.windowSeconds, limit: rule.limit };
    }
    return { ok: true, remaining, retryAfter: 0, limit: rule.limit };
  } catch {
    // Fail open — never let a store outage take auth down.
    return { ok: true, remaining: rule.limit, retryAfter: 0, limit: rule.limit };
  }
}

/** Resolve a rule for an action: config/env override, else built-in default. */
export function ruleFor(
  action: keyof typeof DEFAULT_RULES,
  overrides?: Partial<Record<string, RateLimitRule>>,
): RateLimitRule {
  const envLimit = process.env[`PLANETLOGIN_RATELIMIT_${action.toUpperCase()}_LIMIT`];
  const envWindow = process.env[`PLANETLOGIN_RATELIMIT_${action.toUpperCase()}_WINDOW`];
  const base = overrides?.[action] ?? DEFAULT_RULES[action];
  return {
    limit: envLimit ? Number(envLimit) : base.limit,
    windowSeconds: envWindow ? Number(envWindow) : base.windowSeconds,
  };
}

/** Build a rate-limit key from an action + the client discriminators available.
 *  Both IP and identifier are optional; whatever is present is hashed into the key. */
export function rlKey(action: string, parts: { ip?: string | null; identifier?: string | null }): string {
  const disc = [parts.ip, parts.identifier].filter(Boolean).join('|') || 'anon';
  return `${action}:${disc}`;
}

let _warned = false;
/** Warn ONCE at startup if credential providers are enabled but no store backs the
 *  limiter (store=none → incr always returns 1 → the limiter is INERT, so there is
 *  no brute-force protection). Call from the flavor's boot path. */
export function warnIfRateLimitInert(opts: { providersEnabled: boolean; storeKind?: string | null }): void {
  if (_warned) return;
  const inert = !opts.storeKind || opts.storeKind === 'none';
  if (opts.providersEnabled && inert) {
    _warned = true;
    console.warn('[planetlogin] WARNING: rate limiting is INERT — session.store is "none", so login / magic / totp have NO brute-force protection. Set PLANETLOGIN_SESSION_STORE=memory (single instance) or a shared store (redis) when scaled.');
  }
}
