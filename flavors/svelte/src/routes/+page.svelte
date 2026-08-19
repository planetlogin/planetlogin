<script lang="ts">
  import { onMount } from 'svelte';
  import { passwordStrength } from '@planetlogin/core/passwordStrength';
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
      continue: 'Continue', back: '← Change email',
      strengthLabels: { very_weak: 'Very weak', weak: 'Weak', fair: 'Fair', strong: 'Strong', very_strong: 'Very strong' },
      remember: 'Remember me',
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
      continue: 'Continuar', back: '← Cambiar email',
      strengthLabels: { very_weak: 'Muy débil', weak: 'Débil', fair: 'Aceptable', strong: 'Fuerte', very_strong: 'Muy fuerte' },
      remember: 'Recuérdame',
    },
    fr: { greet: 'Bienvenue', sub: 'Choisissez où vous êtes — nous parlons votre langue.', email: 'E-mail', pass: 'Mot de passe', cta: 'Se connecter', forgot: 'Mot de passe oublié ?' , continue: 'Continuer', back: '\u2190 Changer d\'e-mail' },
    de: { greet: 'Willkommen', sub: 'Wähle, wo du bist — wir grüßen in deiner Sprache.', email: 'E-Mail', pass: 'Passwort', cta: 'Anmelden', forgot: 'Passwort vergessen?' , continue: 'Weiter', back: '\u2190 E-Mail \u00e4ndern' },
    pt: { greet: 'Bem-vindo', sub: 'Escolhe onde estás — falamos a tua língua.', email: 'Email', pass: 'Senha', cta: 'Entrar', forgot: 'Esqueceste a palavra-passe?' , continue: 'Continuar', back: '\u2190 Alterar email' },
    it: { greet: 'Benvenuto', sub: 'Scegli dove sei — ti salutiamo nella tua lingua.', email: 'Email', pass: 'Password', cta: 'Accedi' , continue: 'Continua', back: '\u2190 Cambia email' },
    ja: { greet: 'ようこそ', sub: '現在地を選んでください。あなたの言語でご案内します。', email: 'メール', pass: 'パスワード', cta: 'ログイン' , continue: '\u7d9a\u884c', back: '\u2190 \u30e1\u30fc\u30eb\u3092\u5909\u66f4' },
  };
  // Map a downstream error code → a friendly message (localized, en fallback).
  const errMsg = (code: string | undefined) =>
    code === 'invalid_credentials' ? t.badCreds
    : code === 'rate_limited' ? t.rateLimited
    : code === 'downstream_unavailable' ? t.unavailable
    : t.badCreds;


  const oauthIcons: Record<string, string> = {
    google: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    github: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>',
    apple: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.24 16.7 4.89 10.9 8.7 10.64c1.26.07 2.13.72 2.91.78.97-.2 1.9-.75 2.93-.68 1.24.1 2.17.58 2.78 1.47-2.55 1.53-1.95 4.88.52 5.82-.49 1.3-.99 2.58-1.79 3.25zM12.16 10.57C12 8.15 13.97 6.14 16.26 6c.32 2.68-2.44 4.68-4.1 4.57z"/></svg>',
    microsoft: '<svg viewBox="0 0 24 24" width="18" height="18"><rect fill="#F25022" x="2" y="2" width="9.5" height="9.5"/><rect fill="#7FBA00" x="12.5" y="2" width="9.5" height="9.5"/><rect fill="#00A4EF" x="2" y="12.5" width="9.5" height="9.5"/><rect fill="#FFB900" x="12.5" y="12.5" width="9.5" height="9.5"/></svg>',
    gitlab: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#E24329" d="m12 21.35-3.2-9.83h6.4z"/><path fill="#FC6D26" d="m12 21.35-3.2-9.83H2.32z"/><path fill="#FCA326" d="M2.32 11.52 1.14 15.2a.81.81 0 0 0 .3.9L12 21.35z"/><path fill="#E24329" d="M2.32 11.52h6.48L6.36 3.74a.4.4 0 0 0-.77 0z"/><path fill="#FC6D26" d="m12 21.35 3.2-9.83h6.48z"/><path fill="#FCA326" d="m21.68 11.52 1.18 3.68a.81.81 0 0 1-.3.9L12 21.35z"/><path fill="#E24329" d="M21.68 11.52h-6.48l2.44-7.78a.4.4 0 0 1 .77 0z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#5865F2" d="M19.27 5.33A18.17 18.17 0 0 0 14.89 4a12.58 12.58 0 0 0-.57 1.16 16.85 16.85 0 0 0-5.06 0c-.18-.39-.37-.77-.57-1.15A18.15 18.15 0 0 0 4.37 5.7 19.3 19.3 0 0 0 1.2 17.78a18.39 18.39 0 0 0 5.6 2.83 13.17 13.17 0 0 0 1.17-1.9 11.73 11.73 0 0 1-1.86-.89c.16-.11.31-.23.46-.35a13.25 13.25 0 0 0 11.4 0c.15.12.3.24.46.35a11.73 11.73 0 0 1-1.86.89c.35.67.74 1.3 1.17 1.9a18.36 18.36 0 0 0 5.6-2.83A19.31 19.31 0 0 0 19.27 5.33zM8.01 15.33c-1.18 0-2.15-1.09-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.2 0 2.17 1.09 2.15 2.42 0 1.33-.95 2.42-2.15 2.42zm7.98 0c-1.18 0-2.15-1.09-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.2 0 2.17 1.09 2.15 2.42 0 1.33-.95 2.42-2.15 2.42z"/></svg>',
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
  function goReturn() {
    if (embed) {
      const target = embedOrigins[0] || '*';
      window.parent.postMessage({ type: 'planetlogin:login', token: lastToken, user: lastUser }, target);
      return;
    }
    window.location.href = (data.appOrigin || '') + returnTo;
  }

  const t = $derived({ ...T.en, ...(T[locale?.language as string] ?? {}) });

  onMount(async () => {
    // Same-origin path only — mirrors core's safeReturnPath (can't import it client-side:
    // the core bundle pulls node deps). Must start with "/" but not "//" or "/\" (browsers
    // fold "\"→"/", so "/\evil.com" → "//evil.com" → open redirect).
    embed = new URLSearchParams(location.search).get('mode') === 'embed';
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
      loginFlow = c.loginFlow ?? 'classic';
      embedOrigins = c.embed?.allowedOrigins ?? [];
      const root = document.documentElement.style;
      if (brand.accent) root.setProperty('--pl-accent', brand.accent);
      if (brand.accentFg) root.setProperty('--pl-accent-fg', brand.accentFg);
      if (brand.accentDark) root.setProperty('--pl-accent-dark', brand.accentDark);
      if (brand.font) root.setProperty('--pl-font', brand.font);
      if (brand.accent) globeEl?.setAttribute('accent', brand.accent);
    } catch {}

    // Embed auto-resize: notify parent of content height changes
    if (embed) {
      const notify = () => {
        const h = document.body.scrollHeight;
        window.parent.postMessage({ type: 'planetlogin:resize', height: h }, embedOrigins[0] || '*');
      };
      notify();
      new ResizeObserver(notify).observe(document.body);
    }
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
  let strength = $derived(password ? passwordStrength(password, providers.password?.minPasswordLength) : null);
  let loginFlow = $state<'classic' | 'email-first'>('classic');
  let embed = $state(false);
  let embedOrigins = $state<string[]>([]);
  let lastToken = $state('');
  let lastUser = $state<any>(null);
  let step = $state<'email' | 'credentials' | 'register'>('email');
  let rememberMe = $state(false);

  async function register() {
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/password/register`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, name, locale, rememberMe }),
      });
      const data = await r.json();
      ok = r.ok;
      msg = r.ok ? t.signedIn
        : data.error?.code === 'email_taken' ? t.emailTaken
        : data.error?.code === 'rate_limited' ? t.rateLimited
        : t.regErr;
      if (r.ok) { lastToken = data.token; lastUser = data.user; await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = t.netErr; }
    finally { busy = false; }
  }

  async function checkEmail() {
    if (!email) { msg = t.needEmail; ok = false; return; }
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/email/check`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email }),
      });
      const data = await r.json();
      if (!r.ok) { ok = false; msg = data.error?.code === 'rate_limited' ? t.rateLimited : t.unavailable; return; }
      step = data.exists ? 'credentials' : 'register';
      mode = data.exists ? 'login' : 'register';
    } catch { ok = false; msg = t.netErr; }
    finally { busy = false; }
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (loginFlow === 'email-first' && step === 'email') { await checkEmail(); return; }
    if (mode === 'register') { await register(); return; }
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/password/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, locale, rememberMe }),
      });
      const data = await r.json();
      if (r.ok && data.requires === 'totp') { mfa = true; msg = ''; return; }
      ok = r.ok;
      msg = r.ok ? t.signedIn : errMsg(data.error?.code);
      if (r.ok) { lastToken = data.token; lastUser = data.user; await maybeFlyToAccount(); goReturn(); }
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
      if (r.ok) { lastToken = data.token; lastUser = data.user; await maybeFlyToAccount(); goReturn(); }
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
      if (r.ok) { lastToken = data.token; lastUser = data.user; await maybeFlyToAccount(); goReturn(); }
    } catch { ok = false; msg = t.passkeyCancel; }
    finally { busy = false; }
  }

  const oauthStart = (id: string) => {
    const rt = encodeURIComponent(returnTo);
    window.location.href = `${base}/auth/oauth/${id}/start?return_to=${rt}`;
  };
