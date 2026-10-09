import { Injectable } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import perl from 'highlight.js/lib/languages/perl';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import type { CodeHighlightLanguage } from '../../../core/models';

let registered = false;

function registerLanguages(): void {
  if (registered) {
    return;
  }

  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('cpp', cpp);
  hljs.registerLanguage('go', go);
  hljs.registerLanguage('java', java);
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('perl', perl);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('rust', rust);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('typescript', typescript);
  registered = true;
}

/**
 * Service for syntax-highlighting code blocks using highlight.js.
 *
 * @remarks
 * Registers all supported languages on first use. Falls back to auto-detection
 * for unknown languages. Returns escaped HTML for 'plain' language.
 */
@Injectable({ providedIn: 'root' })
export class CodeHighlightService {
  /**
   * Highlights a code block and returns the HTML string.
   *
   * @param code - The source code to highlight.
   * @param language - The syntax highlighting language.
   * @returns HTML string with syntax highlighting classes, or escaped text for 'plain'.
   */
  highlight(code: string, language: CodeHighlightLanguage): string {
    registerLanguages();
    const trimmed = code.trimEnd();
    if (!trimmed) {
      return '';
    }

    if (language === 'plain') {
      return escapeHtml(trimmed);
    }

    if (hljs.getLanguage(language)) {
      return hljs.highlight(trimmed, { language }).value;
    }

    return hljs.highlightAuto(trimmed).value;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
