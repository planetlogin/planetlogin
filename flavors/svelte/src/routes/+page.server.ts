// Where to hand control back after a successful login. For a subdomain portal the
// app lives on a different origin (auth.example.com → https://example.com), so we
// prepend this trusted origin to the (path-only) return_to. Empty = same origin
// (path-mount / same-host), in which case return_to stays relative.
export const load = () => ({
  appOrigin: process.env.PLANETLOGIN_APP_ORIGIN || '',
});
