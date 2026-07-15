<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import SiteNav from '$lib/SiteNav.svelte';
  import Footer from '$lib/Footer.svelte';

  let { data } = $props(); // { appOrigin } from +page.server.ts

  // i18n — the global-audience angle: the form re-localizes from the globe pick.
  // Human, localized strings. Per-language entries override the English base, so a
  // language only needs to translate what it wants — the rest falls back to `en`.
  const T: Record<string, Record<string, string>> = {
    en: {
      greet: 'Welcome', sub: 'Pick where you are — we greet you in your language.',
      email: 'Email', pass: 'Password', cta: 'Sign in',
      magic: 'Email me a sign-in link', passkey: 'Sign in with a passkey', or: 'or',
      mfaHint: 'Enter the 6-digit code from your authenticator app.', code: 'Code', verify: 'Verify',
      sent: 'Check your email for a sign-in link.', signedIn: 'Signed in — taking you back…',
      badCreds: 'That email or password doesn’t match.', needEmail: 'Enter your email first.',
      rateLimited: 'Too many attempts — please wait a moment.', unavailable: 'Service unavailable, try again shortly.',
      netErr: 'Network error — check your connection.', passkeyCancel: 'Passkey sign-in cancelled.',
      badCode: 'That code isn’t right — try again.',
      name: 'Name', signup: 'Create account', newHere: 'New here? Create an account',
      haveAccount: 'Already have an account? Sign in',
      emailTaken: 'That email is already registered.', regErr: 'Could not create the account.',
      forgot: 'Forgot your password?',
    },
    es: {
      greet: 'Bienvenido', sub: 'Elige dónde estás — te saludamos en tu idioma.',
      email: 'Email', pass: 'Contraseña', cta: 'Entrar',
      magic: 'Enviarme un enlace de acceso', passkey: 'Entrar con una passkey', or: 'o',
      mfaHint: 'Introduce el código de 6 dígitos de tu app de autenticación.', code: 'Código', verify: 'Verificar',
      sent: 'Revisa tu correo para el enlace de acceso.', signedIn: 'Sesión iniciada — volviendo…',
      badCreds: 'Ese email o contraseña no coincide.', needEmail: 'Escribe tu email primero.',
      rateLimited: 'Demasiados intentos — espera un momento.', unavailable: 'Servicio no disponible, inténtalo en breve.',
      netErr: 'Error de red — revisa tu conexión.', passkeyCancel: 'Acceso con passkey cancelado.',
      badCode: 'Ese código no es correcto — inténtalo de nuevo.',
      name: 'Nombre', signup: 'Crear cuenta', newHere: '¿Nuevo? Crea una cuenta',
      haveAccount: '¿Ya tienes cuenta? Entra',
      emailTaken: 'Ese email ya está registrado.', regErr: 'No se pudo crear la cuenta.',
      forgot: '¿Olvidaste tu contraseña?',
    },
    fr: { greet: 'Bienvenue', sub: 'Choisissez où vous êtes — nous parlons votre langue.', email: 'E-mail', pass: 'Mot de passe', cta: 'Se connecter', forgot: 'Mot de passe oublié ?' },
    de: { greet: 'Willkommen', sub: 'Wähle, wo du bist — wir grüßen in deiner Sprache.', email: 'E-Mail', pass: 'Passwort', cta: 'Anmelden', forgot: 'Passwort vergessen?' },
    pt: { greet: 'Bem-vindo', sub: 'Escolhe onde estás — falamos a tua língua.', email: 'Email', pass: 'Senha', cta: 'Entrar', forgot: 'Esqueceste a palavra-passe?' },
    it: { greet: 'Benvenuto', sub: 'Scegli dove sei — ti salutiamo nella tua lingua.', email: 'Email', pass: 'Password', cta: 'Accedi' },
    ja: { greet: 'ようこそ', sub: '現在地を選んでください。あなたの言語でご案内します。', email: 'メール', pass: 'パスワード', cta: 'ログイン' },
  };
  // Map a downstream error code → a friendly message (localized, en fallback).
  const errMsg = (code: string | undefined) =>
    code === 'invalid_credentials' ? t.badCreds
    : code === 'rate_limited' ? t.rateLimited
    : code === 'downstream_unavailable' ? t.unavailable
    : t.badCreds;

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

  const t = $derived({ ...T.en, ...(T[locale?.language as string] ?? {}) });

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
    if (!email) { msg = t.needEmail; ok = false; return; }
    busy = true; msg = '';
    try {
      await fetch(`${base}/auth/magic/request`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email, locale }),
      });
      ok = true; msg = t.sent;
    } catch { ok = false; msg = t.netErr; }
    finally { busy = false; }
  }

  let mfa = $state(false);
  let code = $state('');
  let mode = $state<'login' | 'register'>('login');
  let name = $state('');

  async function register() {
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/password/register`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, name, locale }),
      });
      const data = await r.json();
      ok = r.ok;
      msg = r.ok ? t.signedIn
        : data.error?.code === 'email_taken' ? t.emailTaken
        : data.error?.code === 'rate_limited' ? t.rateLimited
        : t.regErr;
      if (r.ok) { await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = t.netErr; }
    finally { busy = false; }
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (mode === 'register') { await register(); return; }
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/password/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, locale }),
      });
      const data = await r.json();
      if (r.ok && data.requires === 'totp') { mfa = true; msg = ''; return; }
      ok = r.ok;
      msg = r.ok ? t.signedIn : errMsg(data.error?.code);
      if (r.ok) { await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = t.netErr; }
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
      msg = r.ok ? t.signedIn : t.badCode;
      if (r.ok) { await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = t.netErr; }
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
      msg = r.ok ? t.signedIn : errMsg(data.error?.code);
      if (r.ok) { await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = t.passkeyCancel; }
    finally { busy = false; }
  }

  const oauthStart = (id: string) => {
    const rt = encodeURIComponent(returnTo);
    window.location.href = `${base}/auth/oauth/${id}/start?return_to=${rt}`;
  };
</script>

<div class="stage">
  {#snippet back()}
    <a class="snav-back" href={brand.homeUrl}>← {brand.backLabel ?? 'Volver'}</a>
  {/snippet}
  {#if brand.homeUrl}
    <SiteNav
      brand={{ label: (brand.name ?? 'PlanetLogin').toLowerCase(), href: brand.homeUrl }}
      links={brand.navLinks ?? []}
      over
      right={back}
    />
  {/if}
  <!-- Tier 0 locale memory: remember the picked place on this device and fly back
       to it on return — zero backend. (Per-account memory is a Tier 2 upgrade.) -->
  <planet-login bind:this={globeEl} accent={brand.accent ?? "#f6a13c"} data-url={`${base}/countries-110m.json`} remember fly-to-saved></planet-login>

  <aside class="panel">
    {#if mfa}
      <form class="card" onsubmit={(e) => { e.preventDefault(); totpVerify(); }}>
        <h1>{t.greet}</h1>
        <p class="sub">{t.mfaHint}</p>
        <label for="code">{t.code}</label>
        <input id="code" inputmode="numeric" maxlength="6" bind:value={code} placeholder="123456" autocomplete="one-time-code" />
        <button type="submit" disabled={busy}>{busy ? '…' : t.verify}</button>
        {#if msg}<p class="msg" class:ok class:err={!ok}>{msg}</p>{/if}
      </form>
    {:else}
    <form class="card" onsubmit={submit}>
      <h1>{copy.title ?? t.greet}</h1>
      <p class="sub">{copy.subtitle ?? t.sub}</p>

      {#if mode === 'register'}
        <label for="name">{t.name}</label>
        <input id="name" type="text" bind:value={name} placeholder={t.name} autocomplete="name" />
      {/if}

      <label for="email">{t.email}</label>
      <input id="email" type="email" bind:value={email} placeholder="you@email.com" autocomplete="username" />

      {#if providers.password?.enabled}
        <label for="pass">{t.pass}</label>
        <input id="pass" type="password" bind:value={password} placeholder="••••••••" autocomplete={mode === 'register' ? 'new-password' : 'current-password'} />
        <button type="submit" disabled={busy}>{busy ? '…' : mode === 'register' ? t.signup : t.cta}</button>
        {#if providers.password?.allowRegister}
          <button type="button" class="toggle" onclick={() => { mode = mode === 'register' ? 'login' : 'register'; msg = ''; }}>{mode === 'register' ? t.haveAccount : t.newHere}</button>
        {/if}
        <!-- Recuperar contraseña vive en el downstream (brand.homeUrl + /forgot):
             PlanetLogin no persiste nada, las cuentas y los hashes son suyos. -->
        {#if mode === 'login' && brand.homeUrl}
          <a class="forgot" href={`${brand.homeUrl.replace(/\/$/, '')}/forgot`}>{t.forgot}</a>
        {/if}
      {/if}

      {#if mode === 'login'}
        {#if providers.magicLink?.enabled}
          <button type="button" class="alt" disabled={busy} onclick={magicRequest}>{t.magic}</button>
        {/if}

        {#if providers.passkeys?.enabled || (providers.oauth?.length)}
          <div class="div">{t.or}</div>
        {/if}
        {#if providers.passkeys?.enabled}
          <button type="button" class="soc" disabled={busy} onclick={passkeyLogin}>{t.passkey}</button>
        {/if}
        {#each providers.oauth ?? [] as o}
          <button type="button" class="soc" disabled={busy} onclick={() => oauthStart(o.id)}>Continue with {o.label ?? o.id}</button>
        {/each}
      {/if}

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
</div>

{#if copy.footer}
  <Footer
    brand={{ label: (brand.name ?? 'PlanetLogin').toLowerCase(), href: brand.homeUrl }}
    tagline={copy.footer.tagline}
    mail={copy.footer.mail}
    columns={copy.footer.columns ?? []}
    bottom={copy.footer.bottom}
    note={copy.footer.note}
  />
{/if}

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
  .forgot { display: inline-block; margin-top: .7rem; font-size: .82rem; color: var(--pl-muted, #9aa7bd); text-decoration: none; }
  .forgot:hover { color: var(--pl-accent, #f6a13c); }
  button.toggle { display: block; width: 100%; background: transparent; border: none; box-shadow: none; margin-top: .7rem; padding: 0; font-size: .82rem; color: var(--pl-muted, #9aa7bd); cursor: pointer; }
  button.toggle:hover { color: var(--pl-accent, #f6a13c); }
  .msg { font-size: .82rem; margin: .9rem 0 0; }
  .msg.ok { color: #9ad19a; } .msg.err { color: #ff9b9b; }
  .chips { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: 1.2rem; font-size: .72rem; }
  .chip { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 999px; padding: .2rem .6rem; }
  .chip b { color: var(--pl-accent, #f6a13c); }
  :global(:root) { --snav-accent: var(--pl-accent, #3fb950); --snav-fg: #e6edf3; --snav-muted: #cdd6df;
    --snav-border: rgba(255,255,255,.14); --snav-bg: #0b0e11; --snav-font: var(--pl-font, inherit); }
  .snav-back { color: #e6edf3; text-decoration: none; font-size: .9rem; text-shadow: 0 1px 8px rgba(0,0,0,.65); }
  .snav-back:hover { color: var(--pl-accent, #f6a13c); }
  @media (max-width: 820px) {
    .stage { flex-direction: column; } planet-login { flex: none; height: 50vh; }
    .panel { max-width: none; border-left: 0; border-top: 1px solid rgba(255,255,255,.12); }
  }
</style>
