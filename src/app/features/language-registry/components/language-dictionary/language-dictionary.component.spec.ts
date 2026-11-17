import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { LanguageDictionaryComponent } from './language-dictionary.component';
import { LanguageApiService } from '../../../../entities/language-pair/api/language-api.service';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import type { LanguageDto } from '../../../../entities/language-pair/api/language-dto.types';

describe('LanguageDictionaryComponent', () => {
  let component: LanguageDictionaryComponent;
  let fixture: ComponentFixture<LanguageDictionaryComponent>;
  let languageApiSpy: {
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };
  let languageService: LanguageService;

  const mockLanguages: LanguageDto[] = [
    {
      id: 1,
      code: 'en',
      displayName: 'English',
      nativeName: 'English',
      writingDir: 'ltr',
      supportsTones: false,
      supportsPinyin: false,
      fontFamily: 'Noto Sans',
      activeFlag: true,
    },
    {
      id: 2,
      code: 'ru',
      displayName: 'Russian',
      nativeName: 'Русский',
      writingDir: 'ltr',
      supportsTones: false,
      supportsPinyin: false,
      fontFamily: 'Noto Sans',
      activeFlag: false,
    },
  ];

  const createdLanguage: LanguageDto = {
    id: 3,
    code: 'de',
    displayName: 'German',
    nativeName: 'Deutsch',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  };

  beforeEach(async () => {
    languageApiSpy = {
      update: vi.fn().mockImplementation((id: number, payload: { activeFlag: boolean }) => {
        const lang = mockLanguages.find((l) => l.id === id);
        return Promise.resolve({ ...lang!, activeFlag: payload.activeFlag });
      }),
      create: vi.fn().mockResolvedValue(createdLanguage),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    snackBarSpy = { open: vi.fn() };

    TestBed.configureTestingModule({
      imports: [
        LanguageDictionaryComponent,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatIconModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatTooltipModule,
      ],
      providers: [
        { provide: LanguageApiService, useValue: languageApiSpy },
        {
          provide: LanguageService,
          useValue: {
            languages: vi.fn(() => mockLanguages),
            loading: vi.fn(() => false),
            load: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    fixture = TestBed.createComponent(LanguageDictionaryComponent);
    component = fixture.componentInstance;
    languageService = TestBed.inject(LanguageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have loading getter', () => {
    expect(component.loading).toBeDefined();
    expect(typeof component.loading).toBe('function');
  });

  it('should have creating signal', () => {
    expect(component.creating).toBeDefined();
    expect(typeof component.creating).toBe('function');
  });

  it('should have languages method', () => {
    expect(component.languages).toBeDefined();
    expect(typeof component.languages).toBe('function');
  });

  it('should have toggleActiveLanguage method', () => {
    expect(component.toggleActiveLanguage).toBeDefined();
    expect(typeof component.toggleActiveLanguage).toBe('function');
  });

  it('should have createLanguage method', () => {
    expect(component.createLanguage).toBeDefined();
    expect(typeof component.createLanguage).toBe('function');
  });

  it('should have deleteLanguage method', () => {
    expect(component.deleteLanguage).toBeDefined();
    expect(typeof component.deleteLanguage).toBe('function');
  });

  it('should load languages on init', () => {
    expect(languageService.load).toHaveBeenCalled();
  });

  it('should return languages from languageService', () => {
    const langs = component.languages();
    expect(langs).toEqual(mockLanguages);
  });

  it('should toggle active flag optimistic on success', async () => {
    const lang = { ...mockLanguages[0] };
    expect(lang.activeFlag).toBe(true);

    component.toggleActiveLanguage(lang);
    expect(lang.activeFlag).toBe(false);

    // Wait for the async update to complete
    await new Promise((r) => setTimeout(r, 100));

    expect(languageApiSpy.update).toHaveBeenCalledWith(1, { activeFlag: false });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Язык «English» деактивирован', 'Закрыть', {
      duration: 3000,
    });
  });

  it('should rollback on toggle failure', async () => {
    const lang = { ...mockLanguages[0] };
    languageApiSpy.update.mockRejectedValue({ status: 500, message: 'Server error' });

    component.toggleActiveLanguage(lang);
    expect(lang.activeFlag).toBe(false);

    await new Promise((r) => setTimeout(r, 100));

    expect(lang.activeFlag).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Не удалось обновить язык: Server error',
      'Закрыть',
      { duration: 5000 },
    );
  });

  it('should show session expired message on 403', async () => {
    const lang = { ...mockLanguages[0] };
    languageApiSpy.update.mockRejectedValue({ status: 403, message: 'Forbidden' });

    component.toggleActiveLanguage(lang);

    await new Promise((r) => setTimeout(r, 100));

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Сессия истекла или доступ запрещён. Обновите страницу и повторите.',
      'Закрыть',
      { duration: 5000 },
    );
  });

  it('should activate inactive language', async () => {
    const lang = { ...mockLanguages[1] };
    expect(lang.activeFlag).toBe(false);

    component.toggleActiveLanguage(lang);
    expect(lang.activeFlag).toBe(true);

    await new Promise((r) => setTimeout(r, 100));

    expect(languageApiSpy.update).toHaveBeenCalledWith(2, { activeFlag: true });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Язык «Russian» активирован', 'Закрыть', {
      duration: 3000,
    });
  });

  it('should create language when all prompts are filled', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn((msg: string) => {
        if (msg.includes('Код языка')) return 'de';
        if (msg.includes('Название (например')) return 'German';
        if (msg.includes('Название на языке')) return 'Deutsch';
        if (msg.includes('Направление письма')) return 'ltr';
        if (msg.includes('Семейство шрифтов')) return 'Noto Sans';
        return 'Noto Sans';
      }),
    );
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );

    component.createLanguage();

    await new Promise((r) => setTimeout(r, 100));

    expect(languageApiSpy.create).toHaveBeenCalledWith({
      code: 'de',
      displayName: 'German',
      nativeName: 'Deutsch',
      writingDir: 'ltr',
      supportsTones: true,
      supportsPinyin: true,
      fontFamily: 'Noto Sans',
      activeFlag: true,
    });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Язык «German» создан', 'Закрыть', {
      duration: 3000,
    });
    vi.unstubAllGlobals();
  });

  it('should not create language when code prompt is cancelled', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => null),
    );
    component.createLanguage();
    expect(languageApiSpy.create).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should not create language when displayName prompt is cancelled', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn((msg: string) => {
        if (msg.includes('Код языка')) return 'de';
        return null;
      }),
    );
    component.createLanguage();
    expect(languageApiSpy.create).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should use default writingDir when prompt is cancelled', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn((msg: string) => {
        if (msg.includes('Код языка')) return 'de';
        if (msg.includes('Название (например')) return 'German';
        if (msg.includes('Название на языке')) return 'Deutsch';
        if (msg.includes('Направление письма')) return null;
        if (msg.includes('Семейство шрифтов')) return 'Noto Sans';
        return 'Noto Sans';
      }),
    );
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );

    component.createLanguage();
    vi.unstubAllGlobals();

    await new Promise((r) => setTimeout(r, 100));

    expect(languageApiSpy.create).toHaveBeenCalledWith(
      expect.objectContaining({ writingDir: 'ltr' }),
    );
  });

  it('should show error on create failure', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'de'),
    );
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    languageApiSpy.create.mockRejectedValue(new Error('Server error'));

    component.createLanguage();
    vi.unstubAllGlobals();

    await new Promise((r) => setTimeout(r, 100));

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Не удалось создать язык: Server error',
      'Закрыть',
      { duration: 5000 },
    );
  });

  it('should set creating to false after success', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn((msg: string) => {
        if (msg.includes('Код языка')) return 'de';
        if (msg.includes('Название (например')) return 'German';
        if (msg.includes('Название на языке')) return 'Deutsch';
        if (msg.includes('Направление письма')) return 'ltr';
        if (msg.includes('Семейство шрифтов')) return 'Noto Sans';
        return 'Noto Sans';
      }),
    );
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );

    component.createLanguage();
    vi.unstubAllGlobals();

    await new Promise((r) => setTimeout(r, 100));

    expect(component.creating()).toBe(false);
  });

  it('should set creating to false after failure', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn((msg: string) => {
        if (msg.includes('Код языка')) return 'de';
        if (msg.includes('Название (например')) return 'German';
        if (msg.includes('Название на языке')) return 'Deutsch';
        if (msg.includes('Направление письма')) return 'ltr';
        if (msg.includes('Семейство шрифтов')) return 'Noto Sans';
        return 'Noto Sans';
      }),
    );
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    languageApiSpy.create.mockRejectedValue(new Error('Server error'));

    component.createLanguage();
    vi.unstubAllGlobals();

    await new Promise((r) => setTimeout(r, 100));

    expect(component.creating()).toBe(false);
  });

  it('should not delete language when user cancels confirm', async () => {
    vi.stubGlobal('confirm', () => false);
    const lang = mockLanguages[0];
    await component.deleteLanguage(lang);
    expect(languageApiSpy.delete).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should delete language when user confirms', async () => {
    vi.stubGlobal('confirm', () => true);
    const lang = mockLanguages[0];
    await component.deleteLanguage(lang);
    expect(languageApiSpy.delete).toHaveBeenCalledWith(1);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Язык «English» удалён', 'Закрыть', {
      duration: 3000,
    });
    vi.unstubAllGlobals();
  });

  it('should show error on delete failure', async () => {
    vi.stubGlobal('confirm', () => true);
    languageApiSpy.delete.mockRejectedValue(new Error('Server error'));
    const lang = mockLanguages[0];
    await component.deleteLanguage(lang);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Не удалось удалить язык: Server error',
      'Закрыть',
      { duration: 5000 },
    );
    vi.unstubAllGlobals();
  });
});
