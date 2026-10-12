import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CoursePickerSectionComponent } from './course-picker-section.component';
import { CourseSearchService } from '../../../../entities/course';
import { ScenarioSearchService } from '../../../../entities/scenario';

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
  let component: CoursePickerSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        provideRouter([]),
        {
          provide: ScenarioSearchService,
          useValue: {
            search: () => Promise.resolve({ items: [], total: 0, page: 0, pageSize: 10 }),
            getById: () =>
              Promise.resolve(null as unknown as Parameters<ScenarioSearchService['getById']>[0]),
          },
        },
        {
          provide: CourseSearchService,
          useValue: {
            search: () => Promise.resolve({ items: [], total: 0, page: 0, pageSize: 10 }),
            getById: () =>
              Promise.resolve(null as unknown as Parameters<CourseSearchService['getById']>[0]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    wrapper = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance as CoursePickerSectionComponent;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required inputs', () => {
    expect(component.selectedCourseId()).toBe('test-course-id');
    expect(component.courseTitle()).toBe('Test Course Title');
    expect(component.nextStepHint()).toBe('Select a course');
    expect(component.canAdvanceFromCourse()).toBe(true);
  });

  it('should have all outputs defined', () => {
    expect(component.selectedCourseIdChange).toBeDefined();
    expect(component.courseLabelChange).toBeDefined();
    expect(component.nextClick).toBeDefined();
    expect(component.goToScenarios).toBeDefined();
  });

  it('should emit event when onSelectedCourseIdChange is called', () => {
    component.selectedCourseIdChange.emit('new-course-id');
    expect(wrapper.onSelectedCourseIdChange).toHaveBeenCalledWith('new-course-id');
  });

  it('should emit event when onCourseLabelChange is called', () => {
    component.courseLabelChange.emit('New Course Label');
    expect(wrapper.onCourseLabelChange).toHaveBeenCalledWith('New Course Label');
  });

  it('should emit event when onNextClick is called', () => {
    component.nextClick.emit();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });

  it('should emit event when onGoToScenarios is called', () => {
    component.goToScenarios.emit();
    expect(wrapper.onGoToScenarios).toHaveBeenCalled();
  });

  // ─── Handler tests ────────────────────────────────────────────────────

  it('should emit selectedCourseIdChange when onSelectedCourseIdChange is called', () => {
    component.onSelectedCourseIdChange('updated-course-id');
    expect(wrapper.onSelectedCourseIdChange).toHaveBeenCalledWith('updated-course-id');
  });

  it('should emit courseLabelChange when onCourseLabelChange is called', () => {
    component.onCourseLabelChange('Updated Label');
    expect(wrapper.onCourseLabelChange).toHaveBeenCalledWith('Updated Label');
  });

  it('should emit nextClick when onNextClick is called', () => {
    component.onNextClick();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });

  it('should emit goToScenarios when onGoToScenarios is called', () => {
    component.onGoToScenarios();
    expect(wrapper.onGoToScenarios).toHaveBeenCalled();
  });
});
