import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { resolveTenant, downstreamFromEnv, emailCheck } from "@planetlogin/core";
import { clientIp } from "$lib/clientIp";

export const POST: RequestHandler = async ({ request }) => {
  const host = request.headers.get("host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant) return json({ error: { code: "unknown_tenant" } }, { status: 404 });

  const cfg = tenant.config;
  if ((cfg.loginFlow ?? "classic") !== "email-first") {
    return json({ error: { code: "not_enabled" } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const identifier = body?.identifier?.trim?.();
  if (!identifier) {
    return json({ error: { code: "missing_identifier" } }, { status: 400 });
  }

  const downstream = tenant.downstream ?? downstreamFromEnv();
  try {
    const result = await emailCheck({ downstream }, identifier, cfg.providers);
    return json(result);
  } catch {
    return json({ error: { code: "downstream_unavailable" } }, { status: 502 });
  }
};
