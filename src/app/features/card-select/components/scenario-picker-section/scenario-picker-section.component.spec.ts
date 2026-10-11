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
  });

  it('should create', () => {
    const component = fixture.debugElement.children[0].componentInstance as ScenarioPickerSectionComponent;
    expect(component).toBeTruthy();
  });

  it('should emit event when difficultyChange is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as ScenarioPickerSectionComponent;
    component.difficultyChange.emit('beginner');
    expect(wrapper.onDifficultyChange).toHaveBeenCalledWith('beginner');
  });

  it('should emit event when selectedScenarioIdChange is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as ScenarioPickerSectionComponent;
    component.selectedScenarioIdChange.emit('test-scenario-id');
    expect(wrapper.onSelectedScenarioIdChange).toHaveBeenCalledWith('test-scenario-id');
  });

  it('should emit event when scenarioLabelChange is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as ScenarioPickerSectionComponent;
    component.scenarioLabelChange.emit('test-label');
    expect(wrapper.onScenarioLabelChange).toHaveBeenCalledWith('test-label');
  });

  it('should emit event when goToLessons is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as ScenarioPickerSectionComponent;
    component.goToLessons.emit();
    expect(wrapper.onGoToLessons).toHaveBeenCalled();
  });

  it('should emit event when nextClick is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as ScenarioPickerSectionComponent;
    component.nextClick.emit();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });
});
