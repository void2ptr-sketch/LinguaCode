import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UpperCasePipe } from '@angular/common';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { LanguagePairRegistryComponent } from './language-pair-registry.component';
import { LanguagePairsApiService } from '../../../../entities/language-pair/api/language-pairs-api.service';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import type { LanguagePairDto } from '../../../../entities/language-pair/api/language-pairs-api.types';
import type { LanguageDto } from '../../../../entities/language-pair/api/language-dto.types';

describe('LanguagePairRegistryComponent', () => {
  let component: LanguagePairRegistryComponent;
  let fixture: ComponentFixture<LanguagePairRegistryComponent>;
  let pairsApiSpy: {
    listAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };
  let languageService: LanguageService;

  const mockLanguages: LanguageDto[] = [
    { id: 1, code: 'en', displayName: 'English', nativeName: 'English', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: 'Noto Sans', activeFlag: true },
    { id: 2, code: 'ru', displayName: 'Russian', nativeName: 'Русский', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: 'Noto Sans', activeFlag: true },
    { id: 3, code: 'zh', displayName: 'Chinese', nativeName: '中文', writingDir: 'ltr', supportsTones: true, supportsPinyin: true, fontFamily: 'Noto Sans', activeFlag: true },
  ];

  const mockPairs: LanguagePairDto[] = [
    { id: 1, knownCode: 'en', learningCode: 'ru' },
    { id: 2, knownCode: 'ru', learningCode: 'en' },
  ];

  beforeEach(async () => {
    pairsApiSpy = {
      listAll: vi.fn().mockResolvedValue(mockPairs),
      create: vi.fn().mockResolvedValue({ id: 3, knownCode: 'en', learningCode: 'zh' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    snackBarSpy = { open: vi.fn() };

    TestBed.configureTestingModule({
      imports: [
        LanguagePairRegistryComponent,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatOptionModule,
        MatSelectModule,
        MatSnackBarModule,
        UpperCasePipe,
      ],
      providers: [
        { provide: LanguagePairsApiService, useValue: pairsApiSpy },
        {
          provide: LanguageService,
          useValue: {
            languages: vi.fn(() => mockLanguages),
            loading: vi.fn(() => false),
            load: vi.fn().mockResolvedValue(undefined),
            findByCode: vi.fn((code: string) => mockLanguages.find((l) => l.code === code)),
          },
        },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    fixture = TestBed.createComponent(LanguagePairRegistryComponent);
    component = fixture.componentInstance;
    languageService = TestBed.inject(LanguageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have pairs signal', () => {
    expect(component.pairs).toBeDefined();
    expect(typeof component.pairs).toBe('function');
  });

  it('should have loading signal', () => {
    expect(component.loading).toBeDefined();
    expect(typeof component.loading).toBe('function');
  });

  it('should have creating signal', () => {
    expect(component.creating).toBeDefined();
    expect(typeof component.creating).toBe('function');
  });

  it('should have newKnownCode signal', () => {
    expect(component.newKnownCode).toBeDefined();
    expect(typeof component.newKnownCode).toBe('function');
  });

  it('should have newLearningCode signal', () => {
    expect(component.newLearningCode).toBeDefined();
    expect(typeof component.newLearningCode).toBe('function');
  });

  it('should have groupedPairs computed', () => {
    expect(component.groupedPairs).toBeDefined();
    expect(typeof component.groupedPairs).toBe('function');
  });

  it('should have languages getter', () => {
    expect(component.languages).toBeDefined();
    expect(typeof component.languages).toBe('function');
  });

  it('should have languagesLoading getter', () => {
    expect(component.languagesLoading).toBeDefined();
    expect(typeof component.languagesLoading).toBe('function');
  });

  it('should have getLanguageLabel method', () => {
    expect(component.getLanguageLabel).toBeDefined();
    expect(typeof component.getLanguageLabel).toBe('function');
  });

  it('should have createPair method', () => {
    expect(component.createPair).toBeDefined();
    expect(typeof component.createPair).toBe('function');
  });

  it('should have deletePair method', () => {
    expect(component.deletePair).toBeDefined();
    expect(typeof component.deletePair).toBe('function');
  });

  it('should load pairs on init', () => {
    expect(pairsApiSpy.listAll).toHaveBeenCalled();
  });

  it('should load languages on init', () => {
    expect(languageService.load).toHaveBeenCalled();
  });

  it('should group pairs by mirror key', () => {
    const groups = component.groupedPairs();
    expect(groups.length).toBeGreaterThan(0);
  });

  it('should get language label for known code', () => {
    const label = component.getLanguageLabel('en');
    expect(label).toBe('English');
  });

  it('should return code when language not found', () => {
    const label = component.getLanguageLabel('xx');
    expect(label).toBe('xx');
  });

  it('should not create pair when knownCode is empty', async () => {
    component.newKnownCode.set('');
    component.newLearningCode.set('ru');
    await component.createPair();
    expect(pairsApiSpy.create).not.toHaveBeenCalled();
  });

  it('should not create pair when learningCode is empty', async () => {
    component.newKnownCode.set('en');
    component.newLearningCode.set('');
    await component.createPair();
    expect(pairsApiSpy.create).not.toHaveBeenCalled();
  });

  it('should not create pair when codes are the same', async () => {
    component.newKnownCode.set('en');
    component.newLearningCode.set('en');
    await component.createPair();
    expect(pairsApiSpy.create).not.toHaveBeenCalled();
  });

  it('should not create pair when creating is true', async () => {
    component.creating.set(true);
    component.newKnownCode.set('en');
    component.newLearningCode.set('zh');
    await component.createPair();
    expect(pairsApiSpy.create).not.toHaveBeenCalled();
  });

  it('should not create duplicate pair', async () => {
    component.newKnownCode.set('en');
    component.newLearningCode.set('ru');
    await component.createPair();
    expect(pairsApiSpy.create).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Такая пара уже есть в реестре', 'Закрыть', {
      duration: 3000,
    });
  });

  it('should create pair when valid and not duplicate', async () => {
    component.newKnownCode.set('en');
    component.newLearningCode.set('zh');
    await component.createPair();

    expect(pairsApiSpy.create).toHaveBeenCalledWith({ knownCode: 'en', learningCode: 'zh' });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Пара добавлена в реестр', 'Закрыть', {
      duration: 3000,
    });
    expect(component.newKnownCode()).toBe('');
    expect(component.newLearningCode()).toBe('');
  });

  it('should show error on create failure', async () => {
    pairsApiSpy.create.mockRejectedValue(new Error('Server error'));
    component.newKnownCode.set('en');
    component.newLearningCode.set('zh');
    await component.createPair();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Не удалось создать пару: Server error',
      'Закрыть',
      { duration: 5000 },
    );
  });

  it('should set creating to false after success', async () => {
    component.newKnownCode.set('en');
    component.newLearningCode.set('zh');
    await component.createPair();
    expect(component.creating()).toBe(false);
  });

  it('should set creating to false after failure', async () => {
    pairsApiSpy.create.mockRejectedValue(new Error('Server error'));
    component.newKnownCode.set('en');
    component.newLearningCode.set('zh');
    await component.createPair();
    expect(component.creating()).toBe(false);
  });

  it('should not delete pair when user cancels confirm', async () => {
    vi.stubGlobal('confirm', () => false);
    const pair = { id: 1, knownCode: 'en', learningCode: 'ru' };
    await component.deletePair(pair);
    expect(pairsApiSpy.delete).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should delete pair when user confirms', async () => {
    vi.stubGlobal('confirm', () => true);
    const pair = { id: 1, knownCode: 'en', learningCode: 'ru' };
    await component.deletePair(pair);
    expect(pairsApiSpy.delete).toHaveBeenCalledWith(1);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Пара удалена из реестра', 'Закрыть', {
      duration: 3000,
    });
    vi.unstubAllGlobals();
  });

  it('should show error on delete failure', async () => {
    vi.stubGlobal('confirm', () => true);
    pairsApiSpy.delete.mockRejectedValue(new Error('Server error'));
    const pair = { id: 1, knownCode: 'en', learningCode: 'ru' };
    await component.deletePair(pair);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Не удалось удалить пару: Server error',
      'Закрыть',
      { duration: 5000 },
    );
    vi.unstubAllGlobals();
  });
});
