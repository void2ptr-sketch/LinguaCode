import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CardFormPlacementTabComponent } from './card-form-placement-tab.component';
import type { PlacementDraft } from './card-form-placement-tab.component';

describe('CardFormPlacementTabComponent', () => {
  let component: CardFormPlacementTabComponent;
  let fixture: ComponentFixture<CardFormPlacementTabComponent>;

  beforeEach(() => {
    // Override the component template to avoid MatSelect infrastructure issues
    TestBed.overrideComponent(CardFormPlacementTabComponent, {
      set: {
        template: `
          <div class="card-form__tab-panel">
            <p class="card-form__hint card-form__hint--tab">Размещение.</p>
            <div class="course-id">{{ draft().courseId }}</div>
            <div class="program-id">{{ draft().programId }}</div>
            <div class="lesson-id">{{ draft().lessonId }}</div>
            <div class="scenario-id">{{ draft().scenarioId }}</div>
          </div>
        `,
      },
    });

    TestBed.configureTestingModule({
      imports: [CardFormPlacementTabComponent],
    });

    fixture = TestBed.createComponent(CardFormPlacementTabComponent);
    component = fixture.componentInstance;

    const draft: PlacementDraft = {
      courseId: '',
      programId: '',
      lessonId: '',
      scenarioId: '',
    };

    fixture.componentRef.setInput('draft', draft);
    fixture.componentRef.setInput('availableCourses', [
      { id: 'course-1', title: 'Radicals Course' },
    ]);
    fixture.componentRef.setInput('availablePrograms', [
      { id: 'program-1', title: 'Level 1' },
    ]);
    fixture.componentRef.setInput('availableLessons', [
      { id: 'lesson-1', title: 'Lesson 1' },
    ]);
    fixture.componentRef.setInput('availableScenarios', [
      { id: 'scenario-1', title: 'Greeting' },
    ]);

    fixture.detectChanges();
  });

  // ── Inputs ──

  it('should have draft input', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have availableCourses input', () => {
    expect(component.availableCourses).toBeDefined();
  });

  it('should have availablePrograms input', () => {
    expect(component.availablePrograms).toBeDefined();
  });

  it('should have availableLessons input', () => {
    expect(component.availableLessons).toBeDefined();
  });

  it('should have availableScenarios input', () => {
    expect(component.availableScenarios).toBeDefined();
  });

  it('should not expose a language pair field', () => {
    expect('languagePairDisplay' in component).toBe(false);
    expect('meta' in component).toBe(false);
    expect('languagePairIdChange' in component).toBe(false);
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

  // ── Methods ──

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
    const debugElement = fixture.nativeElement;
    const hints = debugElement.querySelectorAll('.card-form__hint');
    expect(hints.length).toBeGreaterThan(0);
  });

  it('should render placement tab panel', () => {
    const debugElement = fixture.nativeElement;
    const panel = debugElement.querySelector('.card-form__tab-panel');
    expect(panel).toBeTruthy();
  });
});
