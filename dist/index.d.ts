export type { PlanetLocale, PlanetLoginOptions, PlanetLoginEvent } from './types';
export { PlanetLogin } from './planetlogin';
export { PlanetLoginElement } from './element';
import { PlanetLogin } from './planetlogin';
import type { PlanetLoginOptions } from './types';
/** Mount a PlanetLogin globe into a DOM element. */
export declare function createPlanetLogin(target: HTMLElement, options?: PlanetLoginOptions): PlanetLogin;
