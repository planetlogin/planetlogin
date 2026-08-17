import type { DownstreamStore } from "../downstream.ts";

export interface EmailCheckDeps {
  downstream: DownstreamStore;
}

export interface EmailCheckResult {
  exists: boolean;
  methods: string[];
}

export async function emailCheck(
  deps: EmailCheckDeps,
  identifier: string,
  enabledProviders: { password?: { enabled?: boolean }; magicLink?: { enabled?: boolean }; passkeys?: { enabled?: boolean } },
): Promise<EmailCheckResult> {
  let user;
  try {
    user = await deps.downstream.findUser(identifier);
  } catch {
    throw new Error("downstream_unavailable");
  }

  if (!user) return { exists: false, methods: [] };

  const methods: string[] = [];
  if (user.passwordHash && enabledProviders.password?.enabled) methods.push("password");
  if (enabledProviders.magicLink?.enabled) methods.push("magic");
  if (enabledProviders.passkeys?.enabled) methods.push("passkey");
  return { exists: true, methods };
}
