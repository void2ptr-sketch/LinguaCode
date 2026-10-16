/**
 * Регистрация исполнителей очереди офлайн-мутаций.
 *
 * Связывает `SyncQueueService` с API-сервисами: при возврате сети операции,
 * накопленные офлайн, воспроизводятся через реальные API-вызовы.
 *
 * Инстанцируется при старте приложения (см. `app.config.ts`).
 */
import { Injectable, inject } from '@angular/core';
import { CardsApiService } from '../../entities/card/api/cards-api.service';
import { ScenariosApiService } from '../../entities/scenario/api/scenarios-api.service';
import { CoursesApiService } from '../../entities/course/api/courses-api.service';
import type { Card } from '../../entities/card/model';
import type { ScenarioWritePayload } from '../../entities/scenario/repository/scenario-catalog.port';
import type { CourseWritePayload } from '../../entities/course/repository/course-catalog.port';
import { SyncQueueService, type SyncQueueEntry } from '../../shared/sync';

type CardCreatePayload = { card: Card };
type CardUpdatePayload = { cardId: string; card: Card };
type CardDeletePayload = { cardId: string };
type ScenarioWritePayloadEntry = { payload: ScenarioWritePayload };
type ScenarioUpdatePayloadEntry = { scenarioId: string; payload: ScenarioWritePayload };
type ScenarioDeletePayloadEntry = { scenarioId: string };
type CourseWritePayloadEntry = { payload: CourseWritePayload };
type CourseUpdatePayloadEntry = { courseId: string; payload: CourseWritePayload };
type CourseDeletePayloadEntry = { courseId: string };

@Injectable({ providedIn: 'root' })
export class SyncQueueBootstrap {
  private readonly queue = inject(SyncQueueService);
  private readonly cardsApi = inject(CardsApiService);
  private readonly scenariosApi = inject(ScenariosApiService);
  private readonly coursesApi = inject(CoursesApiService);

  constructor() {
    this.queue.registerExecutor({
      canHandle: (kind) =>
        kind.startsWith('card.') || kind.startsWith('scenario.') || kind.startsWith('course.'),
      run: (entry) => this.run(entry),
    });

    // Воспроизводим операции, накопленные в предыдущей сессии.
    void this.queue.flush();
  }

  private async run(entry: SyncQueueEntry): Promise<void> {
    switch (entry.kind) {
      case 'card.create': {
        const { card } = entry.payload as CardCreatePayload;
        await this.cardsApi.create(card);
        return;
      }
      case 'card.update': {
        const { cardId, card } = entry.payload as CardUpdatePayload;
        await this.cardsApi.update(cardId, card);
        return;
      }
      case 'card.delete': {
        const { cardId } = entry.payload as CardDeletePayload;
        await this.cardsApi.delete(cardId);
        return;
      }
      case 'scenario.create': {
        const { payload } = entry.payload as ScenarioWritePayloadEntry;
        await this.scenariosApi.create(payload);
        return;
      }
      case 'scenario.update': {
        const { scenarioId, payload } = entry.payload as ScenarioUpdatePayloadEntry;
        await this.scenariosApi.update(scenarioId, payload);
        return;
      }
      case 'scenario.delete': {
        const { scenarioId } = entry.payload as ScenarioDeletePayloadEntry;
        await this.scenariosApi.delete(scenarioId);
        return;
      }
      case 'course.create': {
        const { payload } = entry.payload as CourseWritePayloadEntry;
        await this.coursesApi.create(payload);
        return;
      }
      case 'course.update': {
        const { courseId, payload } = entry.payload as CourseUpdatePayloadEntry;
        await this.coursesApi.update(courseId, payload);
        return;
      }
      case 'course.delete': {
        const { courseId } = entry.payload as CourseDeletePayloadEntry;
        await this.coursesApi.delete(courseId);
        return;
      }
      default:
        throw new Error(`Unknown sync operation: ${entry.kind}`);
    }
  }
}
