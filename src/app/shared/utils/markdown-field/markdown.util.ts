import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Renders Markdown source to sanitized HTML.
 *
 * @param source - The Markdown string to render.
 * @param sanitizer - Angular's `DomSanitizer` instance.
 * @returns Sanitized HTML string, or empty string if source is empty.
 *
 * @remarks
 * Uses `marked` with GFM and line-break options. The output is sanitized
 * via Angular's `SecurityContext.HTML` to prevent XSS attacks.
 */
export function renderMarkdownToHtml(source: string, sanitizer: DomSanitizer): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return '';
  }

  const rawHtml = marked.parse(trimmed, { async: false }) as string;
  return sanitizer.sanitize(SecurityContext.HTML, rawHtml) ?? '';
}
