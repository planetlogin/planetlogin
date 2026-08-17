import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { emailCheck, rateLimit, getStore, rlKey, ruleFor } from "@planetlogin/core";
import { clientIp } from "$lib/clientIp";
import { tenantDownstream } from "$lib/tenant";

export const POST: RequestHandler = async ({ request, getClientAddress, locals }) => {
  const cfg = locals.tenant.config;
  if ((cfg.loginFlow ?? "classic") !== "email-first") {
    return json({ error: { code: "not_enabled" } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const identifier = body?.identifier?.trim?.();
  if (!identifier) {
    return json({ error: { code: "missing_identifier" } }, { status: 400 });
  }

  const ip = clientIp({ request, getClientAddress });
  const rl = await rateLimit(getStore(), rlKey("email_check", { ip, identifier }), ruleFor("email_check", cfg.security?.rateLimit));
  if (!rl.ok)
    return json({ error: { code: "rate_limited" } }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });

  const downstream = tenantDownstream(locals.tenant);
  try {
    const result = await emailCheck({ downstream }, identifier, cfg.providers);
    return json(result);
  } catch {
    return json({ error: { code: "downstream_unavailable" } }, { status: 502 });
  }
};
