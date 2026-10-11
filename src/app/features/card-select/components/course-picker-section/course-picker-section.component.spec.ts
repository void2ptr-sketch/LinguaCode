import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CoursePickerSectionComponent } from './course-picker-section.component';
import { CourseSearchService, ScenarioSearchService } from '../../../../core/repositories';

@Component({
  standalone: true,
  imports: [CoursePickerSectionComponent],
  template: `
    <app-course-picker-section
      [selectedCourseId]="selectedCourseId"
      [courseTitle]="courseTitle"
      [nextStepHint]="nextStepHint"
      [canAdvanceFromCourse]="canAdvanceFromCourse"
      (selectedCourseIdChange)="onSelectedCourseIdChange($event)"
      (courseLabelChange)="onCourseLabelChange($event)"
      (nextClick)="onNextClick()"
      (goToScenarios)="onGoToScenarios()"
    />
  `,
})
class WrapperComponent {
  selectedCourseId = 'test-course-id';
  courseTitle = 'Test Course Title';
  nextStepHint = 'Select a course';
  canAdvanceFromCourse = true;

  onSelectedCourseIdChange = vi.fn();
  onCourseLabelChange = vi.fn();
  onNextClick = vi.fn();
  onGoToScenarios = vi.fn();
}

describe('CoursePickerSectionComponent', () => {
  let wrapper: WrapperComponent;
  let fixture: ComponentFixture<WrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        provideRouter([]),
        {
          provide: ScenarioSearchService,
          useValue: {
            search: () => Promise.resolve({ items: [], total: 0, page: 0, pageSize: 10 }),
            getById: () => Promise.resolve(null as unknown as Parameters<ScenarioSearchService['getById']>[0]),
          },
        },
        {
          provide: CourseSearchService,
          useValue: {
            search: () => Promise.resolve({ items: [], total: 0, page: 0, pageSize: 10 }),
            getById: () => Promise.resolve(null as unknown as Parameters<CourseSearchService['getById']>[0]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    wrapper = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    const component = fixture.debugElement.children[0].componentInstance as CoursePickerSectionComponent;
    expect(component).toBeTruthy();
  });

  it('should emit event when onSelectedCourseIdChange is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as CoursePickerSectionComponent;
    component.selectedCourseIdChange.emit('new-course-id');
    expect(wrapper.onSelectedCourseIdChange).toHaveBeenCalledWith('new-course-id');
  });

  it('should emit event when onCourseLabelChange is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as CoursePickerSectionComponent;
    component.courseLabelChange.emit('New Course Label');
    expect(wrapper.onCourseLabelChange).toHaveBeenCalledWith('New Course Label');
  });

  it('should emit event when onNextClick is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as CoursePickerSectionComponent;
    component.nextClick.emit();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });

  it('should emit event when onGoToScenarios is called', () => {
    const component = fixture.debugElement.children[0].componentInstance as CoursePickerSectionComponent;
    component.goToScenarios.emit();
    expect(wrapper.onGoToScenarios).toHaveBeenCalled();
  });
});
