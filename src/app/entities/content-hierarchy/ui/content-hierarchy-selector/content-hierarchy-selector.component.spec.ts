import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { ContentHierarchySelectorComponent } from './content-hierarchy-selector.component';
import { ContentHierarchyService } from '../../lib/services/content-hierarchy.service';

describe('ContentHierarchySelectorComponent', () => {
  const hierarchyMock = {
    loadLanguagePairs: vi.fn(async () => [{ id: 1, title: 'Русский → English' }]),
    loadCourses: vi.fn(async () => [{ id: 'course-1', title: 'Course One' }]),
    loadPrograms: vi.fn(async () => [{ id: 'program-1', title: 'Program One' }]),
    loadLessons: vi.fn(async () => [{ id: 'lesson-1', title: 'Lesson One' }]),
    loadScenarios: vi.fn(async () => [{ id: 'scenario-1', title: 'Greeting' }]),
    hydrate: vi.fn(async (value: unknown) => value),
  };

  function create(): {
    component: ContentHierarchySelectorComponent;
    fixture: ReturnType<typeof TestBed.createComponent<ContentHierarchySelectorComponent>>;
  } {
    TestBed.configureTestingModule({
      imports: [ContentHierarchySelectorComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ContentHierarchyService, useValue: hierarchyMock },
      ],
    });

    const fixture = TestBed.createComponent(ContentHierarchySelectorComponent);
    return { component: fixture.componentInstance, fixture };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all hierarchy levels by default', () => {
    const { component } = create();
    expect(component.visibleLevels()).toEqual([
      'languagePair',
      'course',
      'program',
      'lesson',
      'scenario',
    ]);
  });

  it('renders only the requested levels', () => {
    const { component, fixture } = create();
    fixture.componentRef.setInput('levels', ['languagePair', 'course']);
    expect(component.visibleLevels()).toEqual(['languagePair', 'course']);
  });

  it('loads language pairs on init', async () => {
    const { component, fixture } = create();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hierarchyMock.loadLanguagePairs).toHaveBeenCalled();
    expect(component.languagePairs()).toEqual([{ id: 1, title: 'Русский → English' }]);
  });

  it('reloads courses and clears lower levels when the pair changes', async () => {
    const { component, fixture } = create();
    fixture.detectChanges();
    await fixture.whenStable();

    const emitted: unknown[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));

    await component.onLanguagePairChange(1);

    expect(emitted.at(-1)).toEqual({ languagePairId: 1 });
    expect(hierarchyMock.loadCourses).toHaveBeenCalledWith(1, 'all');
    expect(component.courses()).toEqual([{ id: 'course-1', title: 'Course One' }]);
    expect(component.currentValue().programId).toBeUndefined();
  });

  it('reloads programs and clears lower levels when the course changes', async () => {
    const { component, fixture } = create();
    fixture.detectChanges();
    await fixture.whenStable();
    await component.onLanguagePairChange(1);

    await component.onCourseChange('course-1');

    expect(hierarchyMock.loadPrograms).toHaveBeenCalledWith('course-1');
    expect(component.programs()).toEqual([{ id: 'program-1', title: 'Program One' }]);
    expect(component.currentValue().courseId).toBe('course-1');
    expect(component.currentValue().lessonId).toBeUndefined();
  });

  it('reloads lessons and scenarios through the cascade', async () => {
    const { component, fixture } = create();
    fixture.detectChanges();
    await fixture.whenStable();
    await component.onLanguagePairChange(1);
    await component.onCourseChange('course-1');

    await component.onProgramChange('program-1');
    expect(hierarchyMock.loadLessons).toHaveBeenCalledWith('program-1');
    expect(component.lessons()).toEqual([{ id: 'lesson-1', title: 'Lesson One' }]);

    await component.onLessonChange('lesson-1');
    expect(hierarchyMock.loadScenarios).toHaveBeenCalledWith('lesson-1');
    expect(component.scenarios()).toEqual([{ id: 'scenario-1', title: 'Greeting' }]);

    component.onScenarioChange('scenario-1');
    expect(component.currentValue().scenarioId).toBe('scenario-1');
  });

  it('hydrates the full chain when only a leaf value is provided', async () => {
    hierarchyMock.hydrate.mockImplementation(async (value: unknown) => {
      const scenarioId = (value as { scenarioId?: string }).scenarioId;
      if (scenarioId) {
        return {
          scenarioId: 'scenario-1',
          lessonId: 'lesson-1',
          programId: 'program-1',
          courseId: 'course-1',
          languagePairId: 1,
        };
      }
      return value;
    });

    const { component, fixture } = create();
    fixture.componentRef.setInput('value', { scenarioId: 'scenario-1' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.currentValue()).toEqual({
      scenarioId: 'scenario-1',
      lessonId: 'lesson-1',
      programId: 'program-1',
      courseId: 'course-1',
      languagePairId: 1,
    });
    expect(hierarchyMock.loadCourses).toHaveBeenCalledWith(1, 'all');
    expect(hierarchyMock.loadPrograms).toHaveBeenCalledWith('course-1');
    expect(hierarchyMock.loadLessons).toHaveBeenCalledWith('program-1');
    expect(hierarchyMock.loadScenarios).toHaveBeenCalledWith('lesson-1');
  });

  it('uses the explicit language-pair ID to filter courses', async () => {
    const { component, fixture } = create();
    fixture.componentRef.setInput('languagePairId', 7);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.currentValue().languagePairId).toBe(7);
    expect(hierarchyMock.loadCourses).toHaveBeenCalledWith(7, 'all');
  });

  it('keeps read-only levels disabled', () => {
    const { component, fixture } = create();
    fixture.componentRef.setInput('readOnlyLevels', ['languagePair']);
    fixture.detectChanges();

    expect(component.isDisabled('languagePair')).toBe(true);
  });
});
