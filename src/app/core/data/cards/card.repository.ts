/**
 * Репозиторий карточек.
 *
 * Это КРИТИЧЕСКИ ВАЖНЫЙ класс для понимания проблемы "карточки не отображаются".
 *
 * Архитектура:
 * 1. Seed-данные — карточки из файлов public/data/cards/*.json
 * 2. Overlay — пользовательские изменения из localStorage
 * 3. Resolver — объединяет seed и overlay, применяя правила приоритета
 *
 * Процесс загрузки (loadStored):
 * 1. Migrates legacy overlay (если нужно)
 * 2. Загружает seed-карточки из ContentSeedRepository
 * 3. Загружает overlay из localStorage
 * 4. Вызывает resolveCards() для объединения
 *
 * Проблема "карточки не отображаются":
 * Если ID карточки есть в overlay.deletedSystemIds.cards, то карточка
 * исключается из каталога, ДАЖЕ если она есть в файле.
 *
 * Решение:
 * ```javascript
 * localStorage.removeItem('lingua-code.user-content-overlay');
 * location.reload();
 * ```
 */
import { Injectable, inject } from '@angular/core';

import { Card } from '../../models';
import { getCardSeedCache } from '../content-seed/content-seed.cache';
import { ContentSeedRepository } from '../content-seed/content-seed.repository';
import { normalizeLegacyCards } from './card-legacy.mapper';
import { mergeDrawCardQuestionFields } from '../chinese/draw-card.utils';
import { migrateUserContentOverlayIfNeeded } from '../user/user-content-overlay.migration';
import { computeCardsOverlay, resolveCards } from '../user/user-content-overlay.resolver';
import {
  patchUserContentOverlay,
  readUserContentOverlay,
} from '../user/user-content-overlay.storage';

/**
 * @deprecated Legacy-ключ хранилища; мигрирован в user-content overlay.
 * Используется только для обратной совместимости.
 */
export const CARDS_STORAGE_KEY = 'lingua-code.cards';

/**
 * ID демо-карточек, снятых с seed — не подмешивать из overlay.
 * Используется для удаления устаревших карточек.
 */
const REMOVED_SEED_CARD_IDS = new Set(['draw-jiangenshenfang-1']);

/**
 * Репозиторий карточек.
 *
 * Основные возможности:
 * - Загрузка карточек из seed + overlay (loadStored)
 * - Сохранение изменений в overlay (save)
 * - Загрузка seed-карточек (loadSeed)
 * - Слияние stored и seed (mergeWithSeed)
 * - Получение карточки по ID (getById)
 * - Преобразование в каталог (toCatalogItems)
 *
 * Жизненный цикл:
 * 1. При первом запуске загружает seed из файлов
 * 2. При каждом запуске загружает overlay из localStorage
 * 3. Объединяет через resolveCards()
 * 4. При сохранении вычисляет новый overlay через computeCardsOverlay()
 */
@Injectable({ providedIn: 'root' })
export class CardRepository {
  /** Репозиторий seed-данных */
  private readonly contentSeed = inject(ContentSeedRepository);

  /**
   * Загружает карточки из seed + overlay.
   *
   * Это КРИТИЧЕСКИ ВАЖНЫЙ метод для понимания проблемы "карточки не отображаются".
   *
   * Процесс:
   * 1. Migrates legacy overlay (если нужно)
   * 2. Загружает seed-карточки из ContentSeedRepository
   * 3. Загружает overlay из localStorage
   * 4. Вызывает resolveCards() для объединения
   *
   * Проблема:
   * Если ID карточки есть в overlay.deletedSystemIds.cards, то карточка
   * исключается из каталога, ДАЖЕ если она есть в файле.
   *
   * @returns массив карточек (seed + overlay)
   */
  loadStored(): readonly Card[] {
    migrateUserContentOverlayIfNeeded();
    return resolveCards(this.getSeed(), readUserContentOverlay());
  }

  /**
   * Сохраняет изменения в overlay.
   *
   * Вычисляет разницу между текущими карточками и seed,
   * затем сохраняет только различия в localStorage.
   *
   * @param cards — текущие карточки
   */
  save(cards: readonly Card[]): void {
    migrateUserContentOverlayIfNeeded();
    const seed = this.getSeed();
    const previous = readUserContentOverlay();
    const computed = computeCardsOverlay(cards, seed, previous);

    patchUserContentOverlay({
      cards: computed.cards,
      deletedSystemIds: {
        ...previous.deletedSystemIds,
        cards: computed.deletedSystemIds?.cards,
      },
    });
  }

  /**
   * Загружает seed-карточки из файлов.
   *
   * Предзагружает все seed-данные (если ещё не загружены),
   * затем возвращает seed-карточки.
   *
   * @returns Promise с seed-карточками
   */
  loadSeed(): Promise<readonly Card[]> {
    return this.contentSeed.preload().then(() => this.getSeed());
  }

  /**
   * Сливает stored и seed карточки.
   *
   * Используется для legacy-миграции.
   *
   * @param stored — stored карточки
   * @param seed — seed карточки
   * @returns объединённый массив карточек
   */
  mergeWithSeed(stored: readonly Card[], seed: readonly Card[]): readonly Card[] {
    const byId = new Map<string, Card>();

    for (const card of seed) {
      byId.set(card.id, card);
    }

    for (const card of stored) {
      if (REMOVED_SEED_CARD_IDS.has(card.id)) {
        continue;
      }

      const seedCard = byId.get(card.id);
      if (card.kind === 'draw' && seedCard?.kind === 'draw') {
        byId.set(card.id, mergeDrawCardQuestionFields(card, seedCard));
        continue;
      }

      byId.set(card.id, card);
    }

    return [...byId.values()].filter((card) => !REMOVED_SEED_CARD_IDS.has(card.id));
  }

  /**
   * Гарантирует, что seed-данные загружены, и возвращает карточки.
   *
   * Это КРИТИЧЕСКИ ВАЖНЫЙ метод для инициализации приложения.
   *
   * Процесс:
   * 1. Предзагружает seed-данные (если ещё не загружены)
   * 2. Migrates legacy overlay (если нужно)
   * 3. Загружает карточки через loadStored()
   *
   * @returns Promise с загруженными карточками
   */
  async ensureLoaded(): Promise<readonly Card[]> {
    await this.contentSeed.preload();
    migrateUserContentOverlayIfNeeded();
    return this.loadStored();
  }

  /**
   * Получает карточку по ID.
   *
   * @param cards — массив карточек
   * @param cardId — ID карточки
   * @returns карточка или null если не найдена
   */
  getById(cards: readonly Card[], cardId: string): Card | null {
    return cards.find((card) => card.id === cardId) ?? null;
  }

  /**
   * Преобразует массив карточек в каталог.
   *
   * @param cards — массив карточек
   * @returns каталог карточек
   */
  toCatalogItems(
    cards: readonly Card[],
  ): readonly { id: string; kind: Card['kind']; title: string }[] {
    return cards.map((card) => ({
      id: card.id,
      kind: card.kind,
      title: card.title,
    }));
  }

  /**
   * Возвращает seed-карточки из кэша.
   *
   * @returns seed-карточки
   * @private
   */
  private getSeed(): readonly Card[] {
    const seed = getCardSeedCache();
    return seed.length > 0 ? seed : normalizeLegacyCards([]);
  }
}
