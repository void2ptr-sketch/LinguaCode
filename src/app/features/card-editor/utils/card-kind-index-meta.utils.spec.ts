import { describe, expect, it } from 'vitest';

import type { CardDraft } from '../types';
import { editorVariantLabel, indexTagsForDraft } from './card-kind-index-meta.utils';

describe('indexTagsForDraft', () => {
  it('should include the card kind as the base tag', () => {
    const draft = { kind: 'select' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toContain('select');
  });

  it('should return single tag for standard card kinds', () => {
    const draft = { kind: 'keyboard' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['keyboard']);
  });

  it('should add reading aliases for reading kind', () => {
    const draft = { kind: 'reading' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toContain('reading');
    expect(tags).toContain('polyphony');
    expect(tags).toHaveLength(2);
  });

  it('should add tone aliases for tone kind', () => {
    const draft = { kind: 'tone' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toContain('tone');
    expect(tags).toContain('pinyin-tone');
    expect(tags).toHaveLength(2);
  });

  it('should not add aliases for code-select kind', () => {
    const draft = { kind: 'code-select' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['code-select']);
  });

  it('should not add aliases for draw kind', () => {
    const draft = { kind: 'draw' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['draw']);
  });

  it('should not add aliases for sound kind', () => {
    const draft = { kind: 'sound' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['sound']);
  });

  it('should not add aliases for timed kind', () => {
    const draft = { kind: 'timed' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['timed']);
  });

  it('should not add aliases for symbol kind', () => {
    const draft = { kind: 'symbol' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['symbol']);
  });

  it('should not add aliases for memory kind', () => {
    const draft = { kind: 'memory' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['memory']);
  });

  it('should not add aliases for select kind', () => {
    const draft = { kind: 'select' } as CardDraft;
    const tags = indexTagsForDraft(draft);
    expect(tags).toEqual(['select']);
  });
});

describe('editorVariantLabel', () => {
  it('should return label for reading kind', () => {
    expect(editorVariantLabel('reading')).toBe('Чтение (select + meta)');
  });

  it('should return label for tone kind', () => {
    expect(editorVariantLabel('tone')).toBe('Тон (автоварианты из слога)');
  });

  it('should return label for code-select kind', () => {
    expect(editorVariantLabel('code-select')).toBe('Код: выбор ответа');
  });

  it('should return null for standard card kinds', () => {
    expect(editorVariantLabel('select')).toBeNull();
    expect(editorVariantLabel('memory')).toBeNull();
    expect(editorVariantLabel('symbol')).toBeNull();
    expect(editorVariantLabel('sound')).toBeNull();
    expect(editorVariantLabel('timed')).toBeNull();
    expect(editorVariantLabel('keyboard')).toBeNull();
    expect(editorVariantLabel('draw')).toBeNull();
  });

  it('should return special label for reading kind', () => {
    expect(editorVariantLabel('reading')).toBe('Чтение (select + meta)');
  });

  it('should return special label for tone kind', () => {
    expect(editorVariantLabel('tone')).toBe('Тон (автоварианты из слога)');
  });
});
