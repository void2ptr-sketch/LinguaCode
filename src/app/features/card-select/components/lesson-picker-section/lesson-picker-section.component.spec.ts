import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonPickerSectionComponent } from './lesson-picker-section.component';
import { CourseSearchService } from '../../../../entities/course';

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
  let component: LessonPickerSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        // The nested lesson picker loads the course on init. Stub the course
        // service so the unit test does not perform real HTTP requests.
        {
          provide: CourseSearchService,
          useValue: {
            getById: vi.fn().mockResolvedValue({
              id: 'test-course-id',
              title: 'Test Course',
              description: '',
              authorId: 'author-1',
              languagePair: { known: 'ru', learning: 'zh' },
              lessonIds: [],
              published: true,
              updatedAt: '2024-01-01T00:00:00.000Z',
              lessons: [],
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    wrapper = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance as LessonPickerSectionComponent;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required inputs', () => {
    expect(component.selectedCourseId()).toBe('test-course-id');
    expect(component.selectedLessonId()).toBe('');
    expect(component.enforcePrerequisites()).toBe(false);
    expect(component.nextStepHint()).toBe('Select a lesson');
    expect(component.canAdvanceFromLessons()).toBe(false);
  });

  it('should have all outputs defined', () => {
    expect(component.selectedLessonIdChange).toBeDefined();
    expect(component.lessonPickChange).toBeDefined();
    expect(component.goToCourse).toBeDefined();
    expect(component.nextClick).toBeDefined();
  });

  it('should emit event when onSelectedLessonIdChange is called', () => {
    component.selectedLessonIdChange.emit('test-lesson-id');
    expect(wrapper.onSelectedLessonIdChange).toHaveBeenCalledWith('test-lesson-id');
  });

  it('should emit event when onLessonPickChange is called', () => {
    component.lessonPickChange.emit({
      lessonId: '1',
      title: 'Test Lesson',
      scenarioIds: ['s1', 's2'],
    });
    expect(wrapper.onLessonPickChange).toHaveBeenCalledWith({
      lessonId: '1',
      title: 'Test Lesson',
      scenarioIds: ['s1', 's2'],
    });
  });

  it('should emit event when onGoToCourse is called', () => {
    component.goToCourse.emit();
    expect(wrapper.onGoToCourse).toHaveBeenCalled();
  });

  it('should emit event when onNextClick is called', () => {
    component.nextClick.emit();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });

  // ─── Handler tests ────────────────────────────────────────────────────

  it('should emit selectedLessonIdChange when onSelectedLessonIdChange is called', () => {
    component.onSelectedLessonIdChange('new-lesson-id');
    expect(wrapper.onSelectedLessonIdChange).toHaveBeenCalledWith('new-lesson-id');
  });

  it('should emit lessonPickChange when onLessonPickChange is called', () => {
    component.onLessonPickChange({ lessonId: 'l2', title: 'Another Lesson', scenarioIds: ['s3'] });
    expect(wrapper.onLessonPickChange).toHaveBeenCalledWith({
      lessonId: 'l2',
      title: 'Another Lesson',
      scenarioIds: ['s3'],
    });
  });

  it('should emit goToCourse when onGoToCourse is called', () => {
    component.onGoToCourse();
    expect(wrapper.onGoToCourse).toHaveBeenCalled();
  });

  it('should emit nextClick when onNextClick is called', () => {
    component.onNextClick();
    expect(wrapper.onNextClick).toHaveBeenCalled();
  });
});
