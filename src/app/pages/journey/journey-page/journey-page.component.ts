import { Component, ChangeDetectionStrategy, inject, signal, effect, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { LearningJourneyMapComponent } from '../../../features/journey/components/learning-journey-map/learning-journey-map.component';
import { JourneyAnalyticsService } from '../../../features/journey/services/journey-analytics.service';
import { LearningDashboardService } from '../../../entities/learning/services';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { CourseSearchService } from '../../../entities/course';
import { UserStore } from '../../../entities/user/model/user.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import {
  buildJourneyNodes,
  buildScenarioMap,
} from '../../../entities/journey/lib/journey-nodes.utils';
import type { JourneyLocationNode } from '../../../entities/learning/model';
import type { CardBase } from '../../../entities/card/model';
import type { CourseWithPrograms } from '../../../entities/course/model';
import { CPP_COMPLETE_COURSE_ID } from '../../../entities/course/model';
import { ScenariosApiService } from '../../../entities/scenario/api/scenarios-api.service';
import { CardsApiService } from '../../../entities/card/api/cards-api.service';
import { scenarioCardIds } from '../../../entities/course/utils/course-practice.utils';

/**
 * Journey page component. Renders the learning journey map for the current course,
 * built from scenario and card seed data.
 * @remarks Loads journey nodes from `ContentSeedRepository` and tracks analytics events.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-journey-page',
  imports: [LearningJourneyMapComponent],
  template: `
    @if (loading()) {
      <div class="journey-page__loading" aria-label="Загрузка карты...">
        Загрузка карты обучения...
      </div>
    } @else if (error()) {
      <div class="journey-page__error" role="alert">
        {{ error() }}
      </div>
    } @else if (nodes().length > 0) {
      <app-learning-journey-map
        [courseId]="courseId()"
        [nodes]="nodes()"
        (locationSelect)="onLocationSelect($event)"
      />
    } @else {
      <div class="journey-page__empty" role="status">
        Нет доступных локаций для отображения на карте.
      </div>
    }
  `,
  styleUrl: './journey-page.component.scss',
})
export class JourneyPageComponent {
  private readonly dashboardService = inject<LearningDashboardService>(LearningDashboardService);
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly analyticsService = inject(JourneyAnalyticsService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly scenariosApi = inject(ScenariosApiService);
  private readonly cardsApi = inject(CardsApiService);
  private readonly userStore = inject(UserStore);
  private readonly logger = inject(AppLoggerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly nodes = signal<JourneyLocationNode[]>([]);
  readonly courseId = signal('');

  /** ID курса, который сейчас загружается (защита от параллельных запросов). */
  private loadingCourseId: string | null = null;

  /** ID последнего успешно загруженного курса (защита от повторных effect-триггеров). */
  private lastLoadedCourseId: string | null = null;

  constructor() {
    // Загружаем активный курс дашборда — он используется как fallback,
    // когда курс не передан явно через query-параметр `?courseId=`.
    this.dashboardService.reload();

    const queryParams = toSignal<string | undefined>(
      this.route.queryParams.pipe(map((params) => params['courseId'] as string | undefined)),
    );

    effect(() => {
      const requestedId = queryParams();
      const dashboardCourse = this.dashboardService.course();

      // Явный выбор курса через `?courseId=` имеет приоритет над активным курсом дашборда.
      if (requestedId) {
        this.courseId.set(requestedId);
        if (requestedId !== this.lastLoadedCourseId) {
          void this.loadCourse(requestedId);
        }
        return;
      }

      // Без query-параметра показываем активный курс дашборда;
      // по умолчанию предпочитаем C++ Complete Course.
      const targetId =
        dashboardCourse?.id === CPP_COMPLETE_COURSE_ID
          ? dashboardCourse.id
          : CPP_COMPLETE_COURSE_ID;
      this.courseId.set(targetId);
      if (targetId !== this.lastLoadedCourseId) {
        void this.loadCourse(targetId);
      }
    });
  }

  /**
   * Загружает курс по ID (query-параметр `?courseId=`) и строит узлы карты для него.
   *
   * @param courseId - ID курса для отображения на карте.
   */
  private async loadCourse(courseId: string): Promise<void> {
    // Курс уже был успешно загружен — не перезапускаем.
    if (this.lastLoadedCourseId === courseId) {
      return;
    }
    // Запрос уже выполняется — не дублируем.
    if (this.loadingCourseId === courseId) {
      return;
    }

    this.loadingCourseId = courseId;
    this.loading.set(true);
    this.error.set(null);

    try {
      const course = await this.courseSearchService.getById(courseId);
      this.logger.info(
        `[JourneyPage] Course loaded: id=${course.id}, programs=${course.programs?.length ?? 0}`,
      );
      if (course.programs) {
        for (const p of course.programs) {
          this.logger.info(
            `  Program: ${p.id} (${p.title}), lessons=${p.lessons?.length ?? 0}`,
          );
          if (p.lessons) {
            for (const l of p.lessons) {
              this.logger.info(`    Lesson: ${l.id}, scenarioIds=${l.scenarioIds?.length ?? 0}`);
            }
          }
        }
      }
      // Compare as strings to handle numeric IDs from backend
      const courseMatches = String(course.id) === String(courseId);
      if (this.courseId() === courseId && courseMatches) {
        await this.loadNodes(course);
        this.lastLoadedCourseId = courseId;
      } else {
        this.logger.info(
          `[JourneyPage] SKIP buildNodes: courseId()=${this.courseId()}, param=${courseId}, course.id=${course.id}, matches=${courseMatches}`,
        );
      }
    } catch (error) {
      this.logger.error('[JourneyPage] Failed to load course from query param', error);
      this.error.set('Не удалось загрузить программу обучения');
    } finally {
      this.loadingCourseId = null;
      this.loading.set(false);
    }
  }

  private async loadNodes(course: CourseWithPrograms): Promise<void> {
    // Активируем языковую пару курса, чтобы открытие сценариев с карты
    // (переход на /cards/select) не блокировалось несовпадением пары.
    if (course.languagePair) {
      this.userStore.addLanguagePair(course.languagePair);
    }

    const hasScenarioResult = (scenarioId: string) =>
      this.resultsStore.resultsForScenario(scenarioId).length > 0;

    const hasScenarioVisit = (scenarioId: string) =>
      this.analyticsService.visitCountForScenario()(scenarioId) > 0;

    // Извлекаем все scenarioIds из курса (приводим к строке — бэкенд может возвращать числа)
    const courseScenarioIds = new Set(
      course.programs.flatMap((p) => (p.lessons ?? []).flatMap((l) => l.scenarioIds.map(String))),
    );

    this.logger.debug(`[JourneyPage] Loading scenarios for course ${course.id}: ${courseScenarioIds.size} scenarios`);

    // Загружаем сценарии через API по courseId
    const courseScenarios: import('../../../entities/scenario/model').Scenario[] = [];
    for (const scenarioId of courseScenarioIds) {
      try {
        const scenario = await this.scenariosApi.getById(scenarioId);
        courseScenarios.push(scenario);
      } catch (error) {
        this.logger.warn(`[JourneyPage] Failed to load scenario ${scenarioId}`, error);
      }
    }

    this.logger.debug(`[JourneyPage] Loaded ${courseScenarios.length} scenarios from API`);

    const scenarioMap = buildScenarioMap(courseScenarios);

    // Извлекаем все cardIds из сценариев
    const allCardIds = new Set<string>();
    for (const scenario of courseScenarios) {
      const cardIds = scenarioCardIds(scenario);
      for (const cardId of cardIds) {
        allCardIds.add(cardId);
      }
    }

    this.logger.debug(`[JourneyPage] Extracted ${allCardIds.size} unique card IDs from scenarios`);

    // Загружаем карточки батчем через API
    let allCards: readonly CardBase[] = [];
    if (allCardIds.size > 0) {
      try {
        const cards = await this.cardsApi.getByIds([...allCardIds]);
        allCards = cards as unknown as CardBase[];
        this.logger.debug(`[JourneyPage] Loaded ${cards.length} cards from API`);
      } catch (error) {
        this.logger.error('[JourneyPage] Failed to load cards', error);
      }
    }

    const nodes = buildJourneyNodes(
      course,
      scenarioMap,
      allCards,
      hasScenarioResult,
      hasScenarioVisit,
    );

    this.logger.debug(
      `[JourneyPage] Nodes built: ${nodes.length}, First node contentTypes: ${nodes[0]?.contentTypes}`,
    );

    this.nodes.set(nodes);
  }

  /**
   * Handles location node selection from the journey map.
   *
   * @remarks
   * Currently a placeholder — navigates to the selected scenario or opens detail view.
   */
  onLocationSelect(nodeId: string): void {
    const node = this.nodes().find((item) => item.id === nodeId);
    if (!node) {
      return;
    }
    // Переход к сценарию на страницу карточек с полным контекстом
    // (курс, урок, сценарий) — сценарий открывается напрямую.
    void this.router.navigate(['/cards/select'], {
      queryParams: {
        courseId: node.courseId,
        lessonId: node.lessonId,
        scenarioId: node.scenarioId,
      },
    });
  }
}
