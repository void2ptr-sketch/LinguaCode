import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { LearningJourneyMapComponent } from '../../../features/journey/components/learning-journey-map/learning-journey-map.component';
import { JourneyAnalyticsService } from '../../../features/journey/services/journey-analytics.service';
import { LearningDashboardService } from '../../../entities/learning/services';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { ContentSeedRepository } from '../../../entities/content-seed/content-seed.repository';
import { CourseSearchService } from '../../../entities/course';
import { UserStore } from '../../../entities/user/model/user.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import {
  buildJourneyNodes,
  buildScenarioMap,
} from '../../../entities/journey/lib/journey-nodes.utils';
import type { JourneyLocationNode } from '../../../entities/learning/model';
import type { CardBase } from '../../../entities/card/model';
import type { CourseWithLessons } from '../../../entities/course/model';

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
        (locationSelect)="onLocationSelect()"
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
  private readonly contentSeedRepo = inject(ContentSeedRepository);
  private readonly userStore = inject(UserStore);
  private readonly logger = inject(AppLoggerService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly nodes = signal<JourneyLocationNode[]>([]);
  readonly courseId = signal('');

  /** ID курса, который сейчас загружается (защита от параллельных запросов). */
  private loadingCourseId: string | null = null;

  constructor() {
    // Загружаем активный курс дашборда — он используется как fallback,
    // когда курс не передан явно через query-параметр `?courseId=`.
    this.dashboardService.reload();

    const queryParams = toSignal(
      this.route.queryParams.pipe(map((params) => params['courseId'] as string | undefined)),
    );

    effect(() => {
      const requestedId = queryParams();
      const dashboardCourse = this.dashboardService.course();

      // Явный выбор курса через `?courseId=` имеет приоритет над активным курсом дашборда.
      if (requestedId) {
        this.courseId.set(requestedId);
        if (requestedId !== dashboardCourse?.id) {
          void this.loadCourse(requestedId);
        } else if (dashboardCourse) {
          this.buildNodes(dashboardCourse);
        }
        return;
      }

      // Без query-параметра показываем активный курс дашборда.
      if (dashboardCourse) {
        this.courseId.set(dashboardCourse.id);
        this.buildNodes(dashboardCourse);
      }
    });
  }

  /**
   * Загружает курс по ID (query-параметр `?courseId=`) и строит узлы карты для него.
   *
   * @param courseId - ID курса для отображения на карте.
   */
  private async loadCourse(courseId: string): Promise<void> {
    // Узлы для этого курса уже построены — не перезагружаем.
    if (this.nodes().length > 0 && this.nodes()[0].courseId === courseId) {
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
      if (this.courseId() === courseId && course.id === courseId) {
        this.buildNodes(course);
      }
    } catch (error) {
      this.logger.error('[JourneyPage] Failed to load course from query param', error);
      this.error.set('Не удалось загрузить программу обучения');
    } finally {
      this.loadingCourseId = null;
      this.loading.set(false);
    }
  }

  private buildNodes(course: CourseWithLessons): void {
    // Активируем языковую пару курса, чтобы открытие сценариев с карты
    // (переход на /cards/select) не блокировалось несовпадением пары.
    if (course.languagePair) {
      this.userStore.addLanguagePair(course.languagePair);
    }

    const hasScenarioResult = (scenarioId: string) =>
      this.resultsStore.resultsForScenario(scenarioId).length > 0;

    const hasScenarioVisit = (scenarioId: string) =>
      this.analyticsService.visitCountForScenario()(scenarioId) > 0;

    // Загружаем все сценарии и карточки из seed-кэша
    const allScenarios = this.contentSeedRepo.getScenarioSeed();
    const allCards = this.contentSeedRepo.getCardSeed();

    this.logger.debug(`[JourneyPage] Cards loaded: ${allCards.length}`);
    this.logger.debug(`[JourneyPage] Scenarios loaded: ${allScenarios.length}`);

    const courseScenarioIds = new Set(course.lessons.flatMap((l) => [...l.scenarioIds]));
    const courseScenarios = allScenarios.filter((s) => courseScenarioIds.has(s.id));
    const scenarioMap = buildScenarioMap(courseScenarios);

    const nodes = buildJourneyNodes(
      course,
      scenarioMap,
      allCards as unknown as CardBase[],
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
  onLocationSelect(): void {
    // TODO: перейти к сценарию или открыть детальную информацию
  }
}
