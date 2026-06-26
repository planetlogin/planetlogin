import type { RequestEvent } from '@sveltejs/kit';

// Client IP for rate-limit keying. Behind a proxy (Traefik/nginx) SvelteKit's
// getClientAddress() returns the PROXY ip, collapsing every caller into one bucket.
// When PLANETLOGIN_TRUST_PROXY=true, read the left-most X-Forwarded-For hop instead.
// Only enable it behind a trusted proxy that overwrites XFF — otherwise it's spoofable.
export function clientIp(event: Pick<RequestEvent, 'request' | 'getClientAddress'>): string {
  if (process.env.PLANETLOGIN_TRUST_PROXY === 'true') {
    const xff = event.request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
  }
  return event.getClientAddress();
}
