import type { CardKind } from '../../../core/models';
import { CARD_FORM_BY_KIND, CARD_FORM_KIND_GROUP, cardFormKindGroup } from './card-form.registry';

describe('card-form.registry', () => {
  it('maps every card kind to a form group', () => {
    const kinds: CardKind[] = [
      'select',
      'code-select',
      'memory',
      'symbol',
      'sound',
      'timed',
      'keyboard',
      'draw',
      'tone',
      'reading',
    ];

    for (const kind of kinds) {
      expect(cardFormKindGroup(kind)).toBe(CARD_FORM_KIND_GROUP[kind]);
      expect(CARD_FORM_BY_KIND[kind]).toBeDefined();
    }
  });

  it('groups choice kinds together', () => {
    expect(cardFormKindGroup('select')).toBe('choice');
    expect(cardFormKindGroup('tone')).toBe('choice');
    expect(cardFormKindGroup('memory')).toBe('pairs');
    expect(cardFormKindGroup('sound')).toBe('media');
  });
});
