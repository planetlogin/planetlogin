import { PlanetPass } from './planetpass';
import type { PlanetPassOptions } from './types';

/**
 * `<planet-pass>` — drop-in custom element. Works in any framework or plain HTML.
 *
 * ```html
 * <planet-pass accent="#f6a13c" resolution="110m" style="width:100%;height:480px"></planet-pass>
 * <script type="module" src="planetpass.js"></script>
 * ```
 *
 * Listen for picks: `el.addEventListener('locale', e => console.log(e.detail))`.
 */
export class PlanetPassElement extends HTMLElement {
  static get observedAttributes() { return ['accent', 'resolution', 'search', 'placeholder']; }
  private instance?: PlanetPass;

  connectedCallback(): void {
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    const opts: PlanetPassOptions = {
      accent: this.getAttribute('accent') ?? undefined,
      resolution: (this.getAttribute('resolution') as '110m' | '50m') ?? undefined,
      placeholder: this.getAttribute('placeholder') ?? undefined,
      search: this.getAttribute('search') !== 'false',
      autoSpin: this.getAttribute('autospin') !== 'false',
    };
    this.instance = new PlanetPass(this, opts);
  }

  disconnectedCallback(): void {
    this.instance?.destroy();
    this.instance = undefined;
  }
}
