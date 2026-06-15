import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourseDisplaySettingsMatrixComponent } from './course-display-settings-matrix.component';

describe('CourseDisplaySettingsMatrixComponent', () => {
  let fixture: ComponentFixture<CourseDisplaySettingsMatrixComponent>;
  let component: CourseDisplaySettingsMatrixComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseDisplaySettingsMatrixComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseDisplaySettingsMatrixComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('showCjk', true);
    fixture.componentRef.setInput('romanizationOptions', [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'palladius', label: 'Палладица' },
    ]);
    fixture.componentRef.setInput('displayRomanizations', ['pinyin', 'palladius']);
    fixture.componentRef.setInput('answerRomanizations', ['pinyin', 'palladius']);
    fixture.detectChanges();
  });

  it('should uncheck pinyin in prompt without disabling palladius row', () => {
    component.onPromptRomanizationClick('pinyin', new MouseEvent('click'));

    expect(component.displayRomanizations()).toEqual(['palladius']);
    expect(component.isPromptRomanizationEnabled('palladius')).toBeTrue();
    expect(component.isPromptRomanizationEnabled('pinyin')).toBeFalse();
  });

  it('should keep answer column unchanged when prompt column toggles', () => {
    component.onPromptRomanizationClick('pinyin', new MouseEvent('click'));

    expect(component.answerRomanizations()).toEqual(['pinyin', 'palladius']);
  });
});
