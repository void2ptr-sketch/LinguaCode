import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { CardSelectPageComponent } from './card-select-page.component';
import { CardSelectStore } from '../../../features/card-select/services/card-select.store';
import { CardSelectService } from '../../../features/card-select/services/card-select.service';
import { CardSelectFlowService } from '../../../features/card-select/services/card-select-flow.service';
import { CourseSearchService } from '../../../entities/course';
import { CardSearchService } from '../../../entities/card';
import { ScenarioSearchService } from '../../../entities/scenario';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { UserStore } from '../../../entities/user/model/user.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { cardsApiMockInterceptor } from '../../../entities/card/api/mock/cards-api.mock.interceptor';
import { coursesApiMockInterceptor } from '../../../entities/course/api/mock/courses-api.mock.interceptor';
import { scenariosApiMockInterceptor } from '../../../entities/scenario/api/mock/scenarios-api.mock.interceptor';
import { CardHostComponent } from '../../../entities/card/ui/card-host';
import { CoursePickerComponent } from '../../../entities/course/ui/course-picker';
import { LessonPickerComponent } from '../../../entities/lesson/ui/lesson-picker';
import { ScenarioPickerComponent } from '../../../entities/scenario/ui/scenario-picker';
import { PracticeSessionBarComponent } from '../../../features/card-select/components/practice-session-bar/practice-session-bar.component';
import { PracticeStepperComponent } from '../../../features/card-select/components/practice-stepper/practice-stepper.component';

@Component({
  standalone: true,
  imports: [CardSelectPageComponent],
  template: `<app-card-select-page />`,
})
class TestHostComponent {}

