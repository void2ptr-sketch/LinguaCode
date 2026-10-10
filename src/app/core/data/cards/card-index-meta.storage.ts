import type { CardIndexMetaOverride } from './card-index.mapper';
import { migrateUserContentOverlayIfNeeded } from '../user/user-content-overlay.migration';
import {
  patchUserContentOverlay,
  readUserContentOverlay,
} from '../user/user-content-overlay.storage';
import { LEGACY_CARD_INDEX_META_KEY } from '../user/user-content-overlay.types';

/** @deprecated Legacy key; metadata lives in user-content overlay. */
export const CARD_INDEX_META_STORAGE_KEY = LEGACY_CARD_INDEX_META_KEY;

/** Загружает переопределения метаданных индекса из user-content overlay. */
export function loadCardIndexMetaOverrides(): Record<string, CardIndexMetaOverride> {
  migrateUserContentOverlayIfNeeded();
  return { ...readUserContentOverlay().cardIndexMeta };
}

/** Сохраняет все переопределения метаданных индекса в user-content overlay. */
export function saveCardIndexMetaOverrides(metaById: Record<string, CardIndexMetaOverride>): void {
  migrateUserContentOverlayIfNeeded();
  patchUserContentOverlay({ cardIndexMeta: metaById });
}

/**
 * Добавляет или обновляет переопределение метаданных для одной карточки.
 * Возвращает обновлённый объект метаданных.
 */
export function upsertCardIndexMetaOverride(
  cardId: string,
  meta: CardIndexMetaOverride,
): Record<string, CardIndexMetaOverride> {
  migrateUserContentOverlayIfNeeded();
  const overlay = readUserContentOverlay();
  const next = { ...overlay.cardIndexMeta, [cardId]: meta };
  patchUserContentOverlay({ cardIndexMeta: next });
  return next;
}

/** Удаляет переопределение метаданных для указанной карточки из хранилища. */
export function removeCardIndexMetaOverride(cardId: string): void {
  migrateUserContentOverlayIfNeeded();
  const overlay = readUserContentOverlay();
  if (!(cardId in overlay.cardIndexMeta)) {
    return;
  }

  const { [cardId]: removed, ...rest } = overlay.cardIndexMeta;
  void removed;
  patchUserContentOverlay({ cardIndexMeta: rest });
}
