import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  IDB_STORE_CONTENT_SEED,
  IDB_STORE_SYNC_QUEUE,
  IndexedDbService,
} from './indexed-db.service';

/**
 * Минимальная in-memory реализация IndexedDB для тестов.
 *
 * Поддерживает только операции, используемые IndexedDbService:
 * open (с onupgradeneeded), get/put/delete/getAll/clear, транзакции.
 * События диспатчатся в микротасках, как в реальном браузере.
 */
function createFakeIndexedDb(): IDBFactory {
  const stores = new Map<string, Map<IDBValidKey, unknown>>();

  const makeRequest = <T>(result: T): IDBRequest<T> => {
    const request = { result } as IDBRequest<T>;
    queueMicrotask(() => request.onsuccess?.({ target: request } as unknown as Event));
    return request;
  };

  const db = {
    objectStoreNames: {
      contains: (name: string) => stores.has(name),
    },
    createObjectStore: (name: string) => {
      stores.set(name, new Map());
      return {} as IDBObjectStore;
    },
    transaction: (storeNames: string | string[]) => {
      const names = typeof storeNames === 'string' ? [storeNames] : [...storeNames];
      for (const name of names) {
        if (!stores.has(name)) {
          stores.set(name, new Map());
        }
      }
      const transaction = {
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore: (name: string) => {
          const store = stores.get(name) ?? new Map<IDBValidKey, unknown>();
          return {
            get: (key: IDBValidKey) => makeRequest(store.get(key)),
            put: (value: unknown, key?: IDBValidKey) => {
              const recordKey = key ?? (value as { id: IDBValidKey }).id;
              store.set(recordKey, value);
              return makeRequest(recordKey);
            },
            delete: (key: IDBValidKey) => {
              store.delete(key);
              return makeRequest(undefined);
            },
            getAll: () => makeRequest([...store.values()]),
            clear: () => {
              store.clear();
              return makeRequest(undefined);
            },
          } as IDBObjectStore;
        },
      } as IDBTransaction;
      queueMicrotask(() => transaction.oncomplete?.({} as Event));
      return transaction;
    },
  } as unknown as IDBDatabase;

  return {
    open: () => {
      const request = {
        result: db,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        error: null,
      } as IDBOpenDBRequest;
      queueMicrotask(() => {
        request.onupgradeneeded?.({ target: request } as unknown as IDBVersionChangeEvent);
        request.onsuccess?.({ target: request } as unknown as Event);
      });
      return request;
    },
  } as unknown as IDBFactory;
}

describe('IndexedDbService', () => {
  it('should reject when IndexedDB is unavailable', async () => {
    const originalIndexedDb = globalThis.indexedDB;
    // @ts-expect-error — намеренно убираем глобал для проверки деградации
    delete globalThis.indexedDB;

    try {
      const service = TestBed.inject(IndexedDbService);
      await expect(service.get('content-seed', 'snapshot')).rejects.toThrow(
        'IndexedDB is not available',
      );
    } finally {
      globalThis.indexedDB = originalIndexedDb;
    }
  });

  it('should round-trip records through get/set/delete', async () => {
    const originalIndexedDb = globalThis.indexedDB;
    globalThis.indexedDB = createFakeIndexedDb();

    try {
      const service = TestBed.inject(IndexedDbService);

      await service.set(IDB_STORE_CONTENT_SEED, { version: 1, items: ['a'] }, 'snapshot');
      await expect(service.get(IDB_STORE_CONTENT_SEED, 'snapshot')).resolves.toEqual({
        version: 1,
        items: ['a'],
      });

      await service.delete(IDB_STORE_CONTENT_SEED, 'snapshot');
      await expect(service.get(IDB_STORE_CONTENT_SEED, 'snapshot')).resolves.toBeUndefined();
    } finally {
      globalThis.indexedDB = originalIndexedDb;
    }
  });

  it('should store records with inline keyPath (sync queue) and list them', async () => {
    const originalIndexedDb = globalThis.indexedDB;
    globalThis.indexedDB = createFakeIndexedDb();

    try {
      const service = TestBed.inject(IndexedDbService);

      await service.set(IDB_STORE_SYNC_QUEUE, { id: 'op-1', kind: 'create', attempts: 0 });
      await service.set(IDB_STORE_SYNC_QUEUE, { id: 'op-2', kind: 'update', attempts: 1 });

      const all = await service.getAll<{ id: string; kind: string }>(IDB_STORE_SYNC_QUEUE);
      expect(all.map((record) => record.id).sort()).toEqual(['op-1', 'op-2']);

      await service.clear(IDB_STORE_SYNC_QUEUE);
      await expect(service.getAll(IDB_STORE_SYNC_QUEUE)).resolves.toEqual([]);
    } finally {
      globalThis.indexedDB = originalIndexedDb;
    }
  });
});