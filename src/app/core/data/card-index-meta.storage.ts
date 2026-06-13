import type { CardIndexMetaOverride } from './card-index.mapper';

export const CARD_INDEX_META_STORAGE_KEY = 'lingua-code.card-index-meta';

export function loadCardIndexMetaOverrides(): Record<string, CardIndexMetaOverride> {
  const raw = localStorage.getItem(CARD_INDEX_META_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, CardIndexMetaOverride>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCardIndexMetaOverrides(metaById: Record<string, CardIndexMetaOverride>): void {
  localStorage.setItem(CARD_INDEX_META_STORAGE_KEY, JSON.stringify(metaById));
}

export function upsertCardIndexMetaOverride(
  cardId: string,
  meta: CardIndexMetaOverride,
): Record<string, CardIndexMetaOverride> {
  const next = { ...loadCardIndexMetaOverrides(), [cardId]: meta };
  saveCardIndexMetaOverrides(next);
  return next;
}

export function removeCardIndexMetaOverride(cardId: string): void {
  const current = loadCardIndexMetaOverrides();
  if (!(cardId in current)) {
    return;
  }

  const { [cardId]: removed, ...rest } = current;
  void removed;
  saveCardIndexMetaOverrides(rest);
}
