import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import type { CourseIndexEntry } from '../../../../core/models';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { CourseCatalogProgramsComponent } from './program-list.component';
import { CourseCatalogStore } from '../../services/course-catalog.store';

// Lazy-load Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

function makeCourse(
  id: string,
  title: string,
  lessonCount: number,
  languagePairSummary: string,
): CourseIndexEntry {
  return {
    id,
    title,
    authorId: 'author-1',
    lessonCount,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary,
  };
}

const mockActivatedRoute = {
  snapshot: { queryParams: {} },
  queryParams: of({}),
  params: of({}),
  data: of({}),
};

const mockRouter = {
  navigate: vi.fn().mockResolvedValue(true),
};

describe('CourseCatalogProgramsComponent', () => {
  let fixture: ComponentFixture<CourseCatalogProgramsComponent>;
  let component: CourseCatalogProgramsComponent;
  let mockStoreState: {
    loading: boolean;
    error: string | null;
    items: readonly CourseIndexEntry[];
    totalItems: number;
    pageIndex: number;
    pageSize: number;
    progressByCourseId: Record<string, number>;
    completedCourseIds: ReadonlySet<string>;
  };

  const defaultItems: readonly CourseIndexEntry[] = [
    makeCourse('c-1', 'Course 1', 10, 'Русский → English'),
    makeCourse('c-2', 'Course 2', 20, 'Русский → English'),
  ];

  beforeEach(async () => {
    const stateRef = {
      loading: false,
      error: null as string | null,
      items: [] as readonly CourseIndexEntry[],
      totalItems: 0,
      pageIndex: 0,
      pageSize: 10,
      progressByCourseId: {} as Record<string, number>,
      completedCourseIds: new Set<string>() as ReadonlySet<string>,
    };

    const loadingSignal = signal(stateRef.loading);
    const errorSignal = signal(stateRef.error);
    const itemsSignal = signal(stateRef.items);
    const totalItemsSignal = signal(stateRef.totalItems);
    const pageIndexSignal = signal(stateRef.pageIndex);
    const pageSizeSignal = signal(stateRef.pageSize);
    const progressByCourseIdSignal = signal(stateRef.progressByCourseId);
    const completedCourseIdsSignal = signal(stateRef.completedCourseIds);

    mockStoreState = new Proxy(stateRef, {
      set(target, prop, value) {
        (target as Record<string, unknown>)[prop as string] = value;
        switch (prop) {
          case 'loading': loadingSignal.set(value as boolean); break;
          case 'error': errorSignal.set(value as string | null); break;
          case 'items': itemsSignal.set(value as readonly CourseIndexEntry[]); break;
          case 'totalItems': totalItemsSignal.set(value as number); break;
          case 'pageIndex': pageIndexSignal.set(value as number); break;
          case 'pageSize': pageSizeSignal.set(value as number); break;
          case 'progressByCourseId': progressByCourseIdSignal.set(value as Record<string, number>); break;
          case 'completedCourseIds': completedCourseIdsSignal.set(value as ReadonlySet<string>); break;
        }
        return true;
      },
    });

    const storeMock: Partial<CourseCatalogStore> = {
      loading: loadingSignal,
      error: errorSignal,
      items: itemsSignal,
      totalItems: totalItemsSignal,
      pageIndex: pageIndexSignal,
      pageSize: pageSizeSignal,
      progressByCourseId: progressByCourseIdSignal,
      completedCourseIds: completedCourseIdsSignal,
      setLoading: vi.fn((value: boolean) => { mockStoreState.loading = value; }),
      setError: vi.fn((value: string | null) => { mockStoreState.error = value; }),
      setItems: vi.fn((value: readonly CourseIndexEntry[]) => { mockStoreState.items = value; }),
      setTotalItems: vi.fn((value: number) => { mockStoreState.totalItems = value; }),
      setPageIndex: vi.fn((value: number) => { mockStoreState.pageIndex = value; }),
      setPageSize: vi.fn((value: number) => { mockStoreState.pageSize = value; }),
      setProgressByCourseId: vi.fn((value: Record<string, number>) => { mockStoreState.progressByCourseId = value; }),
      setCompletedCourseIds: vi.fn((value: Set<string>) => { mockStoreState.completedCourseIds = value; }),
    };

    await TestBed.configureTestingModule({
      imports: [
        CourseCatalogProgramsComponent,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        UiPaginationComponent,
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: CourseCatalogStore, useValue: storeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCatalogProgramsComponent);
    component = fixture.componentInstance;
    mockStoreState.items = defaultItems;
    mockStoreState.totalItems = 20;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('should show spinner when loading and no items', () => {
      mockStoreState.loading = true;
      mockStoreState.items = [];
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should not show spinner when loading and items exist', () => {
      mockStoreState.loading = false;
      mockStoreState.items = defaultItems;
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeFalsy();
    });
  });

  describe('error state', () => {
    it('should show error message when error and no items', () => {
      mockStoreState.loading = false;
      mockStoreState.error = 'Ошибка загрузки';
      mockStoreState.items = [];
      fixture.detectChanges();

      const errorCard = fixture.nativeElement.querySelector('.course-catalog-page__message');
      expect(errorCard).toBeTruthy();
      expect(errorCard.textContent).toContain('Ошибка загрузки');
    });

    it('should show retry button in error state', () => {
      mockStoreState.error = 'Ошибка';
      mockStoreState.items = [];
      fixture.detectChanges();

      const retryButton = fixture.nativeElement.querySelector('button[mat-flat-button]');
      expect(retryButton).toBeTruthy();
      expect(retryButton.textContent).toContain('Повторить');
    });

    it('should emit load when retry button clicked', () => {
      mockStoreState.error = 'Ошибка';
      mockStoreState.items = [];
      fixture.detectChanges();

      const retryButton = fixture.nativeElement.querySelector('button[mat-flat-button]');
      let emitted = false;
      component.loadRequested.subscribe(() => { emitted = true; });
      retryButton.click();

      expect(emitted).toBe(true);
    });

    it('should not show error when items exist', () => {
      mockStoreState.error = 'Ошибка';
      mockStoreState.items = defaultItems;
      fixture.detectChanges();

      const errorCard = fixture.nativeElement.querySelector('.course-catalog-page__message');
      expect(errorCard).toBeFalsy();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no items and no error', () => {
      mockStoreState.loading = false;
      mockStoreState.error = null;
      mockStoreState.items = [];
      fixture.detectChanges();

      const emptyCard = fixture.nativeElement.querySelector('.course-catalog-page__message');
      expect(emptyCard).toBeTruthy();
      expect(emptyCard.textContent).toContain('Опубликованных программ');
    });

    it('should have links in empty message', () => {
      mockStoreState.items = [];
      fixture.detectChanges();

      const links = fixture.nativeElement.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('items list', () => {
    it('should render course items', () => {
      mockStoreState.items = defaultItems;
      fixture.detectChanges();

      const itemCards = fixture.nativeElement.querySelectorAll('.course-catalog-page__item');
      expect(itemCards.length).toBe(2);
    });

    it('should render course titles', () => {
      const titles = fixture.nativeElement.querySelectorAll('.course-catalog-page__title');
      expect(titles[0]?.textContent?.trim()).toBe('Course 1');
      expect(titles[1]?.textContent?.trim()).toBe('Course 2');
    });

    it('should render course meta with lesson count', () => {
      const metas = fixture.nativeElement.querySelectorAll('.course-catalog-page__meta');
      expect(metas[0]?.textContent?.trim()).toContain('10 уроков');
      expect(metas[1]?.textContent?.trim()).toContain('20 уроков');
    });

    it('should show completed badge for completed courses', () => {
      mockStoreState.completedCourseIds = new Set(['c-1']);
      fixture.detectChanges();

      const badges = fixture.nativeElement.querySelectorAll('.course-catalog-page__badge');
      expect(badges.length).toBe(1);
      expect(badges[0]?.textContent?.trim()).toContain('Завершён');
    });

    it('should show progress percentage for non-completed courses', () => {
      mockStoreState.completedCourseIds = new Set();
      mockStoreState.progressByCourseId = { 'c-1': 50, 'c-2': 30 };
      fixture.detectChanges();

      const metas = fixture.nativeElement.querySelectorAll('.course-catalog-page__meta');
      expect(metas[0]?.textContent?.trim()).toContain('50%');
    });

    it('should not show progress for completed courses', () => {
      mockStoreState.completedCourseIds = new Set(['c-1']);
      mockStoreState.progressByCourseId = { 'c-1': 75 };
      fixture.detectChanges();

      const metas = fixture.nativeElement.querySelectorAll('.course-catalog-page__meta');
      expect(metas[0]?.textContent?.trim()).not.toContain('%');
    });

    it('should show start button for each course', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      let count = 0;
      buttons.forEach((btn: HTMLElement) => {
        if (btn.textContent?.trim() === 'Начать') {
          count++;
        }
      });
      expect(count).toBe(2);
    });

    it('should emit startCourse when start button clicked', () => {
      mockStoreState.completedCourseIds = new Set();
      mockStoreState.progressByCourseId = {};
      fixture.detectChanges();

      let emitted: string | undefined;
      component.startCourse.subscribe((id) => { emitted = id; });

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const startButtons: HTMLElement[] = [];
      buttons.forEach((btn: HTMLElement) => {
        if (btn.textContent?.trim() === 'Начать') {
          startButtons.push(btn);
        }
      });
      startButtons[0].dispatchEvent(new Event('click'));
      expect(emitted).toBe('c-1');

      startButtons[1].dispatchEvent(new Event('click'));
      expect(emitted).toBe('c-2');
    });

    it('should render pagination component', () => {
      const pagination = fixture.nativeElement.querySelector('app-pagination');
      expect(pagination).toBeTruthy();
    });
  });

  describe('isCourseCompleted', () => {
    it('should return true for completed course', () => {
      mockStoreState.completedCourseIds = new Set(['c-1']);
      fixture.detectChanges();
      expect(component.isCourseCompleted('c-1')).toBe(true);
    });

    it('should return false for non-completed course', () => {
      mockStoreState.completedCourseIds = new Set(['c-1']);
      fixture.detectChanges();
      expect(component.isCourseCompleted('c-2')).toBe(false);
    });

    it('should return false for unknown course', () => {
      mockStoreState.completedCourseIds = new Set(['c-1']);
      fixture.detectChanges();
      expect(component.isCourseCompleted('unknown')).toBe(false);
    });
  });

  describe('progressPercent', () => {
    it('should return stored progress for known course', () => {
      mockStoreState.progressByCourseId = { 'c-1': 75, 'c-2': 30 };
      fixture.detectChanges();
      expect(component.progressPercent('c-1')).toBe(75);
      expect(component.progressPercent('c-2')).toBe(30);
    });

    it('should return 0 for unknown course', () => {
      mockStoreState.progressByCourseId = { 'c-1': 75 };
      fixture.detectChanges();
      expect(component.progressPercent('unknown')).toBe(0);
    });
  });
});
