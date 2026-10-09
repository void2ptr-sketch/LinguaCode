import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { LearningJourneyMapComponent } from '../learning-journey-map/learning-journey-map.component';
import { JourneyAnalyticsService } from '../../../../core/services/journey-analytics.service';
import { LearningDashboardService } from '../../../home/services/learning-dashboard.service';
import { LearningResultsStore } from '../../../../core/state';
import { ContentSeedRepository } from '../../../../core/data/content-seed/content-seed.repository';
import { buildJourneyNodes, buildScenarioMap } from '../../../../core/data/journey/journey-nodes.utils';
import type { JourneyLocationNode } from '../../../../core/models/journey.types';
import type { CardBase } from '../../../../core/models';
import type { CourseWithLessons } from '../../../../core/models';

/**
 * Journey page component. Renders the learning journey map for the current course,
 * built from scenario and card seed data.
 * @remarks Loads journey nodes from `ContentSeedRepository` and tracks analytics events.
 */
@Component({
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
  styles: [
    `
      :host {
        display: block;
        padding: 16px;
      }

      .journey-page__loading,
      .journey-page__error,
      .journey-page__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        font-size: 16px;
        color: var(--mat-sys-on-surface-variant);
      }

      .journey-page__error {
        color: var(--mat-sys-error);
      }
    `,
  ],
})
export class JourneyPageComponent implements OnInit {
  private readonly dashboardService = inject(LearningDashboardService);
  private readonly analyticsService = inject(JourneyAnalyticsService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly contentSeedRepo = inject(ContentSeedRepository);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly nodes = signal<JourneyLocationNode[]>([]);
  readonly courseId = signal('');

  constructor() {
    effect(() => {
      const course = this.dashboardService.course();
      if (course) {
        this.buildNodes(course);
      }
    });
  }

  ngOnInit(): void {
    this.dashboardService.reload();

    this.route.queryParams
      .pipe(
        map((params) => {
          const fromQuery = params['courseId'] as string | undefined;
          const dashboardCourse = this.dashboardService.course();
          const fromDashboard = dashboardCourse?.id;
          return fromQuery ?? fromDashboard ?? '';
        }),
      )
      .subscribe((id) => {
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

    console.log('[JourneyPage] Cards loaded:', allCards.length);
    console.log('[JourneyPage] Scenarios loaded:', allScenarios.length);

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

    console.log('[JourneyPage] Nodes built:', nodes.length, 'First node contentTypes:', nodes[0]?.contentTypes);

    this.nodes.set(nodes);
  }

  onLocationSelect(): void {
    // TODO: перейти к сценарию или открыть детальную информацию
  }
}
