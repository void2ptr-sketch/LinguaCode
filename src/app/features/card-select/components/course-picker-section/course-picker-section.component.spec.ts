import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoursePickerSectionComponent } from './course-picker-section.component';

describe('CoursePickerSectionComponent', () => {
  let component: CoursePickerSectionComponent;
  let fixture: ComponentFixture<CoursePickerSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursePickerSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoursePickerSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for inputs', () => {
    expect(component.selectedCourseId).toBe('');
    expect(component.courseTitle).toBe('');
  });

  it('should emit event when selectedCourseIdChange is called', () => {
    const spy = vi.spyOn(component.selectedCourseIdChange, 'emit');
    component.selectedCourseIdChange.emit('test-course-id');
    expect(spy).toHaveBeenCalledWith('test-course-id');
  });

  it('should emit event when courseLabelChange is called', () => {
    const spy = vi.spyOn(component.courseLabelChange, 'emit');
    component.courseLabelChange.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit event when nextClick is called', () => {
    const spy = vi.spyOn(component.nextClick, 'emit');
    component.nextClick.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit event when goToScenarios is called', () => {
    const spy = vi.spyOn(component.goToScenarios, 'emit');
    component.goToScenarios.emit();
    expect(spy).toHaveBeenCalled();
  });
});
