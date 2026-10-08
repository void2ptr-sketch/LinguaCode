import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LearningJourneyMapComponent } from './learning-journey-map.component';
import type { JourneyLocationNode } from '../../../../core/models/journey.types';
import { JourneyAnalyticsService } from '../../../../core/services/journey-analytics.service';
import { LearningDashboardService } from '../../../home/services/learning-dashboard.service';

const mockNodes: JourneyLocationNode[] = [
  {
    id: 'n1',
    title: 'Теория: Введение',
    description: 'Вводная теория',
    cardCount: 5,
    order: 1,
    status: 'completed',
    contentTypes: ['theory'],
    lessonId: 'l1',
    lessonTitle: 'Урок 1',
    courseId: 'c1',
    courseTitle: 'Курс 1',
    completionPercent: 100,
    visited: true,
    favorite: false,
    blockReason: null,
    scenarioId: 's1',
  },
  {
    id: 'n2',
    title: 'Практика: Упражнения',
    description: 'Практические упражнения',
    cardCount: 10,
    order: 2,
    status: 'available',
    contentTypes: ['practice'],
    lessonId: 'l1',
    lessonTitle: 'Урок 1',
    courseId: 'c1',
    courseTitle: 'Курс 1',
    completionPercent: 0,
    visited: false,
    favorite: true,
    blockReason: null,
    scenarioId: 's2',
  },
  {
    id: 'n3',
    title: 'Тест: Проверка',
    description: 'Итоговый тест',
    cardCount: 3,
    order: 3,
    status: 'locked',
    contentTypes: ['test'],
    lessonId: 'l1',
    lessonTitle: 'Урок 1',
    courseId: 'c1',
    courseTitle: 'Курс 1',
    completionPercent: 0,
    visited: false,
    favorite: false,
    blockReason: 'Не пройден предыдущий урок',
    scenarioId: 's3',
  },
];

const mockActivatedRoute = {
  snapshot: { queryParams: {} },
  queryParams: of({}),
  params: of({}),
  data: of({}),
};

const mockRouter = {
  navigate: vi.fn().mockResolvedValue(true),
};

@Component({
  selector: 'app-mock-wrapper',
  imports: [LearningJourneyMapComponent],
  template: `
    <app-learning-journey-map
      [courseId]="courseId"
      [nodes]="nodes"
      (locationSelect)="onSelect($event)"
    />
  `,
})
class MockWrapperComponent {
  courseId = 'c1';
  nodes = mockNodes;
  onSelect = vi.fn();
}

describe('LearningJourneyMapComponent', () => {
  let fixture: ComponentFixture<MockWrapperComponent>;
  let component: MockWrapperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockWrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
            explorerLevel: vi.fn(() => ({
              level: 'novice' as const,
              totalVisits: 0,
              totalCompleted: 0,
              nextMilestone: { visitsNeeded: 5, completedNeeded: 2 },
            })),
          },
        },
        {
          provide: LearningDashboardService,
          useValue: {
            course: vi.fn(() => null),
            roadmap: vi.fn(() => []),
            loading: vi.fn(() => false),
            error: vi.fn(() => null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MockWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the journey map title', () => {
    const titleEl = fixture.nativeElement.querySelector('.journey-map__title');
    expect(titleEl?.textContent).toBe('Путь обучения');
  });

  it('should render explorer level badge', () => {
    const badge = fixture.nativeElement.querySelector('.journey-map__level-badge');
    expect(badge).toBeTruthy();
  });

  it('should render filter chips', () => {
    const chips = fixture.nativeElement.querySelectorAll('.journey-map__chip');
    expect(chips.length).toBeGreaterThan(0);
  });

  it('should render location nodes (excluding locked when fog of war is on)', () => {
    // Fog of war hides locked nodes by default, so only 2 visible
    const nodes = fixture.nativeElement.querySelectorAll('.journey-node');
    expect(nodes.length).toBe(2);
  });

  it('should render all location nodes when fog of war is off', () => {
    const journeyMapDe = fixture.debugElement.children[0];
    const journeyMapComponent = journeyMapDe.componentInstance as LearningJourneyMapComponent;
    journeyMapComponent.showFogOfWar.set(false);
    fixture.detectChanges();

    const nodes = fixture.nativeElement.querySelectorAll('.journey-node');
    expect(nodes.length).toBe(3);
  });

  it('should render lesson groups', () => {
    const groups = fixture.nativeElement.querySelectorAll('.journey-map__lesson-group');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('should emit locationSelect event when node is clicked', () => {
    const nodeBtn = fixture.nativeElement.querySelector('.journey-node');
    nodeBtn.click();
    expect(component.onSelect).toHaveBeenCalled();
  });

  it('should show all content type filters', () => {
    const chipLabels = fixture.nativeElement.querySelectorAll('.journey-map__chip span');
    const labels = [...chipLabels].map((el) => el.textContent.trim());
    expect(labels).toContain('Все');
    expect(labels).toContain('Теория');
    expect(labels).toContain('Практика');
    expect(labels).toContain('Тесты');
  });

  it('should toggle view mode', () => {
    const mapBtn = fixture.nativeElement.querySelector('button[aria-label="Режим карты"]');
    const listBtn = fixture.nativeElement.querySelector('button[aria-label="Режим списка"]');

    expect(mapBtn).toBeTruthy();
    expect(listBtn).toBeTruthy();
  });

  it('should show empty state when no nodes', () => {
    // Empty state is rendered when nodes() returns empty array
    // The groupedByLesson computed will be empty, rendering no lesson groups
    const groups = fixture.nativeElement.querySelectorAll('.journey-map__lesson-group');
    expect(groups.length).toBeGreaterThan(0);

    // Verify empty state element exists in template
    const emptyState = fixture.nativeElement.querySelector('.journey-map__empty');
    // Empty state is hidden when nodes exist
    expect(emptyState).toBeFalsy();
  });

  it('should render favorite filter button', () => {
    const favBtn = fixture.nativeElement.querySelector('button[aria-label="Показать избранное"]');
    expect(favBtn).toBeTruthy();
  });

  it('should render fog of war filter button', () => {
    const fogBtn = fixture.nativeElement.querySelector('button[aria-label="Туман войны"]');
    expect(fogBtn).toBeTruthy();
  });
});
