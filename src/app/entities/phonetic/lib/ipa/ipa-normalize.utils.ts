const IPA_STRESS = new Set(['ˈ', 'ˌ']);

/**
 * Normalizes an IPA string by stripping brackets, collapsing whitespace, and normalizing Unicode.
 *
 * @param value - The IPA string to normalize.
 * @param stripBrackets - Whether to strip surrounding `[...]` or `/.../` brackets. Defaults to `true`.
 * @returns The normalized IPA string.
 */
export function normalizeIpa(value: string, stripBrackets = true): string {
  let normalized = value.normalize('NFKC').trim();

  if (stripBrackets) {
    normalized = normalized
      .replace(/^\[(.*)\]$/u, '$1')
      .replace(/^\/(.*)\/$/u, '$1')
      .trim();
  }

  return normalized.replace(/\s+/g, ' ');
}

/**
 * Checks whether a string likely contains IPA (International Phonetic Alphabet) characters.
 *
 * @param value - The string to check.
 * @returns `true` if the string contains characters from IPA Unicode blocks.
 */
export function isLikelyIpa(value: string): boolean {
  const sample = normalizeIpa(value);
  if (!sample) {
    return false;
  }

  for (const char of sample) {
    const code = char.codePointAt(0) ?? 0;
    if (
      (code >= 0x0250 && code <= 0x02af) ||
      (code >= 0x1d00 && code <= 0x1d7f) ||
      (code >= 0x02b0 && code <= 0x02ff) ||
      (code >= 0x0300 && code <= 0x036f) ||
      char === 'ˈ' ||
      char === 'ˌ'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Compares two IPA strings for equality after normalization.
 *
 * @param actual - The actual IPA string.
 * @param expected - The expected IPA string.
 * @returns `true` if the normalized strings are equal.
 */
export function answersMatchIpa(actual: string, expected: string): boolean {
  return normalizeIpa(actual) === normalizeIpa(expected);
}

/**
 * Validates an IPA input string.
 *
 * @param value - The IPA string to validate.
 * @returns `true` if the input is valid (empty, stress mark, or contains IPA characters).
 * @remarks
 * Returns `true` for empty strings. Rejects strings containing apostrophes (`'`).
 */
export function validateIpaInput(value: string): boolean {
  const normalized = normalizeIpa(value);
  if (!normalized) {
    return true;
  }

  if (normalized.includes("'")) {
    return false;
  }

  return isLikelyIpa(normalized) || IPA_STRESS.has(normalized[0] ?? '');
}
