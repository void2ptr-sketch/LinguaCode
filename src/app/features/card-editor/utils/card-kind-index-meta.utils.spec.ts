import type { CardKind } from '../../../core/models';
import type { CardDraft } from '../types';

import { indexTagsForDraft, editorVariantLabel } from './card-kind-index-meta.utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDraft(kind: CardKind): CardDraft {
  return {
    kind,
    title: 'Test',
    appearance: {},
  } as CardDraft;
}

// ---------------------------------------------------------------------------
// indexTagsForDraft
// ---------------------------------------------------------------------------

describe('indexTagsForDraft', () => {
  it('always includes the card kind as a tag', () => {
    const draft = makeDraft('select');
    const tags = indexTagsForDraft(draft);

    expect(tags).toContain('select');
  });

  it('adds reading aliases for reading cards', () => {
    const draft = makeDraft('reading');
    const tags = indexTagsForDraft(draft);

    expect(tags).toContain('reading');
    expect(tags).toContain('polyphony');
  });

  it('adds tone aliases for tone cards', () => {
    const draft = makeDraft('tone');
    const tags = indexTagsForDraft(draft);

    expect(tags).toContain('tone');
    expect(tags).toContain('pinyin-tone');
  });

  it('does not add aliases for other card kinds', () => {
    const draft = makeDraft('select');
    const tags = indexTagsForDraft(draft);

    expect(tags).not.toContain('polyphony');
    expect(tags).not.toContain('pinyin-tone');
    expect(tags.length).toBe(1);
  });

  it('returns array with just kind for code-select', () => {
    const draft = makeDraft('code-select');
    const tags = indexTagsForDraft(draft);

    expect(tags).toContain('code-select');
    expect(tags.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// editorVariantLabel
// ---------------------------------------------------------------------------

describe('editorVariantLabel', () => {
  it('returns label for reading cards', () => {
    const label = editorVariantLabel('reading');
    expect(label).toBe('Чтение (select + meta)');
  });

  it('returns label for tone cards', () => {
    const label = editorVariantLabel('tone');
    expect(label).toBe('Тон (автоварианты из слога)');
  });

  it('returns label for code-select cards', () => {
    const label = editorVariantLabel('code-select');
    expect(label).toBe('Код: выбор ответа');
  });

  it('returns null for standard card kinds', () => {
    expect(editorVariantLabel('select')).toBeNull();
    expect(editorVariantLabel('memory')).toBeNull();
    expect(editorVariantLabel('keyboard')).toBeNull();
    expect(editorVariantLabel('draw')).toBeNull();
    expect(editorVariantLabel('symbol')).toBeNull();
    expect(editorVariantLabel('sound')).toBeNull();
    expect(editorVariantLabel('timed')).toBeNull();
  });
});
