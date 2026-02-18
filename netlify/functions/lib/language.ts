export type SupportedLanguage = 'en' | 'es';

const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  en: 'en',
  es: 'es'
};

export function normalizeSupportedLanguage(languageCode: unknown): SupportedLanguage | null {
  if (typeof languageCode !== 'string') {
    return null;
  }

  const normalized = languageCode.trim().toLowerCase().replace('_', '-');
  if (!normalized) {
    return null;
  }

  const [base] = normalized.split('-');
  return LANGUAGE_MAP[base] || null;
}
