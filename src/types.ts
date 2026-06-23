/** The locale PlanetLogin detects from a place. */
export interface PlanetLocale {
  /** Latitude of the picked place. */
  lat: number;
  /** Longitude of the picked place. */
  lon: number;
  /** ISO 3166-1 alpha-2 country code (uppercase), when known. */
  country: string;
  /** IANA timezone (e.g. "Europe/Madrid") or an approximate "UTC±N". */
  timezone: string;
  /** BCP-47-ish language code derived from the country (e.g. "es"). */
  language: string;
  /** Human label for the place (e.g. "Barcelona, Spain"). */
  label: string;
  /** True when the timezone is a rough longitude estimate, not IANA. */
  approxTimezone?: boolean;
}

export interface PlanetLoginOptions {
  /** Brand/accent color. Default "#f6a13c". */
  accent?: string;
  /** Show the built-in search box. Default true. */
  search?: boolean;
  /** Placeholder for the search box. Default "Postal code, city or country…". */
  placeholder?: string;
  /** Gentle auto-rotation until the first selection. Default true. */
  autoSpin?: boolean;
  /** Border detail of the country data. Default "110m". */
  resolution?: '110m' | '50m';
  /** Override the world-atlas TopoJSON URL. */
  dataUrl?: string;
  /** Called every time a place is picked. */
  onLocale?: (locale: PlanetLocale) => void;
}

export type PlanetLoginEvent = 'locale';
