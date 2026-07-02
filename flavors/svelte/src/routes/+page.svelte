<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';

  let { data } = $props(); // { appOrigin } from +page.server.ts

  // i18n — the global-audience angle: the form re-localizes from the globe pick.
  const T: Record<string, Record<string, string>> = {
    en: { greet: 'Welcome', sub: 'Pick where you are — we greet you in your language.', email: 'Email', pass: 'Password', cta: 'Sign in' },
    es: { greet: 'Bienvenido', sub: 'Elige dónde estás — te saludamos en tu idioma.', email: 'Email', pass: 'Contraseña', cta: 'Entrar' },
    fr: { greet: 'Bienvenue', sub: 'Choisissez où vous êtes — nous parlons votre langue.', email: 'E-mail', pass: 'Mot de passe', cta: 'Se connecter' },
    de: { greet: 'Willkommen', sub: 'Wähle, wo du bist — wir grüßen in deiner Sprache.', email: 'E-Mail', pass: 'Passwort', cta: 'Anmelden' },
    pt: { greet: 'Bem-vindo', sub: 'Escolhe onde estás — falamos a tua língua.', email: 'Email', pass: 'Senha', cta: 'Entrar' },
    it: { greet: 'Benvenuto', sub: 'Scegli dove sei — ti salutiamo nella tua lingua.', email: 'Email', pass: 'Password', cta: 'Accedi' },
    ja: { greet: 'ようこそ', sub: '現在地を選んでください。あなたの言語でご案内します。', email: 'メール', pass: 'パスワード', cta: 'ログイン' },
  };

  let locale = $state<any>(null);
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let msg = $state('');
  let ok = $state(false);
  let providers = $state<any>({ password: { enabled: true } });
  let flyOnLogin = $state(false);
  let brand = $state<any>({});
  let copy = $state<any>({});
  let globeEl: HTMLElement;

  // Same-origin path-mount (e.g. calcat.app/auth): on success, hand control back to
  // the host app. Sanitised to a same-origin path to avoid open redirects.
  let returnTo = '/';
  // returnTo is a sanitised same-origin path; for a subdomain portal we prepend the
  // trusted app origin (data.appOrigin) so login on auth.calcat.app returns to calcat.app.
  function goReturn() { window.location.href = (data.appOrigin || '') + returnTo; }

  const t = $derived(T[locale?.language as string] ?? T.en);

  onMount(async () => {
    // Same-origin path only — mirrors core's safeReturnPath (can't import it client-side:
    // the core bundle pulls node deps). Must start with "/" but not "//" or "/\" (browsers
    // fold "\"→"/", so "/\evil.com" → "//evil.com" → open redirect).
    const rt = new URLSearchParams(location.search).get('return_to');
    if (rt && /^\/[^/\\]/.test(rt)) returnTo = rt;
    await import('@planetlogin/planetlogin'); // registers <planet-login>
    globeEl?.addEventListener('locale', (e: Event) => {
      locale = (e as CustomEvent).detail;
      document.documentElement.lang = locale.language ?? 'en';
    });
    // render from the white-label config (spec §5)
    try {
      const c = await (await fetch(`${base}/auth/config`)).json();
      providers = c.providers ?? providers;
      flyOnLogin = c.locale?.flyToOnLogin ?? false;
      brand = c.brand ?? brand;
      copy = c.copy ?? copy;
      const root = document.documentElement.style;
      if (brand.accent) root.setProperty('--pl-accent', brand.accent);
      if (brand.accentFg) root.setProperty('--pl-accent-fg', brand.accentFg);
      if (brand.accentDark) root.setProperty('--pl-accent-dark', brand.accentDark);
      if (brand.font) root.setProperty('--pl-font', brand.font);
      if (brand.accent) globeEl?.setAttribute('accent', brand.accent);
    } catch {}
  });

  // Tier 2 account memory (gate B): after login, fly the globe to the account's
  // saved place before the app takes over. Needs the saved locale to carry coords.
  async function maybeFlyToAccount() {
    if (!flyOnLogin) return;
    try {
      const p = await (await fetch(`${base}/auth/preferences`)).json();
      const l = p?.locale;
      if (l && typeof l.lat === 'number' && typeof l.lon === 'number') (globeEl as any).flyTo?.(l.lon, l.lat);
    } catch {}
  }

  async function magicRequest() {
    if (!email) { msg = '✗ enter your email'; ok = false; return; }
    busy = true; msg = '';
    try {
      await fetch(`${base}/auth/magic/request`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email, locale }),
      });
      ok = true; msg = '✓ check your email for a sign-in link';
    } catch { ok = false; msg = '✗ network error'; }
    finally { busy = false; }
  }

  let mfa = $state(false);
  let code = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/password/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, locale }),
      });
      const data = await r.json();
      if (r.ok && data.requires === 'totp') { mfa = true; msg = ''; return; }
      ok = r.ok;
      msg = r.ok ? `✓ ${data.user?.email ?? 'signed in'}` : `✗ ${data.error?.code ?? r.status}`;
      if (r.ok) { await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = '✗ network error'; }
    finally { busy = false; }
  }

  async function totpVerify() {
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/totp/verify`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }),
      });
      const data = await r.json();
      ok = r.ok; mfa = !r.ok;
      msg = r.ok ? `✓ ${data.user?.id ?? 'signed in'}` : `✗ ${data.error?.code ?? 'bad code'}`;
      if (r.ok) { await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = '✗ network error'; }
    finally { busy = false; }
  }

  async function passkeyLogin() {
    busy = true; msg = '';
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const options = await (await fetch(`${base}/auth/passkey/challenge`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'auth' }),
      })).json();
      const response = await startAuthentication({ optionsJSON: options });
      const r = await fetch(`${base}/auth/passkey/verify`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ response }),
      });
      const data = await r.json();
      ok = r.ok;
      msg = r.ok ? `✓ ${data.user?.id ?? 'signed in'}` : `✗ ${data.error?.code ?? 'failed'}`;
      if (r.ok) { await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = '✗ passkey cancelled'; }
    finally { busy = false; }
  }

  const oauthStart = (id: string) => {
    const rt = encodeURIComponent(returnTo);
    window.location.href = `${base}/auth/oauth/${id}/start?return_to=${rt}`;
  };
</script>

<div class="stage">
  {#if brand.homeUrl}
    <nav class="pl-nav">
      <a class="pl-brand" href={brand.homeUrl}>{brand.name ?? 'PlanetLogin'}<span class="pl-dot">.</span></a>
      <div class="pl-links">
        {#each brand.navLinks ?? [] as l}<a class="pl-link" href={l.href}>{l.label}</a>{/each}
        <a class="pl-back" href={brand.homeUrl}>← {brand.backLabel ?? 'Volver'}</a>
      </div>
    </nav>
  {/if}
  <!-- Tier 0 locale memory: remember the picked place on this device and fly back
       to it on return — zero backend. (Per-account memory is a Tier 2 upgrade.) -->
  <planet-login bind:this={globeEl} accent={brand.accent ?? "#f6a13c"} data-url={`${base}/countries-110m.json`} remember fly-to-saved></planet-login>

  <aside class="panel">
    {#if mfa}
      <form class="card" onsubmit={(e) => { e.preventDefault(); totpVerify(); }}>
        <h1>{t.greet}</h1>
        <p class="sub">Enter the 6-digit code from your authenticator app.</p>
        <label for="code">Code</label>
        <input id="code" inputmode="numeric" maxlength="6" bind:value={code} placeholder="123456" autocomplete="one-time-code" />
        <button type="submit" disabled={busy}>{busy ? '…' : 'Verify'}</button>
        {#if msg}<p class="msg" class:ok class:err={!ok}>{msg}</p>{/if}
      </form>
    {:else}
    <form class="card" onsubmit={submit}>
      <h1>{copy.title ?? t.greet}</h1>
      <p class="sub">{copy.subtitle ?? t.sub}</p>

      <label for="email">{t.email}</label>
      <input id="email" type="email" bind:value={email} placeholder="you@email.com" autocomplete="username" />

      {#if providers.password?.enabled}
        <label for="pass">{t.pass}</label>
        <input id="pass" type="password" bind:value={password} placeholder="••••••••" autocomplete="current-password" />
        <button type="submit" disabled={busy}>{busy ? '…' : t.cta}</button>
      {/if}

      {#if providers.magicLink?.enabled}
        <button type="button" class="alt" disabled={busy} onclick={magicRequest}>Email me a sign-in link</button>
      {/if}

      {#if providers.passkeys?.enabled || (providers.oauth?.length)}
        <div class="div">or</div>
      {/if}
      {#if providers.passkeys?.enabled}
        <button type="button" class="soc" disabled={busy} onclick={passkeyLogin}>Sign in with a passkey</button>
      {/if}
      {#each providers.oauth ?? [] as o}
        <button type="button" class="soc" disabled={busy} onclick={() => oauthStart(o.id)}>Continue with {o.label ?? o.id}</button>
      {/each}

      {#if msg}<p class="msg" class:ok class:err={!ok}>{msg}</p>{/if}

      {#if locale}
        <div class="chips">
          <span class="chip">{locale.label}</span>
          <span class="chip"><b>{locale.timezone}</b></span>
          <span class="chip"><b>{locale.language}</b></span>
        </div>
      {/if}
    </form>
    {/if}
  </aside>
  {#if brand.homeUrl}
    <footer class="pl-foot">
      {#if (brand.footerLinks ?? []).length}
        {#each brand.footerLinks as l}<a href={l.href}>{l.label}</a>{/each}
        <span class="pl-foot-sep">·</span>
      {/if}
      <span class="pl-foot-note">© {brand.name ?? ''}</span>
    </footer>
  {/if}
</div>

<style>
  :global(body) { font-family: var(--pl-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif); }
  .stage { position: relative; display: flex; height: 100vh; color: #eef2fb; animation: pl-fade .45s ease both; }
  @keyframes pl-fade { from { opacity: 0; } to { opacity: 1; } }
  planet-login { flex: 1 1 auto; min-width: 0; height: 100vh; display: block; }
  .panel { flex: 0 0 380px; max-width: 42vw; background: #0d1422; border-left: 1px solid rgba(255,255,255,.12);
    display: grid; place-items: center; padding: 2rem; }
  .card { width: 100%; max-width: 300px; }
  h1 { font-size: 1.3rem; margin: 0 0 .25rem; }
  .sub { color: #9aa7bd; font-size: .85rem; margin: 0 0 1.4rem; }
  label { display: block; font-size: .78rem; color: #9aa7bd; margin: .8rem 0 .3rem; }
  input { width: 100%; background: #131c2e; border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
    padding: .6rem .7rem; color: #eef2fb; font-size: .95rem; }
  input:focus { outline: 0; border-color: var(--pl-accent, #f6a13c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--pl-accent, #f6a13c) 22%, transparent); }
  button { width: 100%; margin-top: 1.1rem; border: 0; border-radius: 11px; padding: .7rem; font-weight: 700;
    background: var(--pl-accent, #f6a13c); color: var(--pl-accent-fg, #231400); cursor: pointer; font-size: .98rem; }
  button[type="submit"] { box-shadow: 0 5px 0 var(--pl-accent-dark, #256e33);
    transition: transform .22s cubic-bezier(.34,1.65,.5,1), box-shadow .22s cubic-bezier(.34,1.65,.5,1); }
  button[type="submit"]:active { transform: translateY(5px); box-shadow: 0 0 0 var(--pl-accent-dark, #256e33);
    transition: transform .05s, box-shadow .05s; }
  button:disabled { opacity: .6; cursor: progress; }
  button.alt { background: transparent; color: var(--pl-accent, #f6a13c); border: 1px solid var(--pl-accent, #f6a13c); box-shadow: none; margin-top: .6rem; }
  button.soc { background: #131c2e; color: #eef2fb; border: 1px solid rgba(255,255,255,.12); margin-top: .5rem; font-weight: 600; }
  button.soc:hover { border-color: #9aa7bd; }
  .div { display: flex; align-items: center; gap: .6rem; color: #9aa7bd; font-size: .72rem; margin: 1rem 0 .2rem; }
  .div::before, .div::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.12); }
  .msg { font-size: .82rem; margin: .9rem 0 0; }
  .msg.ok { color: #9ad19a; } .msg.err { color: #ff9b9b; }
  .chips { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: 1.2rem; font-size: .72rem; }
  .chip { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 999px; padding: .2rem .6rem; }
  .chip b { color: var(--pl-accent, #f6a13c); }
  .pl-nav { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center;
    justify-content: space-between; padding: 1rem 1.4rem; pointer-events: none; }
  .pl-nav a { pointer-events: auto; text-decoration: none; }
  .pl-brand { font-weight: 700; color: #fff; text-transform: lowercase; text-shadow: 0 1px 8px rgba(0,0,0,.65); }
  .pl-dot { color: var(--pl-accent, #f6a13c); }
  .pl-links { display: flex; align-items: center; gap: 1.3rem; pointer-events: auto; }
  .pl-link { color: #cdd6df; font-size: .85rem; text-shadow: 0 1px 8px rgba(0,0,0,.65); }
  .pl-link:hover { color: var(--pl-accent, #f6a13c); }
  .pl-back { color: #cdd6df; font-size: .85rem; text-shadow: 0 1px 8px rgba(0,0,0,.65); }
  .pl-back:hover { color: var(--pl-accent, #f6a13c); }
  .pl-foot { position: absolute; bottom: .9rem; right: 1.4rem; z-index: 5; font-size: .78rem; color: #9aa7bd;
    display: flex; align-items: center; gap: .8rem; text-shadow: 0 1px 8px rgba(0,0,0,.6); }
  .pl-foot a { color: var(--pl-accent, #f6a13c); text-decoration: none; }
  .pl-foot a:hover { text-decoration: underline; }
  .pl-foot-sep { opacity: .5; }
  @media (max-width: 820px) { .pl-link { display: none; } .pl-foot { display: none; } }
  @media (max-width: 820px) {
    .stage { flex-direction: column; } planet-login { flex: none; height: 50vh; }
    .panel { max-width: none; border-left: 0; border-top: 1px solid rgba(255,255,255,.12); }
  }
</style>