describe('CardSelectPageComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: CardSelectPageComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        CardSelectPageComponent,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatChipsModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        CardHostComponent,
        CoursePickerComponent,
        LessonPickerComponent,
        ScenarioPickerComponent,
        PracticeSessionBarComponent,
        PracticeStepperComponent,
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([
            cardsApiMockInterceptor,
            coursesApiMockInterceptor,
            scenariosApiMockInterceptor,
          ]),
        ),
        CardSelectStore,
        CardSelectService,
        CardSelectFlowService,
        CourseSearchService,
        CardSearchService,
        ScenarioSearchService,
        LearningResultsStore,
        UserStore,
        AppLoggerService,
      ],
    });

    localStorage.clear();
    sessionStorage.clear();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should have CardSelectStore injected', () => {
    expect(component.store).toBeDefined();
  });

  it('should have CardSelectFlowService injected', () => {
    expect(component.flow).toBeDefined();
  });

  it('should have difficultyLabels', () => {
    expect(component.difficultyLabels).toBeDefined();
  });

  it('should have difficultyLevels', () => {
    expect(component.difficultyLevels).toEqual(['beginner', 'intermediate', 'advanced']);
  });

  it('should have selectedCourseId signal', () => {
    expect(component.selectedCourseId()).toBe('');
  });

  it('should have selectedLessonId signal', () => {
    expect(component.selectedLessonId()).toBe('');
  });

  it('should have currentCourse signal', () => {
    expect(component.currentCourse()).toBeNull();
  });

  it('should have showDirectionToggle computed', () => {
    expect(component.showDirectionToggle()).toBe(false);
  });

  it('should have cardProgressPercent computed', () => {
    expect(component.cardProgressPercent()).toBe(0);
  });

  it('should have canStartPractice computed', () => {
    expect(component.canStartPractice()).toBe(false);
  });

  it('should have nextStepHint computed', () => {
    expect(component.nextStepHint()).toBe('Выберите программу, чтобы продолжить');
  });

  it('should have sessionSegments computed', () => {
    const segments = component.sessionSegments();
    expect(segments).toHaveLength(3);
    expect(segments[0].label).toBe('Программа');
    expect(segments[1].label).toBe('Урок');
    expect(segments[2].label).toBe('Сценарий');
  });

  it('should have practiceSteps computed', () => {
    const steps = component.practiceSteps();
    expect(steps).toHaveLength(4);
    expect(steps[0].label).toBe('Программа');
    expect(steps[1].label).toBe('Урок');
    expect(steps[2].label).toBe('Сценарий');
    expect(steps[3].label).toBe('Обучение');
  });

  it('should have courseCompleted computed', () => {
    expect(component.courseCompleted()).toBe(false);
  });

  it('should have showCourseCertificate computed', () => {
    expect(component.showCourseCertificate()).toBe(false);
  });

  it('should have hasNextLessonScenario computed', () => {
    expect(component.hasNextLessonScenario()).toBe(false);
  });

  it('should have allowedScenarioIdsForPicker returning null when no scenarios', () => {
    expect(component.allowedScenarioIdsForPicker()).toBeNull();
  });

  // ─── goToTab ──────────────────────────────────────────────────────────

  it('should navigate to lessons tab when course is selected', () => {
    component.selectedCourseId.set('test-course');
    component.goToTab(1);
    expect(component.activeTabIndex()).toBe(1);
  });

  it('should not navigate to lessons tab when no course is selected', () => {
    component.selectedCourseId.set('');
    component.activeTabIndex.set(0);
    component.goToTab(1);
    expect(component.activeTabIndex()).toBe(0);
  });

  it('should navigate to learning tab when scenario is selected', () => {
    component.selectedScenarioId.set('test-scenario');
    component.goToTab(3);
    expect(component.activeTabIndex()).toBe(3);
  });

  it('should not navigate to learning tab when no scenario is selected', () => {
    component.selectedScenarioId.set('');
    component.activeTabIndex.set(2);
    component.goToTab(3);
    expect(component.activeTabIndex()).toBe(2);
  });

  it('should navigate to course tab', () => {
    component.activeTabIndex.set(2);
    component.goToTab(0);
    expect(component.activeTabIndex()).toBe(0);
  });

  it('should navigate to scenarios tab', () => {
    component.activeTabIndex.set(1);
    component.goToTab(2);
    expect(component.activeTabIndex()).toBe(2);
  });

  // ─── advanceFromCurrentTab ────────────────────────────────────────────

  it('should start practice from scenarios tab', () => {
    component.selectedScenarioId.set('test-scenario');
    component.activeTabIndex.set(2);
    component.advanceFromCurrentTab();
    expect(component.activeTabIndex()).toBe(3);
  });

  it('should not start practice from scenarios tab when no scenario selected', () => {
    component.selectedScenarioId.set('');
    component.activeTabIndex.set(2);
    component.advanceFromCurrentTab();
    expect(component.activeTabIndex()).toBe(2);
  });

  it('should advance from course tab to lessons tab', () => {
    component.selectedCourseId.set('test-course');
    component.activeTabIndex.set(0);
    component.advanceFromCurrentTab();
    expect(component.activeTabIndex()).toBe(1);
  });

  it('should advance from course tab to scenarios tab for open practice without lesson requirement', () => {
    component.selectedCourseId.set('test-course');
    component.activeTabIndex.set(0);
    component.currentCourse.set({
      id: 'test',
      title: 'Test',
      lessons: [],
      lessonIds: ['lesson-1'],
      description: 'Test course',
      authorId: 'u1',
      published: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
      practiceSettings: {
        mode: 'open',
        allowDifficultyFilter: true,
        enforceLessonPrerequisites: true,
        requireLessonForScenarios: false,
      },
    });
    component.advanceFromCurrentTab();
    expect(component.activeTabIndex()).toBe(2);
  });

  it('should advance from lessons tab to scenarios tab', () => {
    component.selectedCourseId.set('test-course');
    component.selectedLessonId.set('test-lesson');
    component.activeTabIndex.set(1);
    component.advanceFromCurrentTab();
    expect(component.activeTabIndex()).toBe(2);
  });

  it('should not advance from lessons tab when no lesson selected', () => {
    component.selectedCourseId.set('test-course');
    component.selectedLessonId.set('');
    component.activeTabIndex.set(1);
    component.advanceFromCurrentTab();
    expect(component.activeTabIndex()).toBe(1);
  });

  // ─── startPractice ────────────────────────────────────────────────────

  it('should start practice when scenario is selected', () => {
    component.selectedScenarioId.set('test-scenario');
    component.activeTabIndex.set(2);
    component.startPractice();
    expect(component.activeTabIndex()).toBe(3);
  });

  it('should not start practice when no scenario is selected', () => {
    component.selectedScenarioId.set('');
    component.activeTabIndex.set(2);
    component.startPractice();
    expect(component.activeTabIndex()).toBe(2);
  });

  // ─── onCourseLabelChange ──────────────────────────────────────────────

  it('should extract course title from label with separator', () => {
    component.onCourseLabelChange('My Course · Part 2');
    expect(component.courseTitle()).toBe('My Course');
  });

  it('should use full label when no separator present', () => {
    component.onCourseLabelChange('My Course');
    expect(component.courseTitle()).toBe('My Course');
  });

  // ─── onLessonChange ───────────────────────────────────────────────────

  it('should reset scenario and store on lesson change', async () => {
    component.selectedScenarioId.set('old-scenario');
    component.scenarioTitle.set('Old Scenario');
    component.scenarioSourceLabel.set('Old Source');
    component.store.setScenario('old-scenario', []);
    await component.onLessonChange('new-lesson');
    expect(component.selectedLessonId()).toBe('new-lesson');
    expect(component.selectedScenarioId()).toBe('');
    expect(component.scenarioTitle()).toBe('');
    expect(component.scenarioSourceLabel()).toBe('');
  });

  // ─── onLessonPick ─────────────────────────────────────────────────────

  it('should set lesson title and scenario IDs on pick', async () => {
    await component.onLessonPick({
      lessonId: 'l1',
      title: 'Test Lesson',
      scenarioIds: ['s1', 's2'],
    });
    expect(component.lessonTitle()).toBe('Test Lesson');
    expect(component.lessonScenarioIds()).toEqual(['s1', 's2']);
  });

  // ─── onScenarioChange ─────────────────────────────────────────────────

  it('should reset state when scenario is deselected', async () => {
    component.scenarioTitle.set('Old Title');
    component.scenarioSourceLabel.set('Old Source');
    component.store.setScenario('old-scenario', []);
    await component.onScenarioChange('');
    expect(component.selectedScenarioId()).toBe('');
    expect(component.scenarioTitle()).toBe('');
    expect(component.scenarioSourceLabel()).toBe('');
  });

  // ─── onScenarioLabelChange ────────────────────────────────────────────

  it('should extract source label from label with separator', () => {
    component.onScenarioLabelChange('Scenario Name · 10 cards');
    expect(component.scenarioSourceLabel()).toBe('10 cards');
  });

  it('should use full label when no separator present', () => {
    component.onScenarioLabelChange('No Separator');
    expect(component.scenarioSourceLabel()).toBe('No Separator');
  });

  // ─── onDifficultyChange ───────────────────────────────────────────────

  it('should reset scenario and store on difficulty change', async () => {
    component.selectedScenarioId.set('old-scenario');
    component.scenarioTitle.set('Old Title');
    component.scenarioSourceLabel.set('Old Source');
    component.store.setScenario('old-scenario', []);
    component.onDifficultyChange('beginner');
    expect(component.selectedDifficulty()).toBe('beginner');
    expect(component.selectedScenarioId()).toBe('');
    expect(component.scenarioTitle()).toBe('');
    expect(component.scenarioSourceLabel()).toBe('');
  });

  it('should clear difficulty filter when null', () => {
    component.selectedDifficulty.set('beginner');
    component.onDifficultyChange(null);
    expect(component.selectedDifficulty()).toBeNull();
  });

  // ─── goToNextLessonScenario ───────────────────────────────────────────

  it('should advance to next scenario and load cards', async () => {
    component.selectedCourseId.set('test-course');
    component.selectedLessonId.set('test-lesson');
    component.flow.onLessonPick({
      lessonId: 'test-lesson',
      title: 'Test Lesson',
      scenarioIds: ['s1', 's2', 's3'],
    });
    component.selectedScenarioId.set('s1');
    component.store.setScenario('s1', []);

    vi.spyOn(component, 'loadCards').mockResolvedValue(undefined);
    vi.spyOn(component as any, 'persistLearningSession').mockReturnValue(undefined);
    await component.goToNextLessonScenario();

    expect(component.activeTabIndex()).toBe(3);
    expect(component.selectedScenarioId()).toBe('s2');
    expect(component.loadCards).toHaveBeenCalled();
  });

  it('should not advance when no next scenario exists', async () => {
    component.flow.onLessonPick({
      lessonId: 'test-lesson',
      title: 'Test Lesson',
      scenarioIds: ['s1'],
    });
    component.selectedScenarioId.set('s1');

    vi.spyOn(component, 'loadCards').mockResolvedValue(undefined);
    vi.spyOn(component as any, 'persistLearningSession').mockReturnValue(undefined);
    await component.goToNextLessonScenario();

    expect(component.activeTabIndex()).toBe(0);
    expect(component.loadCards).not.toHaveBeenCalled();
  });

  // ─── selectOption ─────────────────────────────────────────────────────

  it('should delegate selectOption to store', () => {
    const spy = vi.spyOn(component.store, 'selectOption');
    component.selectOption(2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  // ─── setAnswerText ────────────────────────────────────────────────────

  it('should delegate setAnswerText to store', () => {
    const spy = vi.spyOn(component.store, 'setAnswerText');
    component.setAnswerText('hello');
    expect(spy).toHaveBeenCalledWith('hello');
  });

  // ─── setMemoryComplete ────────────────────────────────────────────────

  it('should delegate setMemoryComplete to store', () => {
    const spy = vi.spyOn(component.store, 'setMemoryComplete');
    component.setMemoryComplete(true);
    expect(spy).toHaveBeenCalledWith(true);
  });

  // ─── setDrawSubmitted ─────────────────────────────────────────────────

  it('should delegate setDrawSubmitted to store', () => {
    const spy = vi.spyOn(component.store, 'setDrawSubmitted');
    component.setDrawSubmitted(true);
    expect(spy).toHaveBeenCalledWith(true);
  });

  // ─── setDrawAnswer ────────────────────────────────────────────────────

  it('should delegate setDrawAnswer to store', () => {
    const spy = vi.spyOn(component.store, 'setDrawAnswer');
    const payload = {
      canvasMode: 'memory' as const,
      canvasSize: { width: 100, height: 100 },
      strokesByCharacter: [],
    };
    component.setDrawAnswer(payload);
    expect(spy).toHaveBeenCalledWith(payload);
  });

  // ─── handleTimeExpired ────────────────────────────────────────────────

  it('should delegate handleTimeExpired to store', () => {
    const spy = vi.spyOn(component.store, 'handleTimeExpired');
    component.handleTimeExpired();
    expect(spy).toHaveBeenCalled();
  });

  // ─── onDirectionChange ────────────────────────────────────────────────

  it('should delegate onDirectionChange to store', () => {
    const spy = vi.spyOn(component.store, 'setSessionDirection');
    component.onDirectionChange('learning-to-known');
    expect(spy).toHaveBeenCalledWith('learning-to-known');
  });

  // ─── nextCard ─────────────────────────────────────────────────────────

  it('should delegate nextCard to store', () => {
    const spy = vi.spyOn(component.store, 'nextCard');
    component.nextCard();
    expect(spy).toHaveBeenCalled();
  });
});
