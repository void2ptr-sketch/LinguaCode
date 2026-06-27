import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdownToHtml(source: string, sanitizer: DomSanitizer): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return '';
  }

  const rawHtml = marked.parse(trimmed, { async: false }) as string;
  return sanitizer.sanitize(SecurityContext.HTML, rawHtml) ?? '';
}
