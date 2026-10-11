import { Component } from '@angular/core';
// import type { DrawCanvasMode } from '../../core/models/phonetics/draw-practice.types'; // TODO: fix import path
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
  let wrapper: WrapperComponent;
  let fixture: ComponentFixture<WrapperComponent>;
  let component: LearningZoneComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    wrapper = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance as LearningZoneComponent;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required inputs', () => {
    expect(component.selectedScenarioId()).toBe('test-scenario-id');
    expect(component.courseTitle()).toBe('Test Course');
    expect(component.lessonTitle()).toBe('Test Lesson');
    expect(component.scenarioTitle()).toBe('Test Scenario');
    expect(component.scenarioSourceLabel()).toBe('Demo');
    expect(component.showDirectionToggle()).toBe(true);
    expect(component.sessionDirection()).toBe('known-to-learning');
    expect(component.cardProgressPercent()).toBe(50);
    expect(component.loading()).toBe(false);
    expect(component.completed()).toBe(false);
    expect(component.showCourseCertificate()).toBe(false);
    expect(component.hasNextLessonScenario()).toBe(false);
    expect(component.progressLabel()).toBe('Test Progress');
    expect(component.fontSize()).toBe('md');
    expect(component.isLearningTabActive()).toBe(true);
  });

  it('should have optional inputs with defaults', () => {
    expect(component.missingCardsWarning()).toBeNull();
    expect(component.error()).toBeNull();
  });

  it('should have hasCurrentCard computed', () => {
    expect(component.hasCurrentCard()).toBe(false);
  });

  it('should have internal signals', () => {
    expect(component.selectedIndex()).toBe(0);
    expect(component.answerText()).toBe('');
    expect(component.memoryComplete()).toBe(false);
    expect(component.memoryBoardNonce()).toBe(0);
    expect(component.drawSubmitted()).toBe(false);
    expect(component.drawAnswer()).toBeNull();
    expect(component.feedback()).toBeNull();
  });

  it('should have all outputs defined', () => {
    expect(component.directionChange).toBeDefined();
    expect(component.goToScenarios).toBeDefined();
    expect(component.retry).toBeDefined();
    expect(component.goToNextLessonScenario).toBeDefined();
    expect(component.restart).toBeDefined();
    expect(component.optionSelected).toBeDefined();
    expect(component.answerTextChange).toBeDefined();
    expect(component.memoryCompleteChange).toBeDefined();
    expect(component.drawSubmittedChange).toBeDefined();
    expect(component.drawAnswerChange).toBeDefined();
    expect(component.timeExpired).toBeDefined();
    expect(component.checkAnswer).toBeDefined();
    expect(component.nextCard).toBeDefined();
  });

  // ─── Handler tests ────────────────────────────────────────────────────

  it('should emit directionChange when onDirectionChange is called', () => {
    component.onDirectionChange('learning-to-known');
    expect(wrapper.onDirectionChange).toHaveBeenCalledWith('learning-to-known');
  });

  it('should emit retry when onRetry is called', () => {
    component.onRetry();
    expect(wrapper.onRetry).toHaveBeenCalled();
  });

  it('should emit goToNextLessonScenario when onGoToNextLessonScenario is called', () => {
    component.onGoToNextLessonScenario();
    expect(wrapper.onGoToNextLessonScenario).toHaveBeenCalled();
  });

  it('should emit restart when onRestart is called', () => {
    component.onRestart();
    expect(wrapper.onRestart).toHaveBeenCalled();
  });

  it('should emit goToScenarios when onGoToScenarios is called', () => {
    component.onGoToScenarios();
    expect(wrapper.onGoToScenarios).toHaveBeenCalled();
  });

  it('should emit optionSelected when onOptionSelected is called', () => {
    component.onOptionSelected(3);
    expect(wrapper.onOptionSelected).toHaveBeenCalledWith(3);
  });

  it('should emit answerTextChange when onAnswerTextChange is called', () => {
    component.onAnswerTextChange('hello world');
    expect(wrapper.onAnswerTextChange).toHaveBeenCalledWith('hello world');
  });

  it('should emit memoryCompleteChange when onMemoryCompleteChange is called', () => {
    component.onMemoryCompleteChange(true);
    expect(wrapper.onMemoryCompleteChange).toHaveBeenCalledWith(true);
  });

  it('should emit drawSubmittedChange when onDrawSubmittedChange is called', () => {
    component.onDrawSubmittedChange(true);
    expect(wrapper.onDrawSubmittedChange).toHaveBeenCalledWith(true);
  });

  it('should emit drawAnswerChange when onDrawAnswerChange is called', () => {
    const payload = { canvasMode: 'memory' as const, canvasSize: { width: 100, height: 100 }, strokesByCharacter: [] };
    component.onDrawAnswerChange(payload);
    expect(wrapper.onDrawAnswerChange).toHaveBeenCalledWith(payload);
  });

  it('should emit drawAnswerChange with null when clearing', () => {
    component.onDrawAnswerChange(null);
    expect(wrapper.onDrawAnswerChange).toHaveBeenCalledWith(null);
  });

  it('should emit timeExpired when onTimeExpired is called', () => {
    component.onTimeExpired();
    expect(wrapper.onTimeExpired).toHaveBeenCalled();
  });

  it('should emit checkAnswer when onCheckAnswer is called', () => {
    component.onCheckAnswer();
    expect(wrapper.onCheckAnswer).toHaveBeenCalled();
  });

  it('should emit nextCard when onNextCard is called', () => {
    component.onNextCard();
    expect(wrapper.onNextCard).toHaveBeenCalled();
  });
});
