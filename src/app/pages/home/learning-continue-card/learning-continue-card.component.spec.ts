import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LearningContinueCardComponent } from './learning-continue-card.component';

@Component({
  standalone: true,
  imports: [LearningContinueCardComponent],
  template: `<app-learning-continue-card [label]="label" [resumeTarget]="resumeTarget" [continueQueryParams]="continueQueryParams" />`,
})
class TestHostComponent {
  label = 'Test Label';
  resumeTarget = null;
  continueQueryParams = null;
}

describe('LearningContinueCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, LearningContinueCardComponent],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.learning-continue-card')).toBeTruthy();
  });
});
