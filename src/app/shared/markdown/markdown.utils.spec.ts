import { TestBed } from '@angular/core/testing';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';

import { renderMarkdownToHtml } from './markdown.utils';

describe('renderMarkdownToHtml', () => {
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BrowserModule] });
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('returns empty string for blank input', () => {
    expect(renderMarkdownToHtml('   ', sanitizer)).toBe('');
  });

  it('renders basic markdown formatting', () => {
    const html = renderMarkdownToHtml('**bold** and `code`', sanitizer);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('strips script tags from rendered html', () => {
    const html = renderMarkdownToHtml('<script>alert(1)</script>', sanitizer);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });
});
