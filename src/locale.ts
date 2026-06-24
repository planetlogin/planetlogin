// Country (ISO 3166-1 alpha-2) → primary language (BCP-47 base code).
// Coarse on purpose: enough to greet a visitor in the right tongue. One language
// per country (the most widely used official one). Extend or override freely.
const LANG_BY_CC: Record<string, string> = {
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es',
  GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es',
  CR: 'es', PA: 'es', UY: 'es', GQ: 'es',
  // English
  US: 'en', GB: 'en', IE: 'en', AU: 'en', CA: 'en', NZ: 'en', IN: 'en', ZA: 'en',
  NG: 'en', GH: 'en', KE: 'en', UG: 'en', ZW: 'en', JM: 'en', TT: 'en', SG: 'en',
  PH: 'en', MT: 'en', PK: 'en', BD: 'en',
  // Portuguese
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
  // French
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', CI: 'fr', SN: 'fr', CM: 'fr', CD: 'fr',
  ML: 'fr', NE: 'fr', BF: 'fr', TG: 'fr', BJ: 'fr', GA: 'fr', CG: 'fr', MG: 'fr',
  // German
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  // Italian
  IT: 'it', SM: 'it', VA: 'it',
  // Dutch
  NL: 'nl', SR: 'nl',
  // Nordic
  SE: 'sv', NO: 'no', DK: 'da', FI: 'fi', IS: 'is',
  // Eastern Europe / Slavic
  RU: 'ru', BY: 'ru', PL: 'pl', UA: 'uk', CZ: 'cs', SK: 'sk', BG: 'bg', RS: 'sr',
  HR: 'hr', SI: 'sl', MK: 'mk', BA: 'bs',
  // Baltics / other Europe
  LT: 'lt', LV: 'lv', EE: 'et', HU: 'hu', RO: 'ro', MD: 'ro', GR: 'el', CY: 'el',
  AL: 'sq', GE: 'ka', AM: 'hy', AZ: 'az',
  // Middle East / Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', LY: 'ar', IQ: 'ar',
  JO: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', YE: 'ar', SY: 'ar',
  PS: 'ar', SD: 'ar',
  IL: 'he', IR: 'fa', TR: 'tr',
  // South / Southeast / East Asia
  JP: 'ja', CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', KR: 'ko', TH: 'th', VN: 'vi',
  ID: 'id', MY: 'ms', BN: 'ms', KH: 'km', LA: 'lo', MM: 'my', LK: 'si', NP: 'ne',
  // Africa (other)
  ET: 'am', TZ: 'sw', RW: 'rw', SO: 'so',
  // Central Asia
  KZ: 'kk', UZ: 'uz', KG: 'ky', TJ: 'tg', TM: 'tk', MN: 'mn',
};

export function countryToLanguage(cc: string | undefined): string {
  return (cc && LANG_BY_CC[cc.toUpperCase()]) || 'en';
}
