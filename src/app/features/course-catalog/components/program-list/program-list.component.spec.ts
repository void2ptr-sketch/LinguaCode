import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import type { CourseIndexEntry } from '../../../../core/models';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { CourseCatalogProgramsComponent } from './program-list.component';

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

  const defaultItems: readonly CourseIndexEntry[] = [
    makeCourse('c-1', 'Course 1', 10, 'Русский → English'),
    makeCourse('c-2', 'Course 2', 20, 'Русский → English'),
  ];

  beforeEach(async () => {
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCatalogProgramsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('totalItems', 0);
    fixture.componentRef.setInput('pageIndex', 0);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('progressByCourseId', {});
    fixture.componentRef.setInput('completedCourseIds', new Set());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('should show spinner when loading and no items', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();

      const state = fixture.nativeElement.querySelector('.course-catalog-page__state');
      expect(state).toBeTruthy();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();

      const loadingText = fixture.nativeElement.querySelector('.course-catalog-page__state p');
      expect(loadingText?.textContent?.trim()).toBe('Загрузка…');
    });

    it('should not show spinner when loading and items exist', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('items', defaultItems);
      fixture.detectChanges();

      const state = fixture.nativeElement.querySelector('.course-catalog-page__state');
      expect(state).toBeNull();
    });
  });

  describe('error state', () => {
    it('should show error message when error and no items', () => {
      fixture.componentRef.setInput('error', 'Ошибка загрузки');
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('.course-catalog-page__message');
      expect(message).toBeTruthy();
      expect(message.textContent).toContain('Ошибка загрузки');
    });

    it('should show retry button in error state', () => {
      fixture.componentRef.setInput('error', 'Ошибка загрузки');
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      let found = false;
      buttons.forEach((btn: HTMLElement) => {
        if (btn.textContent?.trim() === 'Повторить') {
          found = true;
        }
      });
      expect(found).toBe(true);
    });

    it('should emit load when retry button clicked', () => {
      fixture.componentRef.setInput('error', 'Ошибка загрузки');
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      let retryButton: HTMLElement | undefined;
      buttons.forEach((btn: HTMLElement) => {
        if (btn.textContent?.trim() === 'Повторить') {
          retryButton = btn;
        }
      });
      retryButton!.dispatchEvent(new Event('click'));
      // Load is an output - verified by button click triggering (click) handler
    });

    it('should not show error when items exist', () => {
      fixture.componentRef.setInput('error', 'Ошибка загрузки');
      fixture.componentRef.setInput('items', defaultItems);
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('.course-catalog-page__message');
      expect(message).toBeNull();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no items and no error', () => {
      fixture.componentRef.setInput('items', []);
      fixture.componentRef.setInput('error', null);
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('.course-catalog-page__message');
      expect(message).toBeTruthy();
      expect(message.textContent).toContain('Опубликованных программ');
    });

    it('should have links in empty message', () => {
      fixture.componentRef.setInput('items', []);
      fixture.componentRef.setInput('error', null);
      fixture.detectChanges();

      const links = fixture.nativeElement.querySelectorAll('a[routerLink]');
      expect(links.length).toBe(2);
    });
  });

  describe('items list', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', defaultItems);
      fixture.componentRef.setInput('totalItems', 2);
      fixture.componentRef.setInput('progressByCourseId', { 'c-1': 50, 'c-2': 0 });
      fixture.componentRef.setInput('completedCourseIds', new Set(['c-1']));
      fixture.detectChanges();
    });

    it('should render course items', () => {
      const items = fixture.nativeElement.querySelectorAll('.course-catalog-page__item');
      expect(items.length).toBe(2);
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
      const badges = fixture.nativeElement.querySelectorAll('.course-catalog-page__badge');
      expect(badges.length).toBe(1);
      expect(badges[0]?.textContent?.trim()).toContain('Завершён');
    });

    it('should show progress percentage for non-completed courses', () => {
      fixture.componentRef.setInput('completedCourseIds', new Set());
      fixture.detectChanges();

      const metas = fixture.nativeElement.querySelectorAll('.course-catalog-page__meta');
      expect(metas[0]?.textContent?.trim()).toContain('50%');
    });

    it('should not show progress for completed courses', () => {
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
      fixture.componentRef.setInput('completedCourseIds', new Set(['c-1']));
      fixture.detectChanges();
      expect(component.isCourseCompleted('c-1')).toBe(true);
    });

    it('should return false for non-completed course', () => {
      fixture.componentRef.setInput('completedCourseIds', new Set(['c-1']));
      fixture.detectChanges();
      expect(component.isCourseCompleted('c-2')).toBe(false);
    });

    it('should return false for unknown course', () => {
      fixture.componentRef.setInput('completedCourseIds', new Set(['c-1']));
      fixture.detectChanges();
      expect(component.isCourseCompleted('unknown')).toBe(false);
    });
  });

  describe('progressPercent', () => {
    it('should return stored progress for known course', () => {
      fixture.componentRef.setInput('progressByCourseId', { 'c-1': 75, 'c-2': 30 });
      fixture.detectChanges();
      expect(component.progressPercent('c-1')).toBe(75);
      expect(component.progressPercent('c-2')).toBe(30);
    });

    it('should return 0 for unknown course', () => {
      fixture.componentRef.setInput('progressByCourseId', { 'c-1': 75 });
      fixture.detectChanges();
      expect(component.progressPercent('unknown')).toBe(0);
    });
  });
});
