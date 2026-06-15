import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxChange } from '@angular/material/checkbox';
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

  it('should emit prompt romanization changes to parent', () => {
    let emitted: readonly string[] | undefined;
    component.displayRomanizationsChange.subscribe((value) => {
      emitted = value;
    });

    component.onPromptRomanizationChange('pinyin', { checked: false } as MatCheckboxChange);

    expect(emitted).toEqual(['palladius']);
  });

  it('should emit answer column unchanged when prompt column toggles', () => {
    let answerEmitted: readonly string[] | undefined;
    component.answerRomanizationsChange.subscribe((value) => {
      answerEmitted = value;
    });

    component.onPromptRomanizationChange('pinyin', { checked: false } as MatCheckboxChange);

    expect(answerEmitted).toBeUndefined();
  });
});