</script>

<div class="stage" class:embed>
  {#if !embed}
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
  {/if}

  <aside class="panel" class:embed>
    {#if mfa}
      <form class="card" onsubmit={(e) => { e.preventDefault(); totpVerify(); }} aria-label="Two-factor authentication">
        <h1>{t.greet}</h1>
        <p class="sub">{t.mfaHint}</p>
        <label for="code">{t.code}</label>
        <input id="code" inputmode="numeric" maxlength="6" bind:value={code} placeholder="123456" autocomplete="one-time-code" />
        <button type="submit" disabled={busy} aria-busy={busy}>{busy ? '…' : t.verify}</button>
        {#if msg}<p class="msg" class:ok class:err={!ok} role="alert" aria-live="polite">{msg}</p>{/if}
      </form>
    {:else}
    <form class="card" onsubmit={submit} aria-label="Sign in">
      <h1>{copy.title ?? t.greet}</h1>
      <p class="sub">{copy.subtitle ?? t.sub}</p>

      {#if loginFlow === 'email-first' && step !== 'email'}
        <div class="email-display">
          <span>{email}</span>
          <button type="button" class="toggle back" onclick={() => { step = 'email'; msg = ''; }}>{t.back}</button>
        </div>
      {/if}

      {#if loginFlow === 'email-first' && step === 'email'}
        <label for="email">{t.email}</label>
        <input id="email" type="email" bind:value={email} placeholder="you@email.com" autocomplete="username" autofocus />
        <button type="submit" disabled={busy} aria-busy={busy}>{busy ? '…' : t.continue}</button>
      {:else if loginFlow === 'email-first' && step === 'credentials'}
        <label for="pass">{t.pass}</label>
        <input id="pass" type="password" bind:value={password} placeholder="••••••••" autocomplete="current-password" />
        <label class="remember"><input type="checkbox" bind:checked={rememberMe} /> {t.remember}</label>
        <button type="submit" disabled={busy} aria-busy={busy}>{busy ? '…' : t.cta}</button>
        {#if brand.homeUrl}
          <a class="forgot" href={`${base}/reset`}>{t.forgot}</a>
        {/if}
      {:else if loginFlow === 'email-first' && step === 'register'}
        <label for="name">{t.name}</label>
        <input id="name" type="text" bind:value={name} placeholder={t.name} autocomplete="name" />
        <label for="pass">{t.pass}</label>
        <input id="pass" type="password" bind:value={password} placeholder="••••••••" autocomplete="new-password" />
        {#if providers.password?.strengthMeter && strength && (mode === 'register' || step === 'register')}
          <div class="strength-meter" role="meter" aria-label="Password strength" aria-valuemin="0" aria-valuemax="4" aria-valuenow={strength?.score ?? 0}>
            <div class="strength-bar" style="width: {(strength.score + 1) * 20}%; background: {['#ff4444','#ff8800','#ffbb00','#88cc00','#44bb44'][strength.score]};"></div>
          </div>
          <span class="strength-label" style="color: {['#ff4444','#ff8800','#ffbb00','#88cc00','#44bb44'][strength.score]};">{t.strengthLabels?.[strength.label] ?? strength.label}</span>
        {/if}
        <button type="submit" disabled={busy} aria-busy={busy}>{busy ? '…' : t.signup}</button>
      {:else}
        {#if mode === 'register'}
          <label for="name">{t.name}</label>
          <input id="name" type="text" bind:value={name} placeholder={t.name} autocomplete="name" />
        {/if}

        <label for="email">{t.email}</label>
        <input id="email" type="email" bind:value={email} placeholder="you@email.com" autocomplete="username" />

        {#if providers.password?.enabled}
          <label for="pass">{t.pass}</label>
          <input id="pass" type="password" bind:value={password} placeholder="••••••••" autocomplete={mode === 'register' ? 'new-password' : 'current-password'} />
        {#if mode === 'login'}
          <label class="remember"><input type="checkbox" bind:checked={rememberMe} /> {t.remember}</label>
        {/if}
        {#if providers.password?.strengthMeter && strength && (mode === 'register' || step === 'register')}
          <div class="strength-meter" role="meter" aria-label="Password strength" aria-valuemin="0" aria-valuemax="4" aria-valuenow={strength?.score ?? 0}>
            <div class="strength-bar" style="width: {(strength.score + 1) * 20}%; background: {['#ff4444','#ff8800','#ffbb00','#88cc00','#44bb44'][strength.score]};"></div>
          </div>
          <span class="strength-label" style="color: {['#ff4444','#ff8800','#ffbb00','#88cc00','#44bb44'][strength.score]};">{t.strengthLabels?.[strength.label] ?? strength.label}</span>
        {/if}
          <button type="submit" disabled={busy} aria-busy={busy}>{busy ? '…' : mode === 'register' ? t.signup : t.cta}</button>
          {#if providers.password?.allowRegister}
            <button type="button" class="toggle" onclick={() => { mode = mode === 'register' ? 'login' : 'register'; msg = ''; }}>{mode === 'register' ? t.haveAccount : t.newHere}</button>
          {/if}
          {#if mode === 'login' && brand.homeUrl}
            <a class="forgot" href={`${base}/reset`}>{t.forgot}</a>
          {/if}
        {/if}
      {/if}

      {#if mode === 'login' && (loginFlow === 'classic' || step === 'email')}
        {#if providers.magicLink?.enabled}
          <button type="button" class="alt" disabled={busy} onclick={magicRequest}>{t.magic}</button>
        {/if}

        {#if providers.passkeys?.enabled || (providers.oauth?.length)}
          <div class="div">{t.or}</div>
        {/if}
        {#if providers.passkeys?.enabled}
          <button type="button" class="soc" disabled={busy} onclick={passkeyLogin}><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 1a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5zm-1.5 12C6.36 13 3 14.36 3 17v2h10.07a6.5 6.5 0 0 1-.07-1 6.5 6.5 0 0 1 3.26-5.63A12.7 12.7 0 0 0 10.5 13zM19.5 14a4.5 4.5 0 0 0-4.5 4.5 4.5 4.5 0 0 0 4.5 4.5 4.5 4.5 0 0 0 4.5-4.5 4.5 4.5 0 0 0-4.5-4.5zm0 1.5a1.25 1.25 0 0 1 1.25 1.25 1.25 1.25 0 0 1-1.25 1.25 1.25 1.25 0 0 1-1.25-1.25 1.25 1.25 0 0 1 1.25-1.25zm0 3a2.5 2.5 0 0 1 2.5 2.5h-5a2.5 2.5 0 0 1 2.5-2.5z"/></svg> {t.passkey}</button>
        {/if}
        {#each providers.oauth ?? [] as o}
          <button type="button" class="soc" disabled={busy} onclick={() => oauthStart(o.id)}>{#if oauthIcons[o.id]}{@html oauthIcons[o.id]}{/if} {o.label ?? o.id}</button>
        {/each}
      {/if}

      {#if msg}<p class="msg" class:ok class:err={!ok} role="alert" aria-live="polite">{msg}</p>{/if}

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

{#if copy.footer && !embed}
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
  button[type="submit"] { box-shadow: 0 5px 0 var(--pl-accent-dark, color-mix(in srgb, var(--pl-accent, #f6a13c) 60%, black));
    transition: transform .22s cubic-bezier(.34,1.65,.5,1), box-shadow .22s cubic-bezier(.34,1.65,.5,1); }
  button[type="submit"]:active { transform: translateY(5px); box-shadow: 0 0 0 var(--pl-accent-dark, color-mix(in srgb, var(--pl-accent, #f6a13c) 60%, black));
    transition: transform .05s, box-shadow .05s; }
  button:disabled { opacity: .6; cursor: progress; }
  button.alt { background: transparent; color: var(--pl-accent, #f6a13c); border: 1px solid var(--pl-accent, #f6a13c); box-shadow: none; margin-top: .6rem; }
  button.soc { background: #131c2e; display: flex; align-items: center; justify-content: center; gap: .5rem; color: #eef2fb; border: 1px solid rgba(255,255,255,.12); margin-top: .5rem; font-weight: 600; }
  button.soc:hover { border-color: #9aa7bd; }
  .div { display: flex; align-items: center; gap: .6rem; color: #9aa7bd; font-size: .72rem; margin: 1rem 0 .2rem; }
  .div::before, .div::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.12); }
  .forgot { display: inline-block; margin-top: .7rem; font-size: .82rem; color: var(--pl-muted, #9aa7bd); text-decoration: none; }
  .forgot:hover { color: var(--pl-accent, #f6a13c); }
  .email-display { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: .5rem .7rem; margin-bottom: .4rem; display: flex; align-items: center; justify-content: space-between; font-size: .9rem; color: #eef2fb; }
  button.toggle.back { width: auto; margin: 0; padding: 0; font-size: .78rem; }
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

  .remember { display: flex; align-items: center; gap: .4rem; font-size: .82rem; color: #9aa7bd; margin: .6rem 0 0; cursor: pointer; }
  .remember input[type="checkbox"] { accent-color: var(--pl-accent, #f6a13c); width: 14px; height: 14px; cursor: pointer; }
  .strength-meter { height: 4px; background: rgba(255,255,255,.1); border-radius: 2px; margin-top: .4rem; overflow: hidden; }
  .strength-bar { height: 100%; border-radius: 2px; transition: width .3s, background .3s; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
  .strength-label { font-size: .72rem; margin-top: .2rem; display: block; }

  .stage.embed { height: 100vh; justify-content: center; align-items: center; background: transparent; }
  .panel.embed { flex: none; max-width: none; border-left: none; background: transparent; padding: 1rem; }
  .panel.embed .card { max-width: 340px; margin: 0 auto; }
</style>
