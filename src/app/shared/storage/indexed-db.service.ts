/**
 * Лёгкая обёртка над IndexedDB для хранения структурированных данных.
 *
 * Используется для:
 * - Кэша seed-контента (`entities/content-seed`)
 * - Очереди офлайн-мутаций (`features/*` sync-queue)
 *
 * API построено на Promise и не требует ручного управления транзакциями.
 * Если IndexedDB недоступна (SSR, приватный режим, тесты без jsdom),
 * все методы отклоняются с понятной ошибкой — вызывающий код решает,
 * как деградировать (например, fallback на HTTP).
 */
import { Injectable } from '@angular/core';

/** Имя базы данных приложения. */
export const IDB_DATABASE_NAME = 'lingua-code';
/** Версия схемы базы данных. Увеличивать при изменении object stores. */
export const IDB_DATABASE_VERSION = 1;

/** Хранилище снапшотов seed-контента (внешние ключи). */
export const IDB_STORE_CONTENT_SEED = 'content-seed';
/** Хранилище очереди офлайн-мутаций (keyPath: `id`). */
export const IDB_STORE_SYNC_QUEUE = 'sync-queue';

@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Открывает (и при необходимости создаёт) базу данных.
   *
   * Результат кэшируется; при ошибке кэш сбрасывается, чтобы повторная
   * попытка могла переоткрыть БД.
   */
  private open(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available in this environment'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(IDB_DATABASE_NAME, IDB_DATABASE_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(IDB_STORE_CONTENT_SEED)) {
            db.createObjectStore(IDB_STORE_CONTENT_SEED);
          }
          if (!db.objectStoreNames.contains(IDB_STORE_SYNC_QUEUE)) {
            db.createObjectStore(IDB_STORE_SYNC_QUEUE, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error ?? new Error('Failed to open IndexedDB'));
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Читает запись по ключу.
   *
   * @param storeName — имя object store
   * @param key — ключ записи
   * @returns значение записи или `undefined`, если записи нет
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    return new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Сохраняет запись.
   *
   * @param storeName — имя object store
   * @param value — значение записи
   * @param key — ключ (обязателен для store без keyPath; для store с keyPath
   *   ключ берётся из самого значения)
   */
  async set(storeName: string, value: unknown, key?: IDBValidKey): Promise<void> {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      if (key === undefined) {
        store.put(value);
      } else {
        store.put(value, key);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  /**
   * Удаляет запись по ключу.
   *
   * @param storeName — имя object store
   * @param key — ключ записи
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  /**
   * Возвращает все записи хранилища.
   *
   * @param storeName — имя object store
   * @returns массив всех записей
   */
  async getAll<T>(storeName: string): Promise<readonly T[]> {
    const db = await this.open();
    return new Promise<readonly T[]>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Очищает хранилище.
   *
   * @param storeName — имя object store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
}