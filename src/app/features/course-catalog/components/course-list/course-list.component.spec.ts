import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { CourseIndexEntry } from '../../../../entities/course/model';
import { CourseCatalogCourseListComponent } from './course-list.component';
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
  programCount: number,
  languagePairSummary: string,
): CourseIndexEntry {
  return {
    id,
    title,
    authorId: 'author-1',
    programCount,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary,
    knownLanguage: 'ru',
    learningLanguage: 'en',
  };
}

describe('CourseCatalogCourseListComponent', () => {
  let fixture: ComponentFixture<CourseCatalogCourseListComponent>;
  let component: CourseCatalogCourseListComponent;
  let mockStoreState: {
    loading: boolean;
    error: string | null;
    items: readonly CourseIndexEntry[];
    progressByCourseId: Record<string, number>;
    completedCourseIds: ReadonlySet<string>;
    totalItems: number;
    pageIndex: number;
    pageSize: number;
    selectedCourseId: string;
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
      progressByCourseId: {} as Record<string, number>,
      completedCourseIds: new Set<string>() as ReadonlySet<string>,
      totalItems: 0,
      pageIndex: 0,
      pageSize: 10,
      selectedCourseId: '',
    };

    const loadingSignal = signal(stateRef.loading);
    const errorSignal = signal(stateRef.error);
    const itemsSignal = signal(stateRef.items);
    const progressByCourseIdSignal = signal(stateRef.progressByCourseId);
    const completedCourseIdsSignal = signal(stateRef.completedCourseIds);
    const totalItemsSignal = signal(stateRef.totalItems);
    const pageIndexSignal = signal(stateRef.pageIndex);
    const pageSizeSignal = signal(stateRef.pageSize);
    const selectedCourseIdSignal = signal(stateRef.selectedCourseId);

    mockStoreState = new Proxy(stateRef, {
      set(target, prop, value) {
        (target as Record<string, unknown>)[prop as string] = value;
        switch (prop) {
          case 'loading':
            loadingSignal.set(value as boolean);
            break;
          case 'error':
            errorSignal.set(value as string | null);
            break;
          case 'items':
            itemsSignal.set(value as readonly CourseIndexEntry[]);
            break;
          case 'progressByCourseId':
            progressByCourseIdSignal.set(value as Record<string, number>);
            break;
          case 'completedCourseIds':
            completedCourseIdsSignal.set(value as ReadonlySet<string>);
            break;
          case 'totalItems':
            totalItemsSignal.set(value as number);
            break;
          case 'pageIndex':
            pageIndexSignal.set(value as number);
            break;
          case 'pageSize':
            pageSizeSignal.set(value as number);
            break;
          case 'selectedCourseId':
            selectedCourseIdSignal.set(value as string);
            break;
        }
        return true;
      },
    });

    const storeMock: Partial<CourseCatalogStore> = {
      loading: loadingSignal,
      error: errorSignal,
      items: itemsSignal,
      progressByCourseId: progressByCourseIdSignal,
      completedCourseIds: completedCourseIdsSignal,
      totalItems: totalItemsSignal,
      pageIndex: pageIndexSignal,
      pageSize: pageSizeSignal,
      activeCourseIds: signal(new Set() as ReadonlySet<string>),
    };

    await TestBed.configureTestingModule({
      imports: [
        CourseCatalogCourseListComponent,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
      ],
      providers: [{ provide: CourseCatalogStore, useValue: storeMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCatalogCourseListComponent);
    component = fixture.componentInstance;
    mockStoreState.items = defaultItems;
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
      expect(emptyCard.textContent).toContain('Опубликованных курсов');
    });
  });

  describe('items list', () => {
    it('should render course items', () => {
      mockStoreState.items = defaultItems;
      fixture.detectChanges();

      const itemCards = fixture.nativeElement.querySelectorAll('.course-catalog-page__row');
      expect(itemCards.length).toBe(2);
    });

    it('should render course titles', () => {
      const titles = fixture.nativeElement.querySelectorAll('.course-catalog-page__title');
      expect(titles[0]?.textContent?.trim()).toBe('Course 1');
      expect(titles[1]?.textContent?.trim()).toBe('Course 2');
    });

    it('should render language pair summary', () => {
      const rows = fixture.nativeElement.querySelectorAll('.course-catalog-page__row');
      expect(rows[0].textContent).toContain('Русский');
      expect(rows[1].textContent).toContain('English');
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

      const rows = fixture.nativeElement.querySelectorAll('.course-catalog-page__row');
      expect(rows[0].textContent).toContain('50%');
    });

    it('should not show progress for completed courses', () => {
      mockStoreState.completedCourseIds = new Set(['c-1']);
      mockStoreState.progressByCourseId = { 'c-1': 75 };
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.course-catalog-page__row');
      expect(rows[0].textContent).not.toContain('%');
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
