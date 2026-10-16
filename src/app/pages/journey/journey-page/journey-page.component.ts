import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { LearningJourneyMapComponent } from '../../../features/journey/components/learning-journey-map/learning-journey-map.component';
import { JourneyAnalyticsService } from '../../../features/journey/services/journey-analytics.service';
import { LearningDashboardService } from '../../../entities/learning/services';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { ContentSeedRepository } from '../../../entities/content-seed/content-seed.repository';
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
  private readonly analyticsService = inject(JourneyAnalyticsService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly contentSeedRepo = inject(ContentSeedRepository);
  private readonly logger = inject(AppLoggerService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly nodes = signal<JourneyLocationNode[]>([]);
  readonly courseId = signal('');

  constructor() {
    this.dashboardService.reload();

    effect(() => {
      const course = this.dashboardService.course();
      if (course) {
        this.buildNodes(course);
      }
    });

    const queryParams = toSignal(
      this.route.queryParams.pipe(
        map((params) => {
          const fromQuery = params['courseId'] as string | undefined;
          const dashboardCourse = this.dashboardService.course();
          const fromDashboard = dashboardCourse?.id;
          return fromQuery ?? fromDashboard ?? '';
        }),
      ),
    );

    effect(() => {
      const id = queryParams();
      if (id) {
        this.courseId.set(id);
      }
    });
  }

  private buildNodes(course: CourseWithLessons): void {
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
