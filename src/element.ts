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
    };
    this.instance = new PlanetLogin(this, opts);
  }

  disconnectedCallback(): void {
    this.instance?.destroy();
    this.instance = undefined;
  }
}
