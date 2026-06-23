// Country (ISO alpha-2) → language code. Coarse on purpose: enough to greet a
// visitor in the right tongue. Extend freely.
const LANG_BY_CC: Record<string, string> = {
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  US: 'en', GB: 'en', IE: 'en', AU: 'en', CA: 'en', NZ: 'en', IN: 'en',
  FR: 'fr', BE: 'fr', DE: 'de', AT: 'de', CH: 'de', IT: 'it', PT: 'pt', BR: 'pt',
  NL: 'nl', JP: 'ja', CN: 'zh', TW: 'zh', HK: 'zh',
};

export function countryToLanguage(cc: string | undefined): string {
  return (cc && LANG_BY_CC[cc.toUpperCase()]) || 'en';
}
