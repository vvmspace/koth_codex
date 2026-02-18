const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 32;
const NAME_PATTERN = /^[\p{L}\p{N} ._'-]+$/u;

export function normalizeProfileName(name: unknown): string {
  if (typeof name !== 'string') {
    return '';
  }

  return name.trim().replace(/\s+/g, ' ');
}

export function isValidProfileName(name: string): boolean {
  return name.length >= NAME_MIN_LENGTH && name.length <= NAME_MAX_LENGTH && NAME_PATTERN.test(name);
}

export function profileNameErrorMessage() {
  return 'first_name must be 2-32 chars and contain only letters, numbers, spaces, dot, underscore, apostrophe, or hyphen';
}
