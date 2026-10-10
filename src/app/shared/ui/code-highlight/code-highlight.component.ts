import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { CodeHighlightLanguage } from '../../../core/models';
import { CodeHighlightService } from './code-highlight.service';

/**
 * UI component for syntax-highlighted code blocks using highlight.js.
 *
 * @remarks
 * Sanitizes the highlighted HTML via `DomSanitizer`. Supports multiple languages
 * and inline/block rendering modes.
 *
 * @example
 * ```html
 * <app-code-highlight [code]="sourceCode" language="typescript"></app-code-highlight>
 * <app-code-highlight [code]="snippet" [inline]="true" language="javascript"></app-code-highlight>
 * ```
 */
@Component({
  selector: 'app-code-highlight',
  templateUrl: './code-highlight.component.html',
  styleUrl: './code-highlight.component.scss',
})
export class CodeHighlightComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly highlightService = inject(CodeHighlightService);

  /** The source code string to highlight. Defaults to an empty string. */
  readonly code = input('');

  /** Syntax highlighting language. Defaults to `'plain'`. */
  readonly language = input<CodeHighlightLanguage>('plain');

  /** When `true`, renders the code inline rather than as a block. Defaults to `false`. */
  readonly inline = input(false);

  /** Sanitized HTML string with syntax highlighting classes applied. */
  readonly highlightedHtml = computed(() => {
    const html = this.highlightService.highlight(this.code(), this.language());
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  /** CSS class string for highlight.js (e.g. `'language-typescript'`). */
  readonly languageClass = computed(() => `language-${this.language()}`);
}
