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

@Injectable({ providedIn: 'root' })
export class CodeHighlightService {
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
