import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonPickerSectionComponent } from './lesson-picker-section.component';

describe('LessonPickerSectionComponent', () => {
  let component: LessonPickerSectionComponent;
  let fixture: ComponentFixture<LessonPickerSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonPickerSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonPickerSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for inputs', () => {
    expect(component.selectedCourseId).toBe('');
    expect(component.selectedLessonId).toBe('');
    expect(component.enforcePrerequisites).toBe(false);
    expect(component.nextStepHint).toBe('');
    expect(component.canAdvanceFromLessons).toBe(false);
  });

  it('should emit event when onSelectedLessonIdChange is called', () => {
    const spy = vi.spyOn(component.selectedLessonIdChange, 'emit');
    component.onSelectedLessonIdChange('test-lesson-id');
    expect(spy).toHaveBeenCalledWith('test-lesson-id');
  });

  it('should emit event when onLessonPickChange is called', () => {
    const payload = { lessonId: '1', title: 'Test Lesson', scenarioIds: ['s1', 's2'] };
    const spy = vi.spyOn(component.lessonPickChange, 'emit');
    component.onLessonPickChange(payload);
    expect(spy).toHaveBeenCalledWith(payload);
  });

  it('should emit event when onGoToCourse is called', () => {
    const spy = vi.spyOn(component.goToCourse, 'emit');
    component.onGoToCourse();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit event when onNextClick is called', () => {
    const spy = vi.spyOn(component.nextClick, 'emit');
    component.onNextClick();
    expect(spy).toHaveBeenCalled();
  });
});
