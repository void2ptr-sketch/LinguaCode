import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { NetworkStatusService } from '../api/network-status.service';
import { IDB_STORE_SYNC_QUEUE, IndexedDbService } from '../storage';
import { SyncQueueService } from './sync-queue.service';
import type { SyncQueueEntry, SyncQueueExecutor } from './sync-queue.types';
import { AppLoggerService } from '../logger/app-logger.service';

/** In-memory заглушка IndexedDbService для тестов очереди. */
class FakeIdb {
  private readonly records = new Map<string, unknown>();

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.records.get(`${storeName}:${String(key)}`) as T | undefined;
  }

  async set(storeName: string, value: unknown, key?: IDBValidKey): Promise<void> {
    // Повторяем поведение IndexedDbService: при отсутствии явного ключа
    // используется keyPath записи (поле `id`).
    const recordKey = key ?? (value as { id: IDBValidKey }).id;
    this.records.set(`${storeName}:${String(recordKey)}`, value);
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

describe('SyncQueueService', () => {
  let queue: SyncQueueService;
  let idb: FakeIdb;
  let online: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    online = signal(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: IndexedDbService, useClass: FakeIdb },
        { provide: NetworkStatusService, useValue: { online } },
        {
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
      ],
    });
    queue = TestBed.inject(SyncQueueService);
    idb = TestBed.inject(IndexedDbService) as unknown as FakeIdb;
  });

  it('should enqueue an operation and track pending count', async () => {
    await queue.enqueue('card.create', { card: { id: 'c1' } });

    expect(queue.pendingCount()).toBe(1);
    const entries = await idb.getAll<SyncQueueEntry>(IDB_STORE_SYNC_QUEUE);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe('card.create');
    expect(entries[0]?.attempts).toBe(0);
  });

  it('should replay operations via the executor and remove them on success', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    queue.registerExecutor({ canHandle: () => true, run } satisfies SyncQueueExecutor);
    await queue.enqueue('card.create', { card: { id: 'c1' } });

    await queue.flush();

    expect(run).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount()).toBe(0);
    await expect(idb.getAll(IDB_STORE_SYNC_QUEUE)).resolves.toEqual([]);
  });

  it('should increment attempts on failure and drop after max attempts', async () => {
    const run = vi.fn().mockRejectedValue(new Error('boom'));
    queue.registerExecutor({ canHandle: () => true, run } satisfies SyncQueueExecutor);
    await queue.enqueue('card.create', { card: { id: 'c1' } });

    await queue.flush();
    expect(queue.pendingCount()).toBe(1);
    const entries = await idb.getAll<SyncQueueEntry>(IDB_STORE_SYNC_QUEUE);
    expect(entries[0]?.attempts).toBe(1);

    await queue.flush();
    await queue.flush();

    expect(queue.pendingCount()).toBe(0);
    await expect(idb.getAll(IDB_STORE_SYNC_QUEUE)).resolves.toEqual([]);
  });

  it('should skip operations the executor cannot handle', async () => {
    const run = vi.fn();
    queue.registerExecutor({ canHandle: (kind) => kind === 'card.create', run });
    await queue.enqueue('course.update', { courseId: 'x' });

    await queue.flush();

    expect(run).not.toHaveBeenCalled();
    expect(queue.pendingCount()).toBe(1);
  });

  it('should clear the queue', async () => {
    await queue.enqueue('card.create', { card: { id: 'c1' } });

    await queue.clear();

    expect(queue.pendingCount()).toBe(0);
    await expect(idb.getAll(IDB_STORE_SYNC_QUEUE)).resolves.toEqual([]);
  });
});
