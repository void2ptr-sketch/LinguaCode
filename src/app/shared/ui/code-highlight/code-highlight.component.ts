import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { CodeHighlightLanguage } from '../../../core/models';
import { CodeHighlightService } from './code-highlight.service';

@Component({
  selector: 'app-code-highlight',
  templateUrl: './code-highlight.component.html',
  styleUrl: './code-highlight.component.scss',
})
export class CodeHighlightComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly highlightService = inject(CodeHighlightService);

  readonly code = input('');
  readonly language = input<CodeHighlightLanguage>('plain');
  readonly inline = input(false);

  readonly highlightedHtml = computed(() => {
    const html = this.highlightService.highlight(this.code(), this.language());
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  readonly languageClass = computed(() => `language-${this.language()}`);
}
