import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LearningProgramProgressComponent } from './learning-program-progress.component';

@Component({
  standalone: true,
  imports: [LearningProgramProgressComponent],
  template: `<app-learning-program-progress [courseTitle]="courseTitle" [completed]="completed" [total]="total" [percent]="percent" />`,
})
class TestHostComponent {
  courseTitle = 'Test Course';
  completed = 10;
  total = 50;
  percent = 20;
}

describe('LearningProgramProgressComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, LearningProgramProgressComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have courseTitle input', () => {
    expect(component.courseTitle).toBeDefined();
  });

  it('should have completed input', () => {
    expect(component.completed).toBeDefined();
  });

  it('should have total input', () => {
    expect(component.total).toBeDefined();
  });

  it('should have percent input', () => {
    expect(component.percent).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('app-learning-program-progress')).toBeTruthy();
  });
});
