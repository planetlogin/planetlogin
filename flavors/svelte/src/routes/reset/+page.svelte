<script lang="ts">
  import { onMount } from 'svelte';
  import { passwordStrength } from '@planetlogin/core/passwordStrength';
  import { base } from '$app/paths';

  const T: Record<string, Record<string, string>> = {
    en: {
      title: 'Reset your password', sub: 'Enter your email to receive a reset link.',
      email: 'Email', cta: 'Send reset link', sent: 'If that account exists, we sent a reset link. Check your email.',
      newTitle: 'Set a new password', newSub: 'Choose a strong password for your account.',
      pass: 'New password', confirm: 'Confirm password', reset: 'Reset password',
      done: 'Password updated — signing you in…', expired: 'This reset link is expired or already used.',
      mismatch: 'Passwords don\'t match.', tooShort: 'Password is too short.',
      netErr: 'Network error — check your connection.', rateLimited: 'Too many attempts — please wait.',
      backToLogin: '← Back to sign in',
      strengthLabels: { very_weak: 'Very weak', weak: 'Weak', fair: 'Fair', strong: 'Strong', very_strong: 'Very strong' },
    },
    es: {
      title: 'Recupera tu contraseña', sub: 'Introduce tu email para recibir un enlace de recuperación.',
      email: 'Email', cta: 'Enviar enlace', sent: 'Si esa cuenta existe, te enviamos un enlace. Revisa tu correo.',
      newTitle: 'Nueva contraseña', newSub: 'Elige una contraseña segura para tu cuenta.',
      pass: 'Nueva contraseña', confirm: 'Confirmar contraseña', reset: 'Cambiar contraseña',
      done: 'Contraseña actualizada — iniciando sesión…', expired: 'Este enlace ha expirado o ya fue usado.',
      mismatch: 'Las contraseñas no coinciden.', tooShort: 'La contraseña es demasiado corta.',
      netErr: 'Error de red — revisa tu conexión.', rateLimited: 'Demasiados intentos — espera un momento.',
      backToLogin: '← Volver al inicio de sesión',
      strengthLabels: { very_weak: 'Muy débil', weak: 'Débil', fair: 'Aceptable', strong: 'Fuerte', very_strong: 'Muy fuerte' },
    },
    fr: { title: 'Réinitialiser le mot de passe', cta: 'Envoyer le lien', reset: 'Réinitialiser', backToLogin: '← Retour à la connexion' },
    de: { title: 'Passwort zurücksetzen', cta: 'Link senden', reset: 'Zurücksetzen', backToLogin: '← Zurück zur Anmeldung' },
    pt: { title: 'Recuperar palavra-passe', cta: 'Enviar link', reset: 'Alterar', backToLogin: '← Voltar ao login' },
    it: { title: 'Reimposta la password', cta: 'Invia link', reset: 'Reimposta', backToLogin: '← Torna al login' },
    ja: { title: 'パスワードをリセット', cta: 'リンクを送信', reset: 'リセット', backToLogin: '← ログインに戻る' },
  };

  let token = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let busy = $state(false);
  let msg = $state('');
  let ok = $state(false);
  let brand = $state<any>({});
  let providers = $state<any>({ password: { enabled: true } });
  let locale = $state<string>('en');

  let strength = $derived(password ? passwordStrength(password, providers.password?.minPasswordLength) : null);
  const t = $derived({ ...T.en, ...(T[locale] ?? {}) });

  onMount(async () => {
    token = new URLSearchParams(location.search).get('token') ?? '';
    try {
      const c = await (await fetch(`${base}/auth/config`)).json();
      brand = c.brand ?? brand;
      providers = c.providers ?? providers;
      const root = document.documentElement.style;
      if (brand.accent) root.setProperty('--pl-accent', brand.accent);
      if (brand.accentFg) root.setProperty('--pl-accent-fg', brand.accentFg);
      if (brand.accentDark) root.setProperty('--pl-accent-dark', brand.accentDark);
      if (brand.font) root.setProperty('--pl-font', brand.font);
      locale = document.documentElement.lang || 'en';
    } catch {}
  });

  async function requestReset(e: SubmitEvent) {
    e.preventDefault();
    if (!email) return;
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/password/reset/request`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email }),
      });
      if (r.status === 429) { ok = false; msg = t.rateLimited; return; }
      ok = true; msg = t.sent;
    } catch { ok = false; msg = t.netErr; }
    finally { busy = false; }
  }

  async function resetPassword(e: SubmitEvent) {
    e.preventDefault();
    const minLen = providers.password?.minPasswordLength ?? 8;
    if (password.length < minLen) { ok = false; msg = t.tooShort; return; }
    if (password !== confirmPassword) { ok = false; msg = t.mismatch; return; }
    busy = true; msg = '';
    try {
      const r = await fetch(`${base}/auth/password/reset/verify`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      ok = r.ok;
      if (r.ok) {
        msg = t.done;
        setTimeout(() => { window.location.href = `${base}/`; }, 1500);
      } else {
        msg = data.error?.code === 'invalid_token' ? t.expired
          : data.error?.code === 'rate_limited' ? t.rateLimited
          : t.netErr;
      }
    } catch { ok = false; msg = t.netErr; }
    finally { busy = false; }
  }
</script>

<div class="reset-page">
  <div class="card">
    {#if token}
      <h1>{t.newTitle}</h1>
      <p class="sub">{t.newSub}</p>
      <form onsubmit={resetPassword}>
        <label for="pass">{t.pass}</label>
        <input id="pass" type="password" bind:value={password} placeholder="••••••••" autocomplete="new-password" />
        {#if providers.password?.strengthMeter && strength}
          <div class="strength-meter">
            <div class="strength-bar" style="width: {(strength.score + 1) * 20}%; background: {['#ff4444','#ff8800','#ffbb00','#88cc00','#44bb44'][strength.score]};"></div>
          </div>
          <span class="strength-label" style="color: {['#ff4444','#ff8800','#ffbb00','#88cc00','#44bb44'][strength.score]};">{t.strengthLabels?.[strength.label] ?? strength.label}</span>
        {/if}
        <label for="confirm">{t.confirm}</label>
        <input id="confirm" type="password" bind:value={confirmPassword} placeholder="••••••••" autocomplete="new-password" />
        <button type="submit" disabled={busy}>{busy ? '…' : t.reset}</button>
      </form>
    {:else}
      <h1>{t.title}</h1>
      <p class="sub">{t.sub}</p>
      <form onsubmit={requestReset}>
        <label for="email">{t.email}</label>
        <input id="email" type="email" bind:value={email} placeholder="you@email.com" autocomplete="username" />
        <button type="submit" disabled={busy}>{busy ? '…' : t.cta}</button>
      </form>
    {/if}
    {#if msg}<p class="msg" class:ok class:err={!ok}>{msg}</p>{/if}
    <a class="back" href={`${base}/`}>{t.backToLogin}</a>
  </div>
</div>

<style>
  :global(body) { font-family: var(--pl-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif); background: #0d1422; margin: 0; }
  .reset-page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; color: #eef2fb; animation: pl-fade .45s ease both; }
  @keyframes pl-fade { from { opacity: 0; } to { opacity: 1; } }
  .card { width: 100%; max-width: 360px; }
  h1 { font-size: 1.3rem; margin: 0 0 .25rem; }
  .sub { color: #9aa7bd; font-size: .85rem; margin: 0 0 1.4rem; }
  label { display: block; font-size: .78rem; color: #9aa7bd; margin: .8rem 0 .3rem; }
  input { width: 100%; background: #131c2e; border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
    padding: .6rem .7rem; color: #eef2fb; font-size: .95rem; box-sizing: border-box; }
  input:focus { outline: 0; border-color: var(--pl-accent, #f6a13c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--pl-accent, #f6a13c) 22%, transparent); }
  button { width: 100%; margin-top: 1.1rem; border: 0; border-radius: 11px; padding: .7rem; font-weight: 700;
    background: var(--pl-accent, #f6a13c); color: var(--pl-accent-fg, #231400); cursor: pointer; font-size: .98rem;
    box-shadow: 0 5px 0 var(--pl-accent-dark, color-mix(in srgb, var(--pl-accent, #f6a13c) 60%, black));
    transition: transform .22s cubic-bezier(.34,1.65,.5,1), box-shadow .22s cubic-bezier(.34,1.65,.5,1); }
  button:active { transform: translateY(5px); box-shadow: 0 0 0 var(--pl-accent-dark, color-mix(in srgb, var(--pl-accent, #f6a13c) 60%, black));
    transition: transform .05s, box-shadow .05s; }
  button:disabled { opacity: .6; cursor: progress; }
  .msg { font-size: .82rem; margin: .9rem 0 0; }
  .msg.ok { color: #9ad19a; } .msg.err { color: #ff9b9b; }
  .back { display: inline-block; margin-top: 1.2rem; font-size: .82rem; color: #9aa7bd; text-decoration: none; }
  .back:hover { color: var(--pl-accent, #f6a13c); }
  .strength-meter { height: 4px; background: rgba(255,255,255,.1); border-radius: 2px; margin-top: .4rem; overflow: hidden; }
  .strength-bar { height: 100%; border-radius: 2px; transition: width .3s, background .3s; }
  .strength-label { font-size: .72rem; margin-top: .2rem; display: block; }
</style>
