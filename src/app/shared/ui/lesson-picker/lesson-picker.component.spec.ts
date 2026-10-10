import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { vi } from 'vitest';

import { LessonPickerComponent } from './lesson-picker.component';
import { CourseSearchService } from '../../../core/data';
import { LearningResultsStore } from '../../../core/state';
import type { CourseWithLessons, Lesson } from '../../../core/models';

function makeLesson(
  id: string,
  title: string,
  scenarioIds: string[],
  prerequisiteLessonIds: string[] = [],
  order = 0,
): Lesson {
  return {
    id,
    title,
    description: '',
    courseId: 'course-1',
    scenarioIds,
    prerequisiteLessonIds,
    order,
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeCourse(
  id: string,
  title: string,
  lessons: Lesson[],
): CourseWithLessons {
  return {
    id,
    title,
    description: '',
    authorId: 'author-1',
    languagePair: { known: 'ru', learning: 'zh' },
    lessonIds: lessons.map((l) => l.id),
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    lessons,
  };
}

describe('LessonPickerComponent', () => {
  let component: LessonPickerComponent;
  let fixture: ComponentFixture<LessonPickerComponent>;

  const mockCourse = makeCourse('course-1', 'Test Course', [
    makeLesson('lesson-1', 'Lesson 1', ['scenario-1'], [], 0),
    makeLesson('lesson-2', 'Lesson 2', ['scenario-2', 'scenario-3'], ['lesson-1'], 1),
  ]);

  let mockCourseSearchService: Partial<CourseSearchService>;
  let mockResultsStore: Partial<LearningResultsStore>;

  beforeEach(async () => {
    mockCourseSearchService = {
      getById: vi.fn().mockResolvedValue(mockCourse),
    };

    mockResultsStore = {
      resultsForScenario: vi.fn().mockReturnValue([]),
      isLessonCompleted: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [
        LessonPickerComponent,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
      ],
      providers: [
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: LearningResultsStore, useValue: mockResultsStore },
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedCourseId', 'course-1');
    fixture.componentRef.setInput('selectedLessonId', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load lessons immediately via effect', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.lessons().length).toBe(2);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should load lessons on init via effect', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockCourseSearchService.getById).toHaveBeenCalledWith('course-1');
    expect(component.lessons().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should sort lessons by order', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const lessons = component.lessons();
    expect(lessons[0].id).toBe('lesson-1');
    expect(lessons[1].id).toBe('lesson-2');
  });

  it('should set error on load failure', async () => {
    (mockCourseSearchService.getById as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    // Re-create fixture to trigger effect with the new mock
    fixture = TestBed.createComponent(LessonPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedCourseId', 'course-1');
    fixture.componentRef.setInput('selectedLessonId', '');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe('Не удалось загрузить уроки курса');
    expect(component.loading()).toBe(false);
  });

  it('should emit lessonPickChange when picking a lesson', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const pickSpy = vi.fn();
    component.lessonPickChange.subscribe(pickSpy);

    const lesson = component.lessons()[0];
    component.pick(lesson);

    expect(pickSpy).toHaveBeenCalledWith({
      lessonId: 'lesson-1',
      title: 'Lesson 1',
      scenarioIds: ['scenario-1'],
    });
  });

  it('should emit selectedLessonIdChange when picking a lesson', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const selectSpy = vi.fn();
    component.selectedLessonIdChange.subscribe(selectSpy);

    const lesson = component.lessons()[0];
    component.pick(lesson);

    expect(selectSpy).toHaveBeenCalledWith('lesson-1');
  });

  it('should not pick a locked lesson', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const pickSpy = vi.fn();
    component.lessonPickChange.subscribe(pickSpy);

    const lockedLesson = component.lessons()[1];
    component.pick(lockedLesson);

    expect(pickSpy).not.toHaveBeenCalled();
  });

  it('should compute lessonItems with unlock status', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const items = component.lessonItems();
    expect(items).toHaveLength(2);
    expect(items[0].lesson.id).toBe('lesson-1');
    expect(items[0].unlocked).toBe(true);
    expect(items[1].unlocked).toBe(false);
  });

  it('should skip prerequisite check when enforcePrerequisites is false', async () => {
    fixture.componentRef.setInput('enforcePrerequisites', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const items = component.lessonItems();
    expect(items[1].unlocked).toBe(true);
  });
});
