export type { PlanetLocale, PlanetLoginOptions, PlanetLoginEvent } from './types';
export { PlanetLogin } from './planetlogin';
export { PlanetLoginElement } from './element';
// Tier 0 locale memory — device-local, no backend. Usable without an instance.
export { readSavedLocale, writeSavedLocale, clearSavedLocale, DEFAULT_STORAGE_KEY, type LocaleStore } from './memory';

import { PlanetLogin } from './planetlogin';
import { PlanetLoginElement } from './element';
import type { PlanetLoginOptions } from './types';

/** Mount a PlanetLogin globe into a DOM element. */
export function createPlanetLogin(target: HTMLElement, options?: PlanetLoginOptions): PlanetLogin {
  return new PlanetLogin(target, options);
}

// Auto-register the <planet-login> custom element when loaded in a browser.
if (typeof customElements !== 'undefined' && !customElements.get('planet-login')) {
  customElements.define('planet-login', PlanetLoginElement);
}
