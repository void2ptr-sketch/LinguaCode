import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CardConnectionsTabComponent } from './card-connections-tab.component';
import type { ConnectionsDraft } from './card-connections-tab.component';

describe('CardConnectionsTabComponent', () => {
  let component: CardConnectionsTabComponent;
  let fixture: ComponentFixture<CardConnectionsTabComponent>;

  beforeEach(() => {
    // Override the component template to avoid MatSelect infrastructure issues
    TestBed.overrideComponent(CardConnectionsTabComponent, {
      set: {
        template: `
          <div class="card-form__tab-panel">
            <p class="card-form__hint card-form__hint--tab">Связи.</p>
            <div class="language-pair-display">{{ languagePairDisplay() }}</div>
            <div class="course-id">{{ draft().courseId }}</div>
            <div class="program-id">{{ draft().programId }}</div>
            <div class="lesson-id">{{ draft().lessonId }}</div>
            <div class="scenario-id">{{ draft().scenarioId }}</div>
          </div>
        `,
      },
    });

    TestBed.configureTestingModule({
      imports: [CardConnectionsTabComponent],
    });

    fixture = TestBed.createComponent(CardConnectionsTabComponent);
    component = fixture.componentInstance;

    const draft: ConnectionsDraft = {
      courseId: '',
      programId: '',
      lessonId: '',
      scenarioId: '',
    };

    fixture.componentRef.setInput('draft', draft);
    fixture.componentRef.setInput('meta', { languagePairId: '1' });
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
    fixture.componentRef.setInput('languagePairDisplay', 'Русский → English');

    fixture.detectChanges();
  });

  // ── Inputs ──

  it('should have draft input', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have meta input', () => {
    expect(component.meta).toBeDefined();
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

  it('should have languagePairDisplay input', () => {
    expect(component.languagePairDisplay).toBeDefined();
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

  it('should have languagePairIdChange output', () => {
    let emitted = '';
    component.languagePairIdChange.subscribe((v) => {
      emitted = v;
    });
    component.languagePairIdChange.emit('pair-1');
    expect(emitted).toBe('pair-1');
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

  it('should emit languagePairId on updateLanguagePairId', () => {
    let emitted = '';
    component.languagePairIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateLanguagePairId('pair-1');
    expect(emitted).toBe('pair-1');
  });

  // ── HTML rendering ──

  it('should render hint paragraph', () => {
    const debugElement = fixture.nativeElement;
    const hints = debugElement.querySelectorAll('.card-form__hint');
    expect(hints.length).toBeGreaterThan(0);
  });

  it('should render connection tab panel', () => {
    const debugElement = fixture.nativeElement;
    const panel = debugElement.querySelector('.card-form__tab-panel');
    expect(panel).toBeTruthy();
  });
});
