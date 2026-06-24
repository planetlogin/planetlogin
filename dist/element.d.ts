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
export declare class PlanetLoginElement extends HTMLElement {
    static get observedAttributes(): string[];
    private instance?;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
