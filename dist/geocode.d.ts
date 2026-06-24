export interface GeoHit {
    lat: number;
    lon: number;
    cc: string;
    label: string;
    tz: string;
    approxTz?: boolean;
}
/** Rough IANA-less timezone label from longitude, e.g. 2.17 → "UTC+0". */
export declare const utcOffset: (lon: number) => string;
export declare function geocode(query: string): Promise<GeoHit | null>;
/** coords → { country code, approximate timezone }. Never throws. */
export declare function reverseMeta(lon: number, lat: number): Promise<{
    cc: string;
    tz: string;
    approxTz: boolean;
}>;
