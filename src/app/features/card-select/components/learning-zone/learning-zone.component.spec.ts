import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearningZoneComponent } from './learning-zone.component';

@Component({
  standalone: true,
  imports: [LearningZoneComponent],
  template: `
    <app-learning-zone
      [selectedScenarioId]="selectedScenarioId"
      [courseTitle]="courseTitle"
      [lessonTitle]="lessonTitle"
      [scenarioTitle]="scenarioTitle"
      [scenarioSourceLabel]="scenarioSourceLabel"
      [showDirectionToggle]="showDirectionToggle"
      [sessionDirection]="sessionDirection"
      [cardProgressPercent]="cardProgressPercent"
      [missingCardsWarning]="missingCardsWarning"
      [loading]="loading"
      [error]="error"
      [completed]="completed"
      [showCourseCertificate]="showCourseCertificate"
      [hasNextLessonScenario]="hasNextLessonScenario"
      [progressLabel]="progressLabel"
      [fontSize]="fontSize"
      [currentCard]="currentCard"
      [isLearningTabActive]="isLearningTabActive"
      (directionChange)="onDirectionChange($event)"
      (goToScenarios)="onGoToScenarios()"
      (retry)="onRetry()"
      (goToNextLessonScenario)="onGoToNextLessonScenario()"
      (restart)="onRestart()"
      (optionSelected)="onOptionSelected($event)"
      (answerTextChange)="onAnswerTextChange($event)"
      (memoryCompleteChange)="onMemoryCompleteChange($event)"
      (drawSubmittedChange)="onDrawSubmittedChange($event)"
      (drawAnswerChange)="onDrawAnswerChange($event)"
      (timeExpired)="onTimeExpired()"
      (checkAnswer)="onCheckAnswer()"
      (nextCard)="onNextCard()"
    />
  `,
})
class WrapperComponent {
  selectedScenarioId = 'test-scenario-id';
  courseTitle = 'Test Course';
  lessonTitle = 'Test Lesson';
  scenarioTitle = 'Test Scenario';
  scenarioSourceLabel = 'Demo';
  showDirectionToggle = true;
  sessionDirection = 'known-to-learning' as const;
  cardProgressPercent = 50;
  missingCardsWarning = null;
  loading = false;
  error = null;
  completed = false;
  showCourseCertificate = false;
  hasNextLessonScenario = false;
  progressLabel = 'Test Progress';
  fontSize = 'md' as const;
  currentCard = null;
  isLearningTabActive = true;

  onDirectionChange = vi.fn();
  onGoToScenarios = vi.fn();
  onRetry = vi.fn();
  onGoToNextLessonScenario = vi.fn();
  onRestart = vi.fn();
  onOptionSelected = vi.fn();
  onAnswerTextChange = vi.fn();
  onMemoryCompleteChange = vi.fn();
  onDrawSubmittedChange = vi.fn();
  onDrawAnswerChange = vi.fn();
  onTimeExpired = vi.fn();
  onCheckAnswer = vi.fn();
  onNextCard = vi.fn();
}

describe('LearningZoneComponent', () => {
  let fixture: ComponentFixture<WrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    const component = fixture.debugElement.children[0].componentInstance as LearningZoneComponent;
    expect(component).toBeTruthy();
  });
});
