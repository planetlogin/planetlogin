<script lang="ts">
  import { onMount } from 'svelte';

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
  let globeEl: HTMLElement;

  const t = $derived(T[locale?.language as string] ?? T.en);

  onMount(async () => {
    await import('@planetlogin/planetlogin'); // registers <planet-login>
    globeEl?.addEventListener('locale', (e: Event) => {
      locale = (e as CustomEvent).detail;
      document.documentElement.lang = locale.language ?? 'en';
    });
    // render from the white-label config (spec §5)
    try { providers = (await (await fetch('/auth/config')).json()).providers ?? providers; } catch {}
  });

  async function magicRequest() {
    if (!email) { msg = '✗ enter your email'; ok = false; return; }
    busy = true; msg = '';
    try {
      await fetch('/auth/magic/request', {
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
      const r = await fetch('/auth/password/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, locale }),
      });
      const data = await r.json();
      if (r.ok && data.requires === 'totp') { mfa = true; msg = ''; return; }
      ok = r.ok;
      msg = r.ok ? `✓ ${data.user?.email ?? 'signed in'}` : `✗ ${data.error?.code ?? r.status}`;
    } catch { ok = false; msg = '✗ network error'; }
    finally { busy = false; }
  }

  async function totpVerify() {
    busy = true; msg = '';
    try {
      const r = await fetch('/auth/totp/verify', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }),
      });
      const data = await r.json();
      ok = r.ok; mfa = !r.ok;
      msg = r.ok ? `✓ ${data.user?.id ?? 'signed in'}` : `✗ ${data.error?.code ?? 'bad code'}`;
    } catch { ok = false; msg = '✗ network error'; }
    finally { busy = false; }
  }

  async function passkeyLogin() {
    busy = true; msg = '';
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const options = await (await fetch('/auth/passkey/challenge', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'auth' }),
      })).json();
      const response = await startAuthentication({ optionsJSON: options });
      const r = await fetch('/auth/passkey/verify', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ response }),
      });
      const data = await r.json();
      ok = r.ok;
      msg = r.ok ? `✓ ${data.user?.id ?? 'signed in'}` : `✗ ${data.error?.code ?? 'failed'}`;
    } catch { ok = false; msg = '✗ passkey cancelled'; }
    finally { busy = false; }
  }

  const oauthStart = (id: string) => { window.location.href = `/auth/oauth/${id}/start`; };
</script>

<div class="stage">
  <planet-login bind:this={globeEl} accent="#f6a13c"></planet-login>

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
      <h1>{t.greet}</h1>
      <p class="sub">{t.sub}</p>

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
</div>

<style>
  :global(body) { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .stage { display: flex; height: 100vh; color: #eef2fb; }
  planet-login { flex: 1 1 auto; min-width: 0; height: 100vh; display: block; }
  .panel { flex: 0 0 380px; max-width: 42vw; background: #0d1422; border-left: 1px solid rgba(255,255,255,.12);
    display: grid; place-items: center; padding: 2rem; }
  .card { width: 100%; max-width: 300px; }
  h1 { font-size: 1.3rem; margin: 0 0 .25rem; }
  .sub { color: #9aa7bd; font-size: .85rem; margin: 0 0 1.4rem; }
  label { display: block; font-size: .78rem; color: #9aa7bd; margin: .8rem 0 .3rem; }
  input { width: 100%; background: #131c2e; border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
    padding: .6rem .7rem; color: #eef2fb; font-size: .95rem; }
  input:focus { outline: 0; border-color: #f6a13c; box-shadow: 0 0 0 3px rgba(246,161,60,.14); }
  button { width: 100%; margin-top: 1.1rem; border: 0; border-radius: 11px; padding: .7rem; font-weight: 700;
    background: #f6a13c; color: #231400; cursor: pointer; font-size: .98rem; }
  button:disabled { opacity: .6; cursor: progress; }
  button.alt { background: transparent; color: var(--accent, #f6a13c); border: 1px solid rgba(246,161,60,.4); margin-top: .6rem; }
  button.soc { background: #131c2e; color: #eef2fb; border: 1px solid rgba(255,255,255,.12); margin-top: .5rem; font-weight: 600; }
  button.soc:hover { border-color: #9aa7bd; }
  .div { display: flex; align-items: center; gap: .6rem; color: #9aa7bd; font-size: .72rem; margin: 1rem 0 .2rem; }
  .div::before, .div::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.12); }
  .msg { font-size: .82rem; margin: .9rem 0 0; }
  .msg.ok { color: #9ad19a; } .msg.err { color: #ff9b9b; }
  .chips { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: 1.2rem; font-size: .72rem; }
  .chip { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 999px; padding: .2rem .6rem; }
  .chip b { color: #f6a13c; }
  @media (max-width: 820px) {
    .stage { flex-direction: column; } planet-login { flex: none; height: 50vh; }
    .panel { max-width: none; border-left: 0; border-top: 1px solid rgba(255,255,255,.12); }
  }
</style>
