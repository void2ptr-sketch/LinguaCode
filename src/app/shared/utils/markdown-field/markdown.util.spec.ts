import { TestBed } from '@angular/core/testing';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';

import { renderMarkdownToHtml } from './markdown.util';

describe('renderMarkdownToHtml', () => {
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BrowserModule] });
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('returns empty string for blank input', () => {
    expect(renderMarkdownToHtml('   ', sanitizer)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(renderMarkdownToHtml('', sanitizer)).toBe('');
  });

  it('returns empty string for null-like whitespace-only input', () => {
    expect(renderMarkdownToHtml('  \n\t  ', sanitizer)).toBe('');
  });

  it('renders bold formatting', () => {
    const html = renderMarkdownToHtml('**bold**', sanitizer);
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders italic formatting', () => {
    const html = renderMarkdownToHtml('*italic*', sanitizer);
    expect(html).toContain('<em>italic</em>');
  });

  it('renders inline code', () => {
    const html = renderMarkdownToHtml('use `code` here', sanitizer);
    expect(html).toContain('<code>code</code>');
  });

  it('renders mixed basic markdown formatting', () => {
    const html = renderMarkdownToHtml('**bold** and `code`', sanitizer);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('renders headings', () => {
    const html = renderMarkdownToHtml('# H1\n## H2\n### H3', sanitizer);
    expect(html).toContain('<h1>H1</h1>');
    expect(html).toContain('<h2>H2</h2>');
    expect(html).toContain('<h3>H3</h3>');
  });

  it('renders paragraphs with line breaks', () => {
    const html = renderMarkdownToHtml('line1\nline2', sanitizer);
    expect(html).toContain('<br>');
  });

  it('renders unordered lists', () => {
    const html = renderMarkdownToHtml('- item1\n- item2', sanitizer);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>item1</li>');
    expect(html).toContain('<li>item2</li>');
  });

  it('renders ordered lists', () => {
    const html = renderMarkdownToHtml('1. first\n2. second', sanitizer);
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>first</li>');
    expect(html).toContain('<li>second</li>');
  });

  it('renders links', () => {
    const html = renderMarkdownToHtml('[text](http://example.com)', sanitizer);
    expect(html).toContain('<a href="http://example.com">text</a>');
  });

  it('renders images', () => {
    const html = renderMarkdownToHtml('![alt](image.png)', sanitizer);
    expect(html).toContain('<img src="image.png" alt="alt"');
  });

  it('renders blockquotes', () => {
    const html = renderMarkdownToHtml('> quoted text', sanitizer);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('quoted text');
  });

  it('renders horizontal rules', () => {
    const html = renderMarkdownToHtml('---', sanitizer);
    expect(html).toContain('<hr');
  });

  it('renders code blocks', () => {
    const html = renderMarkdownToHtml('```\ncode block\n```', sanitizer);
    expect(html).toContain('<pre>');
    expect(html).toContain('<code>');
  });

  it('strips script tags from rendered html (XSS protection)', () => {
    const html = renderMarkdownToHtml('<script>alert(1)</script>', sanitizer);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });

  it('sanitizes javascript: protocol in image src', () => {
    const html = renderMarkdownToHtml('![onerror](javascript:alert(1))', sanitizer);
    expect(html).toContain('unsafe:javascript:alert(1)');
  });

  it('sanitizes javascript: protocol in href', () => {
    const html = renderMarkdownToHtml('[click](javascript:alert(1))', sanitizer);
    expect(html).toContain('unsafe:javascript:alert(1)');
  });

  it('trims input before rendering', () => {
    const html = renderMarkdownToHtml('  **bold**  ', sanitizer);
    expect(html).toContain('<strong>bold</strong>');
  });

  it('returns empty string when sanitizer returns null', () => {
    const sanitizedSanitizer = {
      ...sanitizer,
      sanitize: vi.fn(() => null),
    } as unknown as DomSanitizer;

    const result = renderMarkdownToHtml('**bold**', sanitizedSanitizer);
    expect(result).toBe('');
  });

  it('handles GFM strikethrough', () => {
    const html = renderMarkdownToHtml('~~strikethrough~~', sanitizer);
    expect(html).toContain('<del>strikethrough</del>');
  });
});
