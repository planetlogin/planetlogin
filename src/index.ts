export type { PlanetLocale, PlanetPassOptions, PlanetPassEvent } from './types';
export { PlanetPass } from './planetpass';
export { PlanetPassElement } from './element';

import { PlanetPass } from './planetpass';
import { PlanetPassElement } from './element';
import type { PlanetPassOptions } from './types';

/** Mount a PlanetPass globe into a DOM element. */
export function createPlanetPass(target: HTMLElement, options?: PlanetPassOptions): PlanetPass {
  return new PlanetPass(target, options);
}

// Auto-register the <planet-pass> custom element when loaded in a browser.
if (typeof customElements !== 'undefined' && !customElements.get('planet-pass')) {
  customElements.define('planet-pass', PlanetPassElement);
}
