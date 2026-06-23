// Forward + reverse geocoding with no API key:
//  - Open-Meteo: forward search, returns a precise IANA timezone.
//  - Nominatim (OpenStreetMap): forward fallback (handles postal codes) and
//    reverse (coords → country code). Timezone there is approximated by longitude.

export interface GeoHit {
  lat: number;
  lon: number;
  cc: string;
  label: string;
  tz: string;
  approxTz?: boolean;
}

const utcOffset = (lon: number): string => {
  const off = Math.round(lon / 15);
  return `UTC${off >= 0 ? '+' : ''}${off}`;
};

export async function geocode(query: string): Promise<GeoHit | null> {
  try {
    const u = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&format=json`;
    const r = await fetch(u).then((x) => x.json());
    if (r.results && r.results.length) {
      const g = r.results[0];
      return {
        lat: g.latitude,
        lon: g.longitude,
        cc: (g.country_code || '').toUpperCase(),
        label: [g.name, g.admin1, g.country].filter(Boolean).slice(0, 2).join(', '),
        tz: g.timezone,
      };
    }
  } catch {
    /* ignore, fall through */
  }
  try {
    const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
    const r = await fetch(u).then((x) => x.json());
    if (r && r.length) {
      const g = r[0];
      const lon = +g.lon;
      return {
        lat: +g.lat,
        lon,
        cc: (g.address?.country_code || '').toUpperCase(),
        label: (g.display_name || query).split(',').slice(0, 2).join(', '),
        tz: utcOffset(lon),
        approxTz: true,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** coords → { country code, approximate timezone }. Never throws. */
export async function reverseMeta(lon: number, lat: number): Promise<{ cc: string; tz: string; approxTz: boolean }> {
  let cc = '';
  try {
    const u = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&lat=${lat}&lon=${lon}`;
    const r = await fetch(u).then((x) => x.json());
    cc = (r?.address?.country_code || '').toUpperCase();
  } catch {
    /* ignore */
  }
  return { cc, tz: utcOffset(lon), approxTz: true };
}
