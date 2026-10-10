import type { CodeHighlightLanguage } from '../../models';

/**
 * List of supported code-highlighting languages.
 */
export const CODE_HIGHLIGHT_LANGUAGES: readonly CodeHighlightLanguage[] = [
  'perl',
  'cpp',
  'java',
  'javascript',
  'typescript',
  'python',
  'sql',
  'bash',
  'rust',
  'go',
  'plain',
];

/**
 * Human-readable labels for each supported code-highlighting language.
 */
export const CODE_HIGHLIGHT_LANGUAGE_LABELS: Record<CodeHighlightLanguage, string> = {
  perl: 'Perl',
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  sql: 'SQL',
  bash: 'Bash',
  rust: 'Rust',
  go: 'Go',
  plain: 'Plain text',
};

/**
 * Normalizes a code answer by converting CRLF to LF and trimming whitespace.
 *
 * @param value - The code answer to normalize.
 * @returns The normalized code string.
 */
export function normalizeCodeAnswer(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

/**
 * Compares two code answers for equality after normalization.
 *
 * @param left - The first code answer.
 * @param right - The second code answer.
 * @returns `true` if the normalized answers are equal.
 */
export function codeAnswersMatch(left: string, right: string): boolean {
  return normalizeCodeAnswer(left) === normalizeCodeAnswer(right);
}
