import {
  Component,
  input,
  output,
  computed,
  effect,
  signal,
  inject,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type {
  JourneyLocationNode,
  JourneyContentType,
  ExplorerLevelResult,
} from '../../../../core/models/journey.types';
import { JourneyAnalyticsService } from '../../../../core/services/journey-analytics.service';
import { LearningDashboardService } from '../../../home/services/learning-dashboard.service';
import { JourneyLocationNodeComponent } from '../journey-location-node/journey-location-node.component';

/** Фильтр по типу контента. */
export type JourneyFilterType = 'all' | JourneyContentType;

/** Режим отображения карты. */
export type JourneyViewMode = 'map' | 'list';

/**
 * Learning journey map component. Renders an interactive map of learning nodes organized by lesson,
 * with filtering by content type, favorites, and fog-of-war mode.
 * @remarks Tracks visit durations and favorite toggles via `JourneyAnalyticsService`.
 */
@Component({
  selector: 'app-learning-journey-map',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    JourneyLocationNodeComponent,
  ],
  templateUrl: './learning-journey-map.component.html',
  styleUrl: './learning-journey-map.component.scss',
})
export class LearningJourneyMapComponent implements OnInit, OnDestroy {
  /** Required course ID for analytics tracking. */
  readonly courseId = input.required<string>();
  /** Required list of journey location nodes. */
  readonly nodes = input.required<readonly JourneyLocationNode[]>();

  /** Emits the selected node ID when the user clicks a node. */
  readonly locationSelect = output<string>();

  protected readonly analyticsService = inject(JourneyAnalyticsService);
  protected readonly dashboardService = inject(LearningDashboardService);

  /** Currently active content type filter. */
  protected readonly filterType = signal<JourneyFilterType>('all');
  /** Current view mode ('map' or 'list'). */
  protected readonly viewMode = signal<JourneyViewMode>('map');
  /** Currently selected node ID (for duration tracking). */
  protected readonly selectedNodeId = signal<string | null>(null);
  /** Whether to show only favorite nodes. */
  public readonly showFavoritesOnly = signal<boolean>(false);
  /** Whether to hide locked nodes (fog-of-war mode). */
  public readonly showFogOfWar = signal<boolean>(true);

  /** Computed explorer level from analytics service. */
  protected readonly explorerLevel = computed<ExplorerLevelResult | null>(() => {
    return this.analyticsService.explorerLevel();
  });

  /** Computed course title from the first node. */
  protected readonly courseTitle = computed(() => {
    const nodes = this.nodes();
    if (nodes.length === 0) return '';
    return nodes[0].courseTitle;
  });

  /** Computed nodes filtered by type, favorites, and fog-of-war mode. */
  protected readonly filteredNodes = computed(() => {
    const nodes = this.nodes();
    const filterType = this.filterType();
    const showFavoritesOnly = this.showFavoritesOnly();
    const showFogOfWar = this.showFogOfWar();

    let result = nodes;

    if (filterType !== 'all') {
      result = result.filter((n) => n.contentTypes.includes(filterType));
    }

    if (showFavoritesOnly) {
      result = result.filter((n) => n.favorite);
    }

    if (showFogOfWar) {
      result = result.filter((n) => n.status !== 'locked');
    }

    return result;
  });

  protected readonly groupedByLesson = computed(() => {
    const nodes = this.filteredNodes();
    const grouped = new Map<string, JourneyLocationNode[]>();

    for (const node of nodes) {
      const current = grouped.get(node.lessonId) ?? [];
      current.push(node);
      grouped.set(node.lessonId, current);
    }

    return [...grouped.entries()].sort((left, right) => {
      const leftFirst = left[1][0].order;
      const rightFirst = right[1][0].order;
      return leftFirst - rightFirst;
    });
  });

  protected readonly contentTypes = computed<
    { type: JourneyFilterType; label: string; icon: string; tooltip: string }[]
  >(() => [
    { type: 'all', label: 'Все', icon: 'apps', tooltip: 'Показать все типы контента' },
    { type: 'theory', label: 'Теория', icon: 'menu_book', tooltip: 'Фильтр: теоретические материалы' },
    { type: 'practice', label: 'Практика', icon: 'edit_note', tooltip: 'Фильтр: практические задания' },
    { type: 'test', label: 'Тесты', icon: 'assignment', tooltip: 'Фильтр: проверочные тесты' },
    { type: 'video', label: 'Видео', icon: 'play_circle', tooltip: 'Фильтр: видеоматериалы' },
    { type: 'case', label: 'Кейсы', icon: 'psychology', tooltip: 'Фильтр: практические кейсы' },
  ]);

  private readonly visitStartTimes = new Map<string, number>();

  constructor() {
    effect(() => {
      const selectedId = this.selectedNodeId();
      if (selectedId) {
        const startTime = this.visitStartTimes.get(selectedId);
        if (startTime) {
          const duration = Date.now() - startTime;
          const node = this.nodes().find((n) => n.id === selectedId);
          if (node) {
            this.analyticsService.trackEvent({
              kind: 'duration',
              scenarioId: node.scenarioId,
              lessonId: node.lessonId,
              courseId: node.courseId,
              durationMs: duration,
              timestamp: new Date().toISOString(),
            });
          }
          this.visitStartTimes.delete(selectedId);
        }
      }
    });
  }

  ngOnInit(): void {
    this.analyticsService.trackEvent({
      kind: 'visit',
      scenarioId: this.nodes()[0]?.scenarioId ?? '',
      lessonId: this.nodes()[0]?.lessonId ?? '',
      courseId: this.courseId(),
      timestamp: new Date().toISOString(),
    });
  }

  ngOnDestroy(): void {
    this.visitStartTimes.clear();
  }

  protected onLocationSelect(nodeId: string): void {
    this.selectedNodeId.set(nodeId);
    this.visitStartTimes.set(nodeId, Date.now());
    this.locationSelect.emit(nodeId);
  }

  protected onToggleFavorite(nodeId: string): void {
    const node = this.nodes().find((n) => n.id === nodeId);
    if (node) {
      this.analyticsService.toggleFavorite(nodeId, !node.favorite);
    }
  }

  protected onFilterTypeChange(type: JourneyFilterType): void {
    this.filterType.set(type);
  }

  protected onViewModeChange(mode: JourneyViewMode): void {
    this.viewMode.set(mode);
  }

  /**
   * Toggles the favorites filter to show only favorite nodes.
   *
   * @remarks
   * When enabled, `filteredNodes` excludes non-favorite nodes.
   */
  public onToggleFavoritesFilter(): void {
    this.showFavoritesOnly.update((v) => !v);
  }

  protected toggleFogOfWar(): void {
    this.showFogOfWar.update((v) => !v);
  }
}
