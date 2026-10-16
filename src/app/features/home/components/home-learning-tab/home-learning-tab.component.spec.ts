import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { HomeLearningTabComponent } from './home-learning-tab.component';
import { LearningDashboardService } from '../../../../entities/learning/services';
import { LearningResultsStore } from '../../../../entities/learning/model/learning-results.store';

describe('HomeLearningTabComponent', () => {
  let component: HomeLearningTabComponent;
  let fixture: ComponentFixture<HomeLearningTabComponent>;
  let dashboard: LearningDashboardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeLearningTabComponent],
      providers: [LearningDashboardService, LearningResultsStore, provideRouter([])],
    }).compileComponents();

    dashboard = TestBed.inject(LearningDashboardService);
    fixture = TestBed.createComponent(HomeLearningTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject LearningDashboardService', () => {
    expect(dashboard).toBeDefined();
  });

  it('should expose loading', () => {
    expect(component.loading).toBeDefined();
  });

  it('should expose error', () => {
    expect(component.error).toBeDefined();
  });

  it('should expose course', () => {
    expect(component.course).toBeDefined();
  });

  it('should expose resumeTarget', () => {
    expect(component.resumeTarget).toBeDefined();
  });

  it('should expose roadmap', () => {
    expect(component.roadmap).toBeDefined();
  });

  it('should expose courseProgress', () => {
    expect(component.courseProgress).toBeDefined();
  });

  it('should expose displayName', () => {
    expect(component.displayName).toBeDefined();
  });

  it('should expose languagePairLabel', () => {
    expect(component.languagePairLabel).toBeDefined();
  });

  it('should expose accuracyPercent', () => {
    expect(component.accuracyPercent).toBeDefined();
  });

  it('should expose totalResults', () => {
    expect(component.totalResults).toBeDefined();
  });

  it('should expose retryLoad method', () => {
    expect(component.retryLoad).toBeDefined();
    expect(typeof component.retryLoad).toBe('function');
  });

  it('should expose continueQueryParams computed', () => {
    expect(component.continueQueryParams).toBeDefined();
  });

  it('should expose continueLabel computed', () => {
    expect(component.continueLabel).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.home-learning-tab')).toBeTruthy();
  });
});
