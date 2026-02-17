const FALLBACK_COUNTRY_BY_LANGUAGE: Record<'en' | 'es', string> = {
  en: 'US',
  es: 'ES'
};

export function normalizeLanguageCode(languageCode?: string | null): 'en' | 'es' {
  const base = (languageCode || 'en').toLowerCase().split('-')[0];
  return base === 'es' ? 'es' : 'en';
}

export function normalizeCountryCode(countryCode?: string | null) {
  if (!countryCode) return null;
  const normalized = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return normalized;
}

export function countryCodeToFlag(countryCode?: string | null) {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return null;
  return normalized
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function countryCodeFromLanguageTag(languageCode?: string | null) {
  if (!languageCode) return null;
  const parts = languageCode.split('-');
  if (parts.length > 1) {
    return normalizeCountryCode(parts[1]);
  }
  return null;
}

export function resolveCountryCode(params: { languageCode?: string | null; countryCode?: string | null }) {
  const direct = normalizeCountryCode(params.countryCode);
  if (direct) return direct;

  const fromLanguageTag = countryCodeFromLanguageTag(params.languageCode);
  if (fromLanguageTag) return fromLanguageTag;

  const lang = normalizeLanguageCode(params.languageCode);
  return FALLBACK_COUNTRY_BY_LANGUAGE[lang];
}
