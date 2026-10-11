import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LearningProgressComponent } from './learning-progress.component';
import { LearningResultsStore } from '../../../../core/state';

describe('LearningProgressComponent', () => {
  let component: LearningProgressComponent;
  let fixture: ComponentFixture<LearningProgressComponent>;
  let resultsStore: LearningResultsStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningProgressComponent],
      providers: [LearningResultsStore],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningProgressComponent);
    component = fixture.componentInstance;
    resultsStore = TestBed.inject(LearningResultsStore);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject LearningResultsStore', () => {
    // resultsStore is private, but we can verify it exists via the store injection
    expect(resultsStore).toBeDefined();
  });

  it('should expose totalResults from store', () => {
    expect(component.totalResults).toBeDefined();
  });

  it('should expose correctResults from store', () => {
    expect(component.correctResults).toBeDefined();
  });

  it('should expose accuracyPercent from store', () => {
    expect(component.accuracyPercent).toBeDefined();
  });

  it('should expose recentResults from store', () => {
    expect(component.recentResults).toBeDefined();
  });

  it('should expose scenarioProgress from store', () => {
    expect(component.scenarioProgress).toBeDefined();
  });

  it('should expose clearResults method', () => {
    expect(component.clearResults).toBeDefined();
    expect(typeof component.clearResults).toBe('function');
  });

  it('should expose formatDate method', () => {
    expect(component.formatDate).toBeDefined();
    expect(typeof component.formatDate).toBe('function');
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.learning-progress')).toBeTruthy();
  });
});
