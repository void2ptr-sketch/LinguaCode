/**
 * Персистентный слой seed-контента поверх IndexedDB.
 *
 * Хранит единый снапшот нормализованных seed-данных (сценарии, курсы,
 * уроки, карточки) вместе с версией manifest. Это позволяет:
 * - Быстро гидратировать in-memory кэш без повторной загрузки и парсинга
 *   всех fixture-файлов (быстрый старт);
 * - Работать офлайн даже без service worker кэша (структурированные данные);
 * - Обнаруживать устаревание снапшота по версии manifest.
 */
import type { Card } from '../card/model';
import type { Course, Lesson } from '../course/model';
import type { Scenario } from '../scenario/model';
import { IDB_STORE_CONTENT_SEED, IndexedDbService } from '../../shared/storage';

/** Ключ записи снапшота в object store. */
const SNAPSHOT_KEY = 'snapshot';

/**
 * Снапшот нормализованных seed-данных.
 *
 * `version` соответствует `ContentManifest.version` и используется для
 * инвалидации кэша при обновлении контента.
 */
export type ContentSeedSnapshot = {
  version: number;
  scenarios: readonly Scenario[];
  courses: readonly Course[];
  lessons: readonly Lesson[];
  cards: readonly Card[];
};

/**
 * Загружает снапшот seed-контента из IndexedDB.
 *
 * @param idb — сервис IndexedDB
 * @returns снапшот или `null`, если кэш пуст
 */
export async function loadContentSeedSnapshot(
  idb: IndexedDbService,
): Promise<ContentSeedSnapshot | null> {
  return (await idb.get<ContentSeedSnapshot>(IDB_STORE_CONTENT_SEED, SNAPSHOT_KEY)) ?? null;
}

/**
 * Сохраняет снапшот seed-контента в IndexedDB.
 *
 * @param idb — сервис IndexedDB
 * @param snapshot — снапшот для сохранения
 */
export async function saveContentSeedSnapshot(
  idb: IndexedDbService,
  snapshot: ContentSeedSnapshot,
): Promise<void> {
  await idb.set(IDB_STORE_CONTENT_SEED, snapshot, SNAPSHOT_KEY);
}

/**
 * Удаляет снапшот seed-контента из IndexedDB.
 *
 * @param idb — сервис IndexedDB
 */
export async function clearContentSeedSnapshot(idb: IndexedDbService): Promise<void> {
  await idb.delete(IDB_STORE_CONTENT_SEED, SNAPSHOT_KEY);
}
