const IPA_STRESS = new Set(['ˈ', 'ˌ']);

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

export function answersMatchIpa(actual: string, expected: string): boolean {
  return normalizeIpa(actual) === normalizeIpa(expected);
}

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
