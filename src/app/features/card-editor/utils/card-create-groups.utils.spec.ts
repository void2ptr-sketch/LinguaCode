import type { CardKind } from '../../../core/models';
import {
  CARD_CREATE_GROUPS,
  createGroupForKind,
  DEFAULT_KIND_BY_CREATE_GROUP,
  KINDS_BY_CREATE_GROUP,
} from './card-create-groups.utils';

describe('card-create-groups.utils', () => {
  it('maps all kinds into four create groups', () => {
    const kinds: CardKind[] = [
      'select',
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
      expect(CARD_CREATE_GROUPS).toContain(createGroupForKind(kind));
    }
  });

  it('exposes default kind per group', () => {
    expect(DEFAULT_KIND_BY_CREATE_GROUP.choice).toBe('select');
    expect(KINDS_BY_CREATE_GROUP.choice).toContain('reading');
  });
});
