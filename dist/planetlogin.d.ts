import type { PlanetLocale, PlanetLoginOptions } from './types';
type Listener = (l: PlanetLocale) => void;
/**
 * A self-contained globe locale picker. Mounts a canvas (and an optional search
 * box) into `target`, lets the user spin / drag / zoom / click a country, and
 * emits a {@link PlanetLocale} when a place is picked.
 */
export declare class PlanetLogin {
    private target;
    private opts;
    private cv;
    private ctx;
    private input?;
    private wm?;
    private listeners;
    private W;
    private H;
    private DPR;
    private cx;
    private cy;
    private baseR;
    private R;
    private stars;
    private countriesFC;
    private bordersMesh;
    private graticule;
    private lastProjection;
    private hoverFeat;
    private selectedFeat;
    private mode;
    private lon0;
    private lat0;
    private fromLon;
    private fromLat;
    private toLon;
    private toLat;
    private t0;
    private zStart;
    private zTarget;
    private zFrom;
    private dragging;
    private vlon;
    private vlat;
    private zoomK;
    private autoSpin;
    private reduceMotion;
    private detected;
    private raf;
    private ro?;
    private lastX;
    private lastY;
    private moved;
    constructor(target: HTMLElement, options?: PlanetLoginOptions);
    /** Register a listener fired whenever a place is picked. */
    on(_event: 'locale', cb: Listener): this;
    /** Fly to coordinates and pick them. */
    flyTo(lon: number, lat: number): void;
    /** Search by postal code / city / country and fly to the result. */
    search(query: string): Promise<void>;
    /** Stop everything and remove the DOM it created. */
    destroy(): void;
    private emit;
    private buildSearch;
    private buildWatermark;
    private loadData;
    private resize;
    private featureCenter;
    private countryAt;
    /** The country under the globe's centre point (current rotation). */
    private countryAtCenter;
    private pickFeature;
    private onLocated;
    private bindEvents;
    private loop;
    private draw;
    private hexA;
}
export {};
