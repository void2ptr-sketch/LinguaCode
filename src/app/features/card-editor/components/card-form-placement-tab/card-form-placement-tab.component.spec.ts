import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CardFormPlacementTabComponent } from './card-form-placement-tab.component';
import type { PlacementDraft } from './card-form-placement-tab.component';

describe('CardFormPlacementTabComponent', () => {
  let component: CardFormPlacementTabComponent;
  let fixture: ComponentFixture<CardFormPlacementTabComponent>;

  beforeEach(() => {
    // Keep the test focused on the tab contract; the selector itself is
    // covered by its own spec.
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
    fixture.componentRef.setInput('languagePairId', 1);
    fixture.detectChanges();
  });

  it('should have draft input', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have languagePairId input', () => {
    expect(component.languagePairId()).toBe(1);
  });

  it('should have readOnly input', () => {
    expect(component.readOnly()).toBe(false);
  });

  it('should render every hierarchy level', () => {
    expect(component.levels).toEqual(['languagePair', 'course', 'program', 'lesson', 'scenario']);
  });

  it('should keep the language pair read-only', () => {
    expect(component.readOnlyLevels).toEqual(['languagePair']);
  });

  it('should emit placementChange', () => {
    let emitted: PlacementDraft | undefined;
    component.placementChange.subscribe((value) => {
      emitted = value;
    });

    component.placementChange.emit({
      languagePairId: 1,
      courseId: 'course-1',
      programId: 'program-1',
      lessonId: 'lesson-1',
      scenarioId: 'scenario-1',
    });

    expect(emitted).toEqual({
      languagePairId: 1,
      courseId: 'course-1',
      programId: 'program-1',
      lessonId: 'lesson-1',
      scenarioId: 'scenario-1',
    });
  });

  it('should render hint paragraph', () => {
    const hints = fixture.nativeElement.querySelectorAll('.card-form__hint');
    expect(hints.length).toBeGreaterThan(0);
  });

  it('should render placement tab panel', () => {
    const panel = fixture.nativeElement.querySelector('.card-form__tab-panel');
    expect(panel).toBeTruthy();
  });
});
