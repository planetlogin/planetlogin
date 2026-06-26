// Open-redirect defense — the ONE place that decides where a post-login redirect may
// go. Returns a safe SAME-ORIGIN path (always "/"-prefixed); the caller prepends the
// trusted app origin. Used by both the server (oauth round-trip) and the client
// (return_to query). Never validate same-origin by string prefix — that's defeated by
// "https://self.example.com@evil.com" and "https://self.example.com.evil.com".
export function safeReturnPath(to: string | null | undefined, selfOrigin: string): string {
  if (!to) return '/';
  // A bare path: must start with "/" but not "//" or "/\" — browsers fold "\"→"/", so
  // "/\evil.com" would resolve to "//evil.com" (protocol-relative → off-site).
  if (/^\/[^/\\]/.test(to)) return to;
  // An absolute URL: allowed only when its PARSED origin equals ours; reduce to path.
  try {
    const u = new URL(to);
    if (u.origin === selfOrigin) return u.pathname + u.search + u.hash;
  } catch { /* not a valid absolute URL */ }
  return '/';
}
