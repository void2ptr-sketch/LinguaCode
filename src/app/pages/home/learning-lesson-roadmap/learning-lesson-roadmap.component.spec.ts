import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LearningLessonRoadmapComponent } from './learning-lesson-roadmap.component';
import type { LessonRoadmapItem } from '../../../entities/learning/lib/learning-resume.utils';

@Component({
  standalone: true,
  imports: [LearningLessonRoadmapComponent],
  template: `<app-learning-lesson-roadmap [items]="items" [courseId]="courseId" />`,
})
class TestHostComponent {
  items: readonly LessonRoadmapItem[] = [];
  courseId = 'course-123';
}

describe('LearningLessonRoadmapComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, LearningLessonRoadmapComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have items input', () => {
    expect(component.items).toBeDefined();
  });

  it('should have courseId input', () => {
    expect(component.courseId).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('app-learning-lesson-roadmap')).toBeTruthy();
  });
});
