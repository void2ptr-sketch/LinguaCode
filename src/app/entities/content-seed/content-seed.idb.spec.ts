import { describe, expect, it } from 'vitest';
import type { IndexedDbService } from '../../shared/storage';
import {
  clearContentSeedSnapshot,
  loadContentSeedSnapshot,
  saveContentSeedSnapshot,
  type ContentSeedSnapshot,
} from './content-seed.idb';

/** In-memory заглушка IndexedDbService для тестов слоя персистенции. */
class FakeIdb {
  private readonly records = new Map<string, unknown>();

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.records.get(`${storeName}:${String(key)}`) as T | undefined;
  }

  async set(storeName: string, value: unknown, key?: IDBValidKey): Promise<void> {
    this.records.set(`${storeName}:${String(key ?? '')}`, value);
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    this.records.delete(`${storeName}:${String(key)}`);
  }

  async getAll<T>(storeName: string): Promise<readonly T[]> {
    return [...this.records.entries()]
      .filter(([recordKey]) => recordKey.startsWith(`${storeName}:`))
      .map(([, value]) => value as T);
  }

  async clear(storeName: string): Promise<void> {
    for (const recordKey of [...this.records.keys()]) {
      if (recordKey.startsWith(`${storeName}:`)) {
        this.records.delete(recordKey);
      }
    }
  }
}

describe('content-seed.idb', () => {
  const idb = new FakeIdb() as unknown as IndexedDbService;

  it('should return null when no snapshot is stored', async () => {
    await expect(loadContentSeedSnapshot(idb)).resolves.toBeNull();
  });

  it('should save and load a snapshot', async () => {
    const snapshot: ContentSeedSnapshot = {
      version: 2,
      scenarios: [{ id: 's1' } as never],
      courses: [],
      lessons: [],
      cards: [],
    };

    await saveContentSeedSnapshot(idb, snapshot);

    await expect(loadContentSeedSnapshot(idb)).resolves.toEqual(snapshot);
  });

  it('should clear a stored snapshot', async () => {
    await saveContentSeedSnapshot(idb, {
      version: 1,
      scenarios: [],
      courses: [],
      lessons: [],
      cards: [],
    });

    await clearContentSeedSnapshot(idb);

    await expect(loadContentSeedSnapshot(idb)).resolves.toBeNull();
  });
});
