import type { CardKind } from '../../../core/models';

import {
  cardFormKindGroup,
  CARD_FORM_KIND_GROUP,
  CARD_FORM_BY_KIND,
} from './card-form.registry';

describe('card-form.registry', () => {
  describe('CARD_FORM_KIND_GROUP', () => {
    it('maps all card kinds to their form groups', () => {
      const allKinds: CardKind[] = [
        'select', 'code-select', 'timed', 'reading', 'symbol', 'tone',
        'keyboard', 'draw', 'memory', 'sound',
      ];

      allKinds.forEach((kind) => {
        const group = CARD_FORM_KIND_GROUP[kind as keyof typeof CARD_FORM_KIND_GROUP];
        expect(group).toBeDefined();
        expect(['choice', 'input', 'pairs', 'media']).toContain(group);
      });
    });

    it('maps select, code-select, timed, reading, symbol, tone to choice', () => {
      expect(CARD_FORM_KIND_GROUP.select).toBe('choice');
      expect(CARD_FORM_KIND_GROUP['code-select']).toBe('choice');
      expect(CARD_FORM_KIND_GROUP.timed).toBe('choice');
      expect(CARD_FORM_KIND_GROUP.reading).toBe('choice');
      expect(CARD_FORM_KIND_GROUP.symbol).toBe('choice');
      expect(CARD_FORM_KIND_GROUP.tone).toBe('choice');
    });

    it('maps keyboard and draw to input', () => {
      expect(CARD_FORM_KIND_GROUP.keyboard).toBe('input');
      expect(CARD_FORM_KIND_GROUP.draw).toBe('input');
    });

    it('maps memory to pairs', () => {
      expect(CARD_FORM_KIND_GROUP.memory).toBe('pairs');
    });

    it('maps sound to media', () => {
      expect(CARD_FORM_KIND_GROUP.sound).toBe('media');
    });
  });

  describe('CARD_FORM_BY_KIND', () => {
    it('is an alias for CARD_FORM_KIND_GROUP', () => {
      expect(CARD_FORM_BY_KIND).toBe(CARD_FORM_KIND_GROUP);
    });
  });

  describe('cardFormKindGroup', () => {
    it('looks up the form group for a card kind', () => {
      expect(cardFormKindGroup('select')).toBe('choice');
      expect(cardFormKindGroup('keyboard')).toBe('input');
      expect(cardFormKindGroup('memory')).toBe('pairs');
      expect(cardFormKindGroup('sound')).toBe('media');
    });

    it('returns the correct group for all kinds', () => {
      const allKinds: CardKind[] = [
        'select', 'code-select', 'timed', 'reading', 'symbol', 'tone',
        'keyboard', 'draw', 'memory', 'sound',
      ];

      allKinds.forEach((kind) => {
        const group = CARD_FORM_KIND_GROUP[kind as keyof typeof CARD_FORM_KIND_GROUP];
        expect(cardFormKindGroup(kind)).toBe(group);
      });
    });
  });
});
