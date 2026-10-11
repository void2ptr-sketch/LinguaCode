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
import { describe, expect, it } from 'vitest';

import { CardSelectPageComponent } from './card-select-page.component';
import { CardSelectStore } from '../../services/card-select.store';
import { CardSelectService } from '../../services/card-select.service';
import { CourseSearchService, CardSearchService, ScenarioSearchService } from '../../../../core/repositories';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { cardsApiMockInterceptor } from '../../../../core/api/cards/cards-api.mock.interceptor';
import { coursesApiMockInterceptor } from '../../../../core/api/courses/courses-api.mock.interceptor';
import { scenariosApiMockInterceptor } from '../../../../core/api/scenarios/scenarios-api.mock.interceptor';
import { CardHostComponent } from '../../../../shared/ui/card-host';
import { CoursePickerComponent } from '../../../../shared/ui/course-picker';
import { LessonPickerComponent } from '../../../../shared/ui/lesson-picker';
import { ScenarioPickerComponent } from '../../../../shared/ui/scenario-picker';
import { PracticeSessionBarComponent } from '../practice-session-bar/practice-session-bar.component';
import { PracticeStepperComponent } from '../practice-stepper/practice-stepper.component';

@Component({
  standalone: true,
  imports: [CardSelectPageComponent],
  template: `<app-card-select-page />`,
})
class TestHostComponent {}

describe('CardSelectPageComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    /* silence console.error in tests */

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
        provideHttpClient(withInterceptors([cardsApiMockInterceptor, coursesApiMockInterceptor, scenariosApiMockInterceptor])),
        CardSelectStore,
        CardSelectService,
        CourseSearchService,
        CardSearchService,
        ScenarioSearchService,
        LearningResultsStore,
        UserStore,
      ],
    });
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should have CardSelectStore injected', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.store).toBeDefined();
  });

  it('should have difficultyLabels', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.difficultyLabels).toBeDefined();
  });

  it('should have difficultyLevels', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.difficultyLevels).toEqual(['beginner', 'intermediate', 'advanced']);
  });

  it('should have selectedCourseId signal', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.selectedCourseId()).toBe('');
  });

  it('should have selectedLessonId signal', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.selectedLessonId()).toBe('');
  });

  it('should have currentCourse signal', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.currentCourse()).toBeNull();
  });

  it('should have showDirectionToggle computed', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.showDirectionToggle()).toBe(false);
  });

  it('should have cardProgressPercent computed', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.cardProgressPercent()).toBe(0);
  });

  it('should have canStartPractice computed', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.canStartPractice()).toBe(false);
  });

  it('should have goToTab method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.goToTab).toBeDefined();
    expect(typeof component.goToTab).toBe('function');
  });

  it('should have advanceFromCurrentTab method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.advanceFromCurrentTab).toBeDefined();
    expect(typeof component.advanceFromCurrentTab).toBe('function');
  });

  it('should have startPractice method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.startPractice).toBeDefined();
    expect(typeof component.startPractice).toBe('function');
  });

  it('should have onCourseChange method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.onCourseChange).toBeDefined();
    expect(typeof component.onCourseChange).toBe('function');
  });

  it('should have onLessonChange method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.onLessonChange).toBeDefined();
    expect(typeof component.onLessonChange).toBe('function');
  });

  it('should have onScenarioChange method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.onScenarioChange).toBeDefined();
    expect(typeof component.onScenarioChange).toBe('function');
  });

  it('should have checkAnswer method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.checkAnswer).toBeDefined();
    expect(typeof component.checkAnswer).toBe('function');
  });

  it('should have selectOption method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.selectOption).toBeDefined();
    expect(typeof component.selectOption).toBe('function');
  });

  it('should have setAnswerText method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.setAnswerText).toBeDefined();
    expect(typeof component.setAnswerText).toBe('function');
  });

  it('should have nextCard method', () => {
    const component = fixture.debugElement.children[0].componentInstance as CardSelectPageComponent;
    expect(component.nextCard).toBeDefined();
    expect(typeof component.nextCard).toBe('function');
  });
});
