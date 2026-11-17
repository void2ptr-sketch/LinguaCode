import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { describe, expect, it, beforeEach } from 'vitest';

import { RemovePairDialogComponent } from './remove-pair-dialog.component';
import { LanguageService } from '../services/language.service';
import type { DirectionCardEvent } from './direction-card.component';
import type { LanguageDto } from '../api/language-dto.types';

const mockLanguages: LanguageDto[] = [
  { id: 1, code: 'en', displayName: 'English', nativeName: 'English', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: '', activeFlag: true },
  { id: 2, code: 'ru', displayName: 'Russian', nativeName: 'Русский', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: '', activeFlag: true },
  { id: 3, code: 'zh', displayName: 'Chinese', nativeName: '中文', writingDir: 'ltr', supportsTones: true, supportsPinyin: true, fontFamily: '', activeFlag: true },
];

describe('RemovePairDialogComponent', () => {
  let fixture: ComponentFixture<RemovePairDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemovePairDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        {
          provide: LanguageService,
          useValue: { languages: () => mockLanguages },
        },
      ],
    }).compileComponents();
  });

  function mount(dialogData: DirectionCardEvent) {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: dialogData });
    fixture = TestBed.createComponent(RemovePairDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should render the dialog title', () => {
    mount({ pairId: '1', known: 'en', learning: 'ru' });
    const native = fixture.nativeElement;
    const title = native.querySelector('h2');
    expect(title?.textContent?.trim()).toBe('Удалить направление?');
  });

  it('should render the pair identity with language labels', () => {
    mount({ pairId: '1', known: 'en', learning: 'ru' });
    const native = fixture.nativeElement;
    const pairEl = native.querySelector('.remove-pair-dialog__pair');
    expect(pairEl?.textContent?.trim()).toContain('English');
    expect(pairEl?.textContent?.trim()).toContain('Russian');
  });

  it('should render the hint text', () => {
    mount({ pairId: '1', known: 'en', learning: 'ru' });
    const native = fixture.nativeElement;
    const hint = native.querySelector('.remove-pair-dialog__hint');
    expect(hint?.textContent?.trim()).toBe('Это действие нельзя отменить.');
  });

  it('should show cancel and remove buttons', () => {
    mount({ pairId: '1', known: 'en', learning: 'ru' });
    const native = fixture.nativeElement;
    const buttons = native.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Отмена');
    expect(buttons[1].textContent?.trim()).toBe('Удалить');
  });

  it('should use language code as fallback when label is missing', () => {
    mount({ pairId: '99', known: 'xx', learning: 'yy' });
    const native = fixture.nativeElement;
    const pairEl = native.querySelector('.remove-pair-dialog__pair');
    expect(pairEl?.textContent?.trim()).toContain('xx');
    expect(pairEl?.textContent?.trim()).toContain('yy');
  });

  it('should use language labels when available', () => {
    mount({ pairId: '1', known: 'zh', learning: 'en' });
    const native = fixture.nativeElement;
    const pairEl = native.querySelector('.remove-pair-dialog__pair');
    expect(pairEl?.textContent?.trim()).toContain('Chinese');
    expect(pairEl?.textContent?.trim()).toContain('English');
  });
});
