import { ComponentFixture, TestBed } from '@angular/core/testing';

import type {
  ContentLanguage,
  UserLanguagePairEntry,
  UserPreferences,
} from '../../../../core/models';
import { CourseCatalogCoursesComponent } from './course-card-list.component';

function makePair(id: string, known: ContentLanguage, learning: ContentLanguage): UserLanguagePairEntry {
  return {
    id,
    pair: { known, learning },
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('CourseCatalogCoursesComponent', () => {
  let fixture: ComponentFixture<CourseCatalogCoursesComponent>;
  let component: CourseCatalogCoursesComponent;

  const defaultPrefs: UserPreferences = {
    theme: 'azure-blue',
    fontSize: 'md',
    colorScheme: 'light',
    cardFocusFullscreen: false,
    learningProficiencyLevel: 'beginner',
    languagePairs: [],
    activeLanguagePairId: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCatalogCoursesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCatalogCoursesComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('displayName', 'Ученик');
    fixture.componentRef.setInput('preferences', defaultPrefs);
    fixture.componentRef.setInput('languagePairs', [makePair('pair-1', 'ru', 'en')]);
    fixture.componentRef.setInput('activeLanguagePairId', 'pair-1');
    fixture.componentRef.setInput('nameDraft', 'Ученик');
    fixture.componentRef.setInput('learningProficiencyDraft', 'beginner');
    fixture.componentRef.setInput('themeDraft', 'azure-blue');
    fixture.componentRef.setInput('fontSizeDraft', 'md');
    fixture.componentRef.setInput('colorSchemeDraft', 'light');
    fixture.componentRef.setInput('cardFocusFullscreenDraft', false);
    fixture.componentRef.setInput('knownLanguageDraft', 'ru');
    fixture.componentRef.setInput('learningLanguageDraft', 'en');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render pair items', () => {
    const list = fixture.nativeElement.querySelector('.page-card__pair-list');
    expect(list).toBeTruthy();

    const items = list.querySelectorAll('.page-card__pair-item');
    expect(items.length).toBe(1);
  });

  it('should show "активный" badge for active pair', () => {
    const badge = fixture.nativeElement.querySelector('.page-card__pair-badge');
    expect(badge?.textContent?.trim()).toBe('активный');
  });

  it('should mark active pair with active class', () => {
    const item = fixture.nativeElement.querySelector('.page-card__pair-item');
    expect(item.classList.contains('page-card__pair-item--active')).toBe(true);
  });

  it('should not emit addPair when languages are the same', () => {
    fixture.componentRef.setInput('knownLanguageDraft', 'en');
    fixture.componentRef.setInput('learningLanguageDraft', 'en');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.page-card__error');
    expect(error?.textContent?.trim()).toBe('Языки должны отличаться.');

    const buttons = fixture.nativeElement.querySelectorAll('button');
    let addBtn: HTMLButtonElement | undefined;
    buttons.forEach((btn: HTMLButtonElement) => {
      if (btn.textContent?.trim() === 'Добавить курс') {
        addBtn = btn;
      }
    });
    expect(addBtn?.disabled).toBe(true);
  });

  it('should emit addPair when languages are different', () => {
    let emitted = false;
    component.addPair.subscribe(() => { emitted = true; });

    fixture.componentRef.setInput('knownLanguageDraft', 'ru');
    fixture.componentRef.setInput('learningLanguageDraft', 'zh');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    let btn: HTMLButtonElement | undefined;
    buttons.forEach((b: HTMLButtonElement) => {
      if (b.textContent?.trim() === 'Добавить курс') {
        btn = b;
      }
    });
    btn!.dispatchEvent(new Event('click'));
    expect(emitted).toBe(true);
  });

  it('should hide remove button when only one pair exists', () => {
    const deleteButtons = fixture.nativeElement.querySelectorAll(
      'button[aria-label="Удалить курс"]',
    );
    expect(deleteButtons.length).toBe(0);
  });

  it('should show remove button when multiple pairs exist', () => {
    fixture.componentRef.setInput('languagePairs', [
      makePair('pair-1', 'ru', 'en'),
      makePair('pair-2', 'en', 'zh'),
    ]);
    fixture.detectChanges();

    const deleteButtons = fixture.nativeElement.querySelectorAll(
      'button[aria-label="Удалить курс"]',
    );
    expect(deleteButtons.length).toBe(2);
  });
});
