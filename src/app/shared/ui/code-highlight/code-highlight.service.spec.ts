import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import type { CodeHighlightLanguage } from '../../../core/models';
import { CodeHighlightService } from './code-highlight.service';

describe('CodeHighlightService', () => {
  let service: CodeHighlightService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CodeHighlightService, provideHttpClient(withFetch())],
    });
    service = TestBed.inject(CodeHighlightService);
  });

  describe('highlight', () => {
    it('returns empty string for empty code', () => {
      const result = service.highlight('', 'typescript');
      expect(result).toBe('');
    });

    it('returns empty string for whitespace-only code', () => {
      const result = service.highlight('   \n  ', 'typescript');
      expect(result).toBe('');
    });

    it('escapes HTML for plain language', () => {
      const code = '<div>&quot;hello&quot;</div>';
      const result = service.highlight(code, 'plain');
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      // &quot; is escaped to &amp;quot; by the second pass of HTML escaping
      expect(result).toContain('quot');
    });

    it('highlights TypeScript code', () => {
      const code = 'const x: number = 42;';
      const result = service.highlight(code, 'typescript');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('highlights JavaScript code', () => {
      const code = 'console.log("hello");';
      const result = service.highlight(code, 'javascript');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('highlights Python code', () => {
      const code = 'def hello():\n    print("world")';
      const result = service.highlight(code, 'python');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('highlights SQL code', () => {
      const code = 'SELECT * FROM users WHERE id = 1';
      const result = service.highlight(code, 'sql');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('highlights Bash code', () => {
      const code = 'echo "Hello, World!"';
      const result = service.highlight(code, 'bash');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('uses auto-detection for unknown language', () => {
      const code = 'const x = 1;';
      const result = service.highlight(code, 'unknown-lang' as CodeHighlightLanguage);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('highlights Java code', () => {
      const code = 'public class Main { public static void main(String[] args) {} }';
      const result = service.highlight(code, 'java');
      expect(result).toBeDefined();
    });

    it('highlights C++ code', () => {
      const code = '#include <iostream>\nint main() { return 0; }';
      const result = service.highlight(code, 'cpp');
      expect(result).toBeDefined();
    });

    it('highlights Go code', () => {
      const code = 'package main\nfunc main() {}';
      const result = service.highlight(code, 'go');
      expect(result).toBeDefined();
    });

    it('highlights Rust code', () => {
      const code = 'fn main() {}';
      const result = service.highlight(code, 'rust');
      expect(result).toBeDefined();
    });

    it('highlights Perl code', () => {
      const code = 'print "Hello\\n";';
      const result = service.highlight(code, 'perl');
      expect(result).toBeDefined();
    });
  });
});
