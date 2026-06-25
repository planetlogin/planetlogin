import { PlanetLogin } from './planetlogin';
import type { PlanetLoginOptions } from './types';

/**
 * `<planet-login>` — drop-in custom element. Works in any framework or plain HTML.
 *
 * ```html
 * <planet-login accent="#f6a13c" resolution="110m" style="width:100%;height:480px"></planet-login>
 * <script type="module" src="planetlogin.js"></script>
 * ```
 *
 * Listen for picks: `el.addEventListener('locale', e => console.log(e.detail))`.
 *
 * Locale memory (opt-in, device-local, no backend):
 * ```html
 * <planet-login remember fly-to-saved></planet-login>
 * ```
 */
export class PlanetLoginElement extends HTMLElement {
  static get observedAttributes() { return ['accent', 'resolution', 'search', 'placeholder']; }
  private instance?: PlanetLogin;

  connectedCallback(): void {
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    const opts: PlanetLoginOptions = {
      accent: this.getAttribute('accent') ?? undefined,
      resolution: (this.getAttribute('resolution') as '110m' | '50m') ?? undefined,
      placeholder: this.getAttribute('placeholder') ?? undefined,
      search: this.getAttribute('search') !== 'false',
      autoSpin: this.getAttribute('autospin') !== 'false',
      // Boolean attributes: present (any value incl. "") → on.
      remember: this.hasAttribute('remember'),
      flyToSaved: this.hasAttribute('fly-to-saved'),
      storageKey: this.getAttribute('storage-key') ?? undefined,
      storage: (this.getAttribute('storage') as 'local' | 'session' | 'none') ?? undefined,
    };
    this.instance = new PlanetLogin(this, opts);
  }

  disconnectedCallback(): void {
    this.instance?.destroy();
    this.instance = undefined;
  }

  // ── Imperative API (drive the globe from the host page) ───────────────────
  /** Fly the globe to coordinates and pick them. */
  flyTo(lon: number, lat: number): void { this.instance?.flyTo(lon, lat); }
  /** The locale remembered on this device (Tier 0), or null. */
  getSavedLocale() { return this.instance?.getSavedLocale() ?? null; }
  /** Forget the remembered locale on this device. */
  clearSavedLocale(): void { this.instance?.clearSavedLocale(); }
}
