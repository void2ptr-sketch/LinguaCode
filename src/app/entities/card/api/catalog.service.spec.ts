import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';
import { CatalogService } from './catalog.service';
import { CardDifficultiesService } from '../../../shared/api/generated/card-difficulties';
import { CardKindsService } from '../../../shared/api/generated/card-kinds';
import { ContentLanguagesService } from '../../../shared/api/generated/content-languages';

function createTestingModule(
  kindsData: unknown[] = [{ code: 'select', label: 'Выбор' }],
  difficultiesData: unknown[] = [
    { code: 'beginner', label: 'Начальный уровень' },
    { code: 'expert', label: 'Экспертный уровень' },
  ],
  languagesData: unknown[] = [],
) {
  const cardKindsApi = { listAll7: vi.fn(() => of({ data: kindsData })) };
  const cardDifficultiesApi = { listAll8: vi.fn(() => of({ data: difficultiesData })) };
  const contentLanguagesApi = { listAll6: vi.fn(() => of({ data: languagesData })) };

  return TestBed.configureTestingModule({
    providers: [
      CatalogService,
      { provide: CardKindsService, useValue: cardKindsApi },
      { provide: CardDifficultiesService, useValue: cardDifficultiesApi },
      { provide: ContentLanguagesService, useValue: contentLanguagesApi },
    ],
  }).inject(CatalogService);
}

describe('CatalogService', () => {
  it('should not expose difficulty constants before the backend is loaded', () => {
    const service = createTestingModule();
    expect(service.difficulties()).toEqual([]);
  });

  it('should load difficulty options from the backend endpoint', async () => {
    const service = createTestingModule();
    await service.load();

    expect(service.difficulties()).toEqual([
      { code: 'beginner', label: 'Начальный уровень' },
      { code: 'expert', label: 'Экспертный уровень' },
    ]);
  });

  it('should deduplicate concurrent ensureLoaded calls', async () => {
    const service = createTestingModule();
    await Promise.all([service.ensureLoaded(), service.ensureLoaded()]);
    expect(service.loaded()).toBe(true);
  });

  it('should not reload the catalog after it has been loaded', async () => {
    const service = createTestingModule();
    await service.ensureLoaded();
    await service.ensureLoaded();
    expect(service.loaded()).toBe(true);
  });

  it('should filter out difficulty from card kinds', async () => {
    const service = createTestingModule([
      { code: 'select', label: 'Выбор' },
      { code: 'difficulty', label: 'Сложность' },
      { code: 'draw', label: 'Рисование' },
    ]);

    await service.load();

    const kinds = service.cardKinds();
    expect(kinds).toEqual([
      { code: 'select', label: 'Выбор' },
      { code: 'draw', label: 'Рисование' },
    ]);
  });

  it('should filter difficulties without label', async () => {
    const service = createTestingModule(
      [],
      [{ code: 'beginner', label: 'Начальный уровень' }, { code: 'orphan' }],
    );

    await service.load();

    const diffs = service.difficulties();
    expect(diffs).toEqual([{ code: 'beginner', label: 'Начальный уровень' }]);
  });

  it('should use code as label when label is null', async () => {
    const service = createTestingModule([{ code: 'select', label: null }]);

    await service.load();

    const kinds = service.cardKinds();
    expect(kinds).toEqual([{ code: 'select', label: 'select' }]);
  });

  it('should return content language codes', async () => {
    const service = createTestingModule([], [], [{ code: 'zh' }, { code: 'en' }, { code: null }]);

    await service.load();

    expect(service.contentLanguageCodes()).toEqual(['zh', 'en']);
  });

  it('should build card kind labels map', async () => {
    const service = createTestingModule([{ code: 'select', label: 'Выбор' }]);
    await service.load();

    const labels = service.cardKindLabels;
    expect(typeof labels()).toBe('object');
    expect(labels()['select']).toBe('Выбор');
  });

  it('should build difficulty labels map', async () => {
    const service = createTestingModule();
    await service.load();

    const labels = service.difficultyLabels;
    expect(labels()['beginner']).toBe('Начальный уровень');
  });

  it('should return valid codes combining kinds, difficulties, and languages', async () => {
    const service = createTestingModule();
    await service.load();

    const codes = service.validCodes();
    expect(codes).toContain('select');
    expect(codes).toContain('beginner');
  });

  it('should return true for valid code', async () => {
    const service = createTestingModule();
    await service.load();

    expect(service.isValid('select')).toBe(true);
    expect(service.isValid('beginner')).toBe(true);
  });

  it('should return false for invalid code', async () => {
    const service = createTestingModule();
    await service.load();

    expect(service.isValid('nonexistent')).toBe(false);
  });

  it('should return false for unknown code', () => {
    const service = createTestingModule();
    expect(service.isValid('unknown')).toBe(false);
  });

  it('should return false for empty string in isContentLanguage', () => {
    const service = createTestingModule();
    expect(service.isContentLanguage('')).toBe(false);
  });

  it('should return false for non-string type in isContentLanguage', () => {
    const service = createTestingModule();
    expect(service.isContentLanguage(42)).toBe(false);
    expect(service.isContentLanguage([])).toBe(false);
  });

  it('should return true for content language when not loaded', () => {
    const service = createTestingModule();
    expect(service.isContentLanguage('zh')).toBe(true);
  });

  it('should handle API failure for kinds', async () => {
    const cardKindsApi = {
      listAll7: vi.fn(() => throwError(() => new Error('API error'))),
    };
    const cardDifficultiesApi = { listAll8: vi.fn(() => of({ data: [] })) };
    const contentLanguagesApi = { listAll6: vi.fn(() => of({ data: [] })) };

    TestBed.configureTestingModule({
      providers: [
        CatalogService,
        { provide: CardKindsService, useValue: cardKindsApi },
        { provide: CardDifficultiesService, useValue: cardDifficultiesApi },
        { provide: ContentLanguagesService, useValue: contentLanguagesApi },
      ],
    });

    const service = TestBed.inject(CatalogService);
    await service.load();

    expect(service.loaded()).toBe(false);
    expect(service.loading()).toBe(false);
  });

  it('should handle null data in API response', async () => {
    const service = createTestingModule([{ code: 'select', label: 'Выбор' }], [], [null]);

    await service.load();

    expect(service.cardKinds()).toEqual([{ code: 'select', label: 'Выбор' }]);
  });

  it('should set loading to false after load completes', async () => {
    const service = createTestingModule();
    expect(service.loading()).toBe(false);

    await service.load();

    expect(service.loading()).toBe(false);
    expect(service.loaded()).toBe(true);
  });
});
