import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CardConnectionsTabComponent } from './card-connections-tab.component';
import { CardCatalogHierarchyService } from '../../../../entities/card/lib/services/card-catalog-hierarchy.service';
import type { CourseOption, LessonOption, ScenarioOption } from '../../../../entities/card/lib/services/card-catalog-hierarchy.service';

// Mock hierarchy service
class MockCardCatalogHierarchyService {
  coursesLoading = { set: () => undefined, asReadonly: () => undefined };
  lessonsLoading = { set: () => undefined, asReadonly: () => undefined };
  programsLoading = { set: () => undefined, asReadonly: () => undefined };

  async loadCourses(): Promise<readonly CourseOption[]> {
    return [
      { id: 'course-1', title: 'Radicals Course' },
      { id: 'course-2', title: 'Basic Words' },
    ];
  }

  async loadPrograms(courseId: string): Promise<readonly { id: string; title: string }[]> {
    void courseId;
    return [
      { id: 'program-1', title: 'Level 1' },
      { id: 'program-2', title: 'Level 2' },
    ];
  }

  async loadLessons(programId: string): Promise<readonly LessonOption[]> {
    void programId;
    return [
      { id: 'lesson-1', title: 'Lesson 1' },
      { id: 'lesson-2', title: 'Lesson 2' },
    ];
  }

  getScenariosForLesson(programId: string, lessonId: string): readonly ScenarioOption[] {
    void programId;
    void lessonId;
    return [
      { id: 'scenario-1', title: 'Greeting' },
      { id: 'scenario-2', title: 'Shopping' },
    ];
  }

  invalidateCache(): void {
    // no-op
  }
}

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CardConnectionsTabComponent],
  template: `
    <app-card-connections-tab
      [draft]="draft"
      [meta]="meta"
      (courseIdChange)="onCourseIdChange($event)"
      (programIdChange)="onProgramIdChange($event)"
      (lessonIdChange)="onLessonIdChange($event)"
      (scenarioIdChange)="onScenarioIdChange($event)"
    />
  `,
})
class HostComponent {
  draft = {
    courseId: '',
    programId: '',
    lessonId: '',
    scenarioId: '',
  };
  meta = { languagePairId: 'ru_en_123' };
  onCourseIdChange: (_v: string) => void = vi.fn();
  onProgramIdChange: (_v: string) => void = vi.fn();
  onLessonIdChange: (_v: string) => void = vi.fn();
  onScenarioIdChange: (_v: string) => void = vi.fn();
}

describe('CardConnectionsTabComponent', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let component: CardConnectionsTabComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, CardConnectionsTabComponent],
      providers: [
        {
          provide: CardCatalogHierarchyService,
          useClass: MockCardCatalogHierarchyService,
        },
      ],
    });

    hostFixture = TestBed.createComponent(HostComponent);
    void hostFixture.componentInstance;
    hostFixture.detectChanges();

    component = hostFixture.debugElement.children[0].componentInstance as CardConnectionsTabComponent;
  });

  // ── Inputs ──

  it('should have draft input', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have meta input', () => {
    expect(component.meta).toBeDefined();
  });

  // ── Outputs ──

  it('should have courseIdChange output', () => {
    let emitted = '';
    component.courseIdChange.subscribe((v) => {
      emitted = v;
    });
    component.courseIdChange.emit('c1');
    expect(emitted).toBe('c1');
  });

  it('should have programIdChange output', () => {
    let emitted = '';
    component.programIdChange.subscribe((v) => {
      emitted = v;
    });
    component.programIdChange.emit('p1');
    expect(emitted).toBe('p1');
  });

  it('should have lessonIdChange output', () => {
    let emitted = '';
    component.lessonIdChange.subscribe((v) => {
      emitted = v;
    });
    component.lessonIdChange.emit('l1');
    expect(emitted).toBe('l1');
  });

  it('should have scenarioIdChange output', () => {
    let emitted = '';
    component.scenarioIdChange.subscribe((v) => {
      emitted = v;
    });
    component.scenarioIdChange.emit('s1');
    expect(emitted).toBe('s1');
  });

  // ── Signals ──

  it('should have loading signal', () => {
    expect(component.loading).toBeDefined();
  });

  it('should have availableCourses signal', () => {
    expect(component.availableCourses).toBeDefined();
  });

  it('should have availablePrograms signal', () => {
    expect(component.availablePrograms).toBeDefined();
  });

  it('should have availableLessons signal', () => {
    expect(component.availableLessons).toBeDefined();
  });

  it('should have availableScenarios signal', () => {
    expect(component.availableScenarios).toBeDefined();
  });

  // ── Update methods ──

  it('should emit courseId on updateCourseId', () => {
    let emitted = '';
    component.courseIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateCourseId('course-1');
    expect(emitted).toBe('course-1');
  });

  it('should emit programId on updateProgramId', () => {
    let emitted = '';
    component.programIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateProgramId('program-1');
    expect(emitted).toBe('program-1');
  });

  it('should emit lessonId on updateLessonId', () => {
    let emitted = '';
    component.lessonIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateLessonId('lesson-1');
    expect(emitted).toBe('lesson-1');
  });

  it('should emit scenarioId on updateScenarioId', () => {
    let emitted = '';
    component.scenarioIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateScenarioId('scenario-1');
    expect(emitted).toBe('scenario-1');
  });

  // ── HTML rendering ──

  it('should render hint paragraph', () => {
    const debugElement = hostFixture.nativeElement;
    const hints = debugElement.querySelectorAll('.card-form__hint');
    expect(hints.length).toBeGreaterThan(0);
  });

  it('should render connection tab component', () => {
    const debugElement = hostFixture.nativeElement;
    const tabComponent = debugElement.querySelector('app-card-connections-tab');
    expect(tabComponent).toBeTruthy();
  });
});
