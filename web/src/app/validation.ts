const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 32;
const NAME_PATTERN = /^[\p{L}\p{N} ._'-]+$/u;

export function normalizeProfileName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function isValidProfileName(name: string): boolean {
  return name.length >= NAME_MIN_LENGTH && name.length <= NAME_MAX_LENGTH && NAME_PATTERN.test(name);
}

export function profileNameValidationMessage(lang: 'en' | 'es'): string {
  if (lang === 'es') {
    return 'El nombre debe tener entre 2 y 32 caracteres y solo usar letras, números, espacios, punto, guion bajo, apóstrofo o guion.';
  }

  return 'Name must be 2-32 characters and use only letters, numbers, spaces, dot, underscore, apostrophe, or hyphen.';
}
