/**
 * Очередь офлайн-мутаций (write-behind sync).
 *
 * Назначение:
 * - Сохранять пользовательские изменения (создание/обновление/удаление),
 *   сделанные офлайн или при недоступности API, в IndexedDB;
 * - Автоматически воспроизводить накопленные операции при возврате сети;
 * - Отслеживать количество ожидающих операций через сигнал `pendingCount`.
 *
 * Исполнитель операций регистрируется один раз при старте приложения
 * (`SyncQueueBootstrap`). Операции, которые исполнитель не умеет обрабатывать,
 * остаются в очереди и не блокируют остальные.
 */
import { Injectable, effect, inject, signal } from '@angular/core';
import { AppLoggerService } from '../logger/app-logger.service';
import { NetworkStatusService } from '../api/network-status.service';
import { IDB_STORE_SYNC_QUEUE, IndexedDbService } from '../storage';
import { MAX_SYNC_ATTEMPTS, type SyncQueueEntry, type SyncQueueExecutor } from './sync-queue.types';

@Injectable({ providedIn: 'root' })
export class SyncQueueService {
  private readonly idb = inject(IndexedDbService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly logger = inject(AppLoggerService);

  private executor: SyncQueueExecutor | null = null;
  private flushing = false;

  /** Количество операций, ожидающих синхронизации. */
  readonly pendingCount = signal(0);
  /** Признак активного воспроизведения очереди. */
  readonly isFlushing = signal(false);

  constructor() {
    // Автоматический flush при возврате сети.
    effect(() => {
      if (this.networkStatus.online()) {
        void this.flush();
      }
    });
  }

  /**
   * Регистрирует исполнитель операций.
   *
   * @param executor — исполнитель, умеющий воспроизводить операции очереди
   */
  registerExecutor(executor: SyncQueueExecutor): void {
    this.executor = executor;
  }

  /**
   * Ставит операцию в очередь.
   *
   * @param kind — вид операции (например, `'card.create'`)
   * @param payload — сериализуемые данные операции
   */
  async enqueue(kind: string, payload: unknown): Promise<void> {
    const entry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      kind,
      payload,
      createdAt: Date.now(),
      attempts: 0,
    };
    await this.idb.set(IDB_STORE_SYNC_QUEUE, entry);
    this.pendingCount.update((count) => count + 1);
    this.logger.info(`Sync queue: enqueued ${kind}`);
  }

  /**
   * Воспроизводит все ожидающие операции.
   *
   * Успешные операции удаляются из очереди. Неудачные — получают инкремент
   * счётчика попыток; после `MAX_SYNC_ATTEMPTS` операция отбрасывается
   * с записью в лог.
   */
  async flush(): Promise<void> {
    if (this.flushing || !this.executor) {
      return;
    }

    this.flushing = true;
    this.isFlushing.set(true);
    try {
      const entries = await this.idb.getAll<SyncQueueEntry>(IDB_STORE_SYNC_QUEUE);
      for (const entry of entries) {
        if (!this.executor.canHandle(entry.kind)) {
          continue;
        }

        try {
          await this.executor.run(entry);
          await this.idb.delete(IDB_STORE_SYNC_QUEUE, entry.id);
          this.pendingCount.update((count) => Math.max(0, count - 1));
          this.logger.info(`Sync queue: replayed ${entry.kind} (${entry.id})`);
        } catch (error) {
          const attempts = entry.attempts + 1;
          if (attempts >= MAX_SYNC_ATTEMPTS) {
            await this.idb.delete(IDB_STORE_SYNC_QUEUE, entry.id);
            this.pendingCount.update((count) => Math.max(0, count - 1));
            this.logger.error(
              `Sync queue: dropping ${entry.kind} (${entry.id}) after ${attempts} attempts`,
              error,
            );
          } else {
            await this.idb.set(IDB_STORE_SYNC_QUEUE, { ...entry, attempts }, entry.id);
            this.logger.warn(
              `Sync queue: ${entry.kind} (${entry.id}) failed, attempt ${attempts}`,
              error,
            );
          }
        }
      }
    } finally {
      this.flushing = false;
      this.isFlushing.set(false);
    }
  }

  /**
   * Очищает очередь (например, при выходе пользователя).
   */
  async clear(): Promise<void> {
    await this.idb.clear(IDB_STORE_SYNC_QUEUE);
    this.pendingCount.set(0);
  }
}