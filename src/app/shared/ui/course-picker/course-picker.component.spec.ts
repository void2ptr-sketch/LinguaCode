import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CoursePickerComponent } from './course-picker.component';
import { CourseSearchService } from '../../../../core/repositories';
import { UserStore } from '../../../../core/state';
import type { CourseIndexEntry, CourseListScope } from '../../../../core/models';

// Mock CourseSearchService
function createCourseSearchMock() {
  return {
    search: vi.fn().mockResolvedValue({
      items: [] as CourseIndexEntry[],
      totalItems: 0,
    }),
  };
}

// Mock UserStore
function createUserStoreMock() {
  return {
    languagePair: () => ({ known: 'ru' as const, learning: 'en' as const }),
    activeLanguagePairId: () => 'default-pair',
  };
}

describe('CoursePickerComponent', () => {
  let fixture: ComponentFixture<CoursePickerComponent>;
  let component: CoursePickerComponent;
  let courseSearchMock: ReturnType<typeof createCourseSearchMock>;
  let userStoreMock: ReturnType<typeof createUserStoreMock>;

  const mockCourse: CourseIndexEntry = {
    id: 'course-1',
    title: 'Test Course',
    lessonCount: 10,
    languagePairSummary: 'RU → EN',
  };

  beforeEach(() => {
    courseSearchMock = createCourseSearchMock();
    userStoreMock = createUserStoreMock();

    TestBed.configureTestingModule({
      imports: [CoursePickerComponent, NoopAnimationsModule],
      providers: [
        { provide: CourseSearchService, useValue: courseSearchMock },
        { provide: UserStore, useValue: userStoreMock },
      ],
    });

    fixture = TestBed.createComponent(CoursePickerComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.detectChanges();
      expect(component).toBeDefined();
    });

    it('should call load on ngOnInit', fakeAsync(() => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.detectChanges();
      tick();
      expect(courseSearchMock.search).toHaveBeenCalled();
    }));
  });

  describe('inputs', () => {
    it('should accept required selectedCourseId input', () => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.detectChanges();
      expect(component.selectedCourseId()).toBe('course-1');
    });

    it('should accept selectedCourseLabel input', () => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.componentRef.setInput('selectedCourseLabel', 'My Course');
      fixture.detectChanges();
      expect(component.selectedCourseLabel()).toBe('My Course');
    });

    it('should accept defaultScope input', () => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.componentRef.setInput('defaultScope', 'all' as CourseListScope);
      fixture.detectChanges();
      expect(component.defaultScope()).toBe('all');
    });

    it('should accept compact input', () => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.componentRef.setInput('compact', true);
      fixture.detectChanges();
      expect(component.compact()).toBe(true);
    });
  });

  describe('outputs', () => {
    it('should have selectedCourseIdChange output', () => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.detectChanges();
      expect(component.selectedCourseIdChange).toBeDefined();
    });

    it('should have courseLabelChange output', () => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.detectChanges();
      expect(component.courseLabelChange).toBeDefined();
    });
  });

  describe('signals', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.detectChanges();
    });

    it('should have query signal', () => {
      expect(component.query()).toBe('');
    });

    it('should have scope signal', () => {
      expect(component.scope()).toBe('published');
    });

    it('should have items signal', () => {
      expect(Array.isArray(component.items())).toBe(true);
    });

    it('should have totalItems signal', () => {
      expect(component.totalItems()).toBe(0);
    });

    it('should have pageIndex signal', () => {
      expect(component.pageIndex()).toBe(0);
    });

    it('should have pageSize signal', () => {
      expect(component.pageSize()).toBe(10);
    });

    it('should have loading signal', () => {
      expect(component.loading()).toBe(false);
    });

    it('should have showFullList signal', () => {
      expect(component.showFullList()).toBe(false);
    });
  });

  describe('methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('selectedCourseId', 'course-1');
      fixture.detectChanges();
    });

    it('should load courses', fakeAsync(async () => {
      courseSearchMock.search.mockResolvedValue({
        items: [mockCourse],
        totalItems: 1,
      });
      await component.load();
      expect(component.items()).toEqual([mockCourse]);
      expect(component.totalItems()).toBe(1);
    }));

    it('should pick a course and emit events', () => {
      const idSpy = vi.fn();
      const labelSpy = vi.fn();
      component.selectedCourseIdChange.subscribe(idSpy);
      component.courseLabelChange.subscribe(labelSpy);

      component.pick(mockCourse);

      expect(idSpy).toHaveBeenCalledWith('course-1');
      expect(labelSpy).toHaveBeenCalled();
    });

    it('should clear selection', () => {
      const idSpy = vi.fn();
      const labelSpy = vi.fn();
      component.selectedCourseIdChange.subscribe(idSpy);
      component.courseLabelChange.subscribe(labelSpy);

      component.clearSelection();

      expect(idSpy).toHaveBeenCalledWith('');
      expect(labelSpy).toHaveBeenCalledWith('');
      expect(component.showFullList()).toBe(false);
    });

    it('should expand list', () => {
      component.expandList();
      expect(component.showFullList()).toBe(true);
    });

    it('should collapse list', () => {
      component.showFullList.set(true);
      component.collapseList();
      expect(component.showFullList()).toBe(false);
    });

    it('should handle query change', () => {
      component.onQueryChange('test');
      expect(component.query()).toBe('test');
      expect(component.pageIndex()).toBe(0);
    });

    it('should handle scope change', () => {
      component.onScopeChange('all' as CourseListScope);
      expect(component.scope()).toBe('all');
      expect(component.pageIndex()).toBe(0);
    });

    it('should format label', () => {
      const label = component.formatLabel(mockCourse);
      expect(label).toContain('Test Course');
      expect(label).toContain('10 уроков');
      expect(label).toContain('RU → EN');
    });
  });
});
