import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonPickerSectionComponent } from './lesson-picker-section.component';

@Component({
  standalone: true,
  imports: [LessonPickerSectionComponent],
  template: `
    <app-lesson-picker-section
      [selectedCourseId]="selectedCourseId"
      [selectedLessonId]="selectedLessonId"
      [enforcePrerequisites]="enforcePrerequisites"
      [nextStepHint]="nextStepHint"
      [canAdvanceFromLessons]="canAdvanceFromLessons"
      (selectedLessonIdChange)="onSelectedLessonIdChange($event)"
      (lessonPickChange)="onLessonPickChange($event)"
      (goToCourse)="onGoToCourse()"
      (nextClick)="onNextClick()"
    />
  `,
})
class WrapperComponent {
  selectedCourseId = 'test-course-id';
  selectedLessonId = '';
  enforcePrerequisites = false;
  nextStepHint = 'Select a lesson';
  canAdvanceFromLessons = false;

  onSelectedLessonIdChange = vi.fn();
  onLessonPickChange = vi.fn();
  onGoToCourse = vi.fn();
  onNextClick = vi.fn();
}

describe('LessonPickerSectionComponent', () => {
  let wrapper: WrapperComponent;
  let fixture: ComponentFixture<WrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    wrapper = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    const component = fixture.debugElement.children[0].componentInstance as LessonPickerSectionComponent;
    expect(component).toBeTruthy();
  });

  it('should emit event when onSelectedLessonIdChange is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as LessonPickerSectionComponent;
    component.selectedLessonIdChange.emit('test-lesson-id');
    expect(wrapper.onSelectedLessonIdChange).toHaveBeenCalledWith('test-lesson-id');
  });

  it('should emit event when onLessonPickChange is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as LessonPickerSectionComponent;
    component.lessonPickChange.emit({ lessonId: '1', title: 'Test Lesson', scenarioIds: ['s1', 's2'] });
    expect(wrapper.onLessonPickChange).toHaveBeenCalledWith({ lessonId: '1', title: 'Test Lesson', scenarioIds: ['s1', 's2'] });
  });

  it('should emit event when onGoToCourse is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as LessonPickerSectionComponent;
    component.goToCourse.emit();
    expect(wrapper.onGoToCourse).toHaveBeenCalled();
  });

  it('should emit event when onNextClick is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as LessonPickerSectionComponent;
    component.nextClick.emit();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });
});
