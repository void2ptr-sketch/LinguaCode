import { codeAnswersMatch, normalizeCodeAnswer } from './code-highlight.utils';

describe('code-highlight.utils', () => {
  it('normalizes line endings and trims code answers', () => {
    expect(normalizeCodeAnswer('  foo\r\nbar  ')).toBe('foo\nbar');
  });

  it('matches equivalent code answers', () => {
    expect(codeAnswersMatch('print 1;\n', 'print 1;')).toBeTrue();
    expect(codeAnswersMatch('print 1;', 'print 2;')).toBeFalse();
  });
});
