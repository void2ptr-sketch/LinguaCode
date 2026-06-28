import type { CodeHighlightLanguage } from '../models';

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

export function normalizeCodeAnswer(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

export function codeAnswersMatch(left: string, right: string): boolean {
  return normalizeCodeAnswer(left) === normalizeCodeAnswer(right);
}
