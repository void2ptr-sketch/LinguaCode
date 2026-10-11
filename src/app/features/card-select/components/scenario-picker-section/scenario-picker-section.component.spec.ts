import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScenarioPickerSectionComponent } from './scenario-picker-section.component';
import { ScenarioSearchService } from '../../../../core/repositories';

@Component({
  standalone: true,
  imports: [ScenarioPickerSectionComponent],
  template: `
    <app-scenario-picker-section
      [selectedCourseId]="selectedCourseId"
      [selectedLessonId]="selectedLessonId"
      [lessonTitle]="lessonTitle"
      [courseTitle]="courseTitle"
      [requiresLessonForScenarios]="requiresLessonForScenarios"
      [isOpenPractice]="isOpenPractice"
      [showDifficultyFilter]="showDifficultyFilter"
      [difficultyLevels]="difficultyLevels"
      [difficultyLabels]="difficultyLabels"
      [selectedDifficulty]="selectedDifficulty"
      [allowedScenarioIds]="allowedScenarioIds"
      [selectedScenarioId]="selectedScenarioId"
      [nextStepHint]="nextStepHint"
      [canStartPractice]="canStartPractice"
      (difficultyChange)="onDifficultyChange($event)"
      (selectedScenarioIdChange)="onSelectedScenarioIdChange($event)"
      (scenarioLabelChange)="onScenarioLabelChange($event)"
      (goToLessons)="onGoToLessons()"
      (nextClick)="onNextClick()"
    />
  `,
})
class WrapperComponent {
  selectedCourseId = 'test-course-id';
  selectedLessonId = 'test-lesson-id';
  lessonTitle = 'Test Lesson';
  courseTitle = 'Test Course';
  requiresLessonForScenarios = true;
  isOpenPractice = false;
  showDifficultyFilter = true;
  difficultyLevels = ['beginner', 'intermediate', 'advanced'] as const;
  difficultyLabels = { beginner: 'Начальный', intermediate: 'Средний', advanced: 'Продвинутый' };
  selectedDifficulty = null as string | null;
  allowedScenarioIds = ['scenario-1', 'scenario-2'] as const;
  selectedScenarioId = 'test-scenario-id';
  nextStepHint = 'Select a scenario';
  canStartPractice = false;

  onDifficultyChange = vi.fn();
  onSelectedScenarioIdChange = vi.fn();
  onScenarioLabelChange = vi.fn();
  onGoToLessons = vi.fn();
  onNextClick = vi.fn();
}

describe('ScenarioPickerSectionComponent', () => {
  let wrapper: WrapperComponent;
  let fixture: ComponentFixture<WrapperComponent>;
  let component: ScenarioPickerSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        {
          provide: ScenarioSearchService,
          useValue: {
            search: () => Promise.resolve({ items: [], total: 0, page: 0, pageSize: 10 }),
            getById: () => Promise.resolve(null as unknown as Parameters<ScenarioSearchService['getById']>[0]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    wrapper = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance as ScenarioPickerSectionComponent;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required inputs', () => {
    expect(component.selectedCourseId()).toBe('test-course-id');
    expect(component.lessonTitle()).toBe('Test Lesson');
    expect(component.courseTitle()).toBe('Test Course');
    expect(component.requiresLessonForScenarios()).toBe(true);
    expect(component.isOpenPractice()).toBe(false);
    expect(component.showDifficultyFilter()).toBe(true);
    expect(component.difficultyLevels()).toEqual(['beginner', 'intermediate', 'advanced']);
    expect(component.difficultyLabels()).toEqual({ beginner: 'Начальный', intermediate: 'Средний', advanced: 'Продвинутый' });
    expect(component.selectedScenarioId()).toBe('test-scenario-id');
    expect(component.nextStepHint()).toBe('Select a scenario');
    expect(component.canStartPractice()).toBe(false);
  });

  it('should have optional inputs with defaults', () => {
    expect(component.selectedLessonId()).toBe('test-lesson-id');
    expect(component.selectedDifficulty()).toBeNull();
    expect(component.allowedScenarioIds()).toEqual(['scenario-1', 'scenario-2']);
  });

  it('should have all outputs defined', () => {
    expect(component.difficultyChange).toBeDefined();
    expect(component.selectedScenarioIdChange).toBeDefined();
    expect(component.scenarioLabelChange).toBeDefined();
    expect(component.goToLessons).toBeDefined();
    expect(component.nextClick).toBeDefined();
  });

  it('should emit event when difficultyChange is called', () => {
    component.difficultyChange.emit('beginner');
    expect(wrapper.onDifficultyChange).toHaveBeenCalledWith('beginner');
  });

  it('should emit event when selectedScenarioIdChange is called', () => {
    component.selectedScenarioIdChange.emit('test-scenario-id');
    expect(wrapper.onSelectedScenarioIdChange).toHaveBeenCalledWith('test-scenario-id');
  });

  it('should emit event when scenarioLabelChange is called', () => {
    component.scenarioLabelChange.emit('test-label');
    expect(wrapper.onScenarioLabelChange).toHaveBeenCalledWith('test-label');
  });

  it('should emit event when goToLessons is called', () => {
    component.goToLessons.emit();
    expect(wrapper.onGoToLessons).toHaveBeenCalled();
  });

  it('should emit event when nextClick is called', () => {
    component.nextClick.emit();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });

  // ─── Handler tests ────────────────────────────────────────────────────

  it('should emit difficultyChange when onDifficultyChange is called', () => {
    component.onDifficultyChange('intermediate');
    expect(wrapper.onDifficultyChange).toHaveBeenCalledWith('intermediate');
  });

  it('should emit null difficulty when clearing filter', () => {
    component.onDifficultyChange(null);
    expect(wrapper.onDifficultyChange).toHaveBeenCalledWith(null);
  });

  it('should emit selectedScenarioIdChange when onSelectedScenarioIdChange is called', () => {
    component.onSelectedScenarioIdChange('new-scenario-id');
    expect(wrapper.onSelectedScenarioIdChange).toHaveBeenCalledWith('new-scenario-id');
  });

  it('should emit scenarioLabelChange when onScenarioLabelChange is called', () => {
    component.onScenarioLabelChange('New Label');
    expect(wrapper.onScenarioLabelChange).toHaveBeenCalledWith('New Label');
  });

  it('should emit goToLessons when onGoToLessons is called', () => {
    component.onGoToLessons();
    expect(wrapper.onGoToLessons).toHaveBeenCalled();
  });

  it('should emit nextClick when onNextClick is called', () => {
    component.onNextClick();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });
});
