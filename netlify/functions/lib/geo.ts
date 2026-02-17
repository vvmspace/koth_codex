const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'US',
  es: 'ES',
  pt: 'BR',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
  tr: 'TR',
  ru: 'RU',
  uk: 'UA',
  pl: 'PL',
  nl: 'NL',
  ar: 'SA',
  hi: 'IN',
  ja: 'JP',
  ko: 'KR',
  id: 'ID',
  vi: 'VN'
};

export function countryCodeToFlag(countryCode?: string | null) {
  if (!countryCode || !/^[a-z]{2}$/i.test(countryCode)) return null;
  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function guessCountryCodeFromLanguage(languageCode?: string | null) {
  if (!languageCode) return null;
  const normalized = languageCode.toLowerCase();
  const explicitCountry = normalized.includes('-') ? normalized.split('-')[1] : null;
  if (explicitCountry && /^[a-z]{2}$/i.test(explicitCountry)) {
    return explicitCountry.toUpperCase();
  }
  const base = normalized.split('-')[0];
  return LANGUAGE_TO_COUNTRY[base] ?? null;
}

export function resolveCountryFlag(params: { languageCode?: string | null; countryCode?: string | null }) {
  const direct = countryCodeToFlag(params.countryCode);
  if (direct) return direct;
  const guessedCountry = guessCountryCodeFromLanguage(params.languageCode);
  return countryCodeToFlag(guessedCountry);
}
