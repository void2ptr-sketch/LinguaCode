import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { LanguageService } from './language.service';
import type { LanguageDto } from '../api/language-dto.types';

function makeLanguageDto(overrides: Partial<LanguageDto> = {}): LanguageDto {
  return {
    id: 1,
    code: 'en',
    displayName: 'English',
    nativeName: 'English',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
    ...overrides,
  };
}

describe('LanguageService', () => {
  let service: LanguageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LanguageService],
    });
    service = TestBed.inject(LanguageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should have empty languages by default', () => {
    expect(service.languages()).toEqual([]);
  });

  it('should have loading false by default', () => {
    expect(service.loading()).toBe(false);
  });

  it('should have loaded false by default', () => {
    expect(service.loaded()).toBe(false);
  });

  it('should return empty codes when no languages loaded', () => {
    expect(service.getCodes()).toEqual([]);
  });

  it('should return empty labels when no languages loaded', () => {
    expect(service.getLabels()).toEqual({});
  });

  it('should return active language codes when loaded', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({
      data: [
        makeLanguageDto({ id: 1, code: 'en', activeFlag: true }),
        makeLanguageDto({ id: 2, code: 'ru', activeFlag: true }),
        makeLanguageDto({ id: 3, code: 'de', activeFlag: false }),
      ],
      total: 3,
    });

    await promise;

    const codes = service.getCodes();
    expect(codes).toContain('en');
    expect(codes).toContain('ru');
    expect(codes).not.toContain('de');
  });

  it('should return labels when loaded', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({
      data: [
        makeLanguageDto({ id: 1, code: 'en', displayName: 'English' }),
        makeLanguageDto({ id: 2, code: 'ru', displayName: 'Russian' }),
        makeLanguageDto({ id: 3, code: 'de', displayName: 'German' }),
      ],
      total: 3,
    });

    await promise;

    const labels = service.getLabels();
    expect(labels['en']).toBe('English');
    expect(labels['ru']).toBe('Russian');
    expect(labels['de']).toBe('German');
  });

  it('should return language by code when loaded', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({
      data: [
        makeLanguageDto({ id: 1, code: 'en', displayName: 'English' }),
        makeLanguageDto({ id: 2, code: 'ru', displayName: 'Russian' }),
      ],
      total: 2,
    });

    await promise;

    const lang = service.findByCode('en');
    expect(lang).toBeDefined();
    expect(lang?.code).toBe('en');
    expect(lang?.displayName).toBe('English');
  });

  it('should return undefined for unknown code', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({ data: [], total: 0 });

    await promise;

    const lang = service.findByCode('xx');
    expect(lang).toBeUndefined();
  });

  it('should return true for valid active code', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({
      data: [makeLanguageDto({ id: 1, code: 'en', activeFlag: true })],
      total: 1,
    });

    await promise;

    expect(service.isValid('en')).toBe(true);
  });

  it('should return false for inactive code', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({
      data: [makeLanguageDto({ id: 1, code: 'de', activeFlag: false })],
      total: 1,
    });

    await promise;

    expect(service.isValid('de')).toBe(false);
  });

  it('should return false for unknown code', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({ data: [], total: 0 });

    await promise;

    expect(service.isValid('xx')).toBe(false);
  });

  it('should be idempotent — second load() returns immediately without HTTP call', async () => {
    const promise1 = service.load();

    const req1 = httpMock.expectOne('/api/v1/languages');
    req1.flush({
      data: [makeLanguageDto({ id: 1, code: 'en', activeFlag: true })],
      total: 1,
    });

    await promise1;
    expect(service.loaded()).toBe(true);

    // Second load should NOT make an HTTP call
    const promise2 = service.load();
    // No expectOne needed — the second call returns immediately
    await promise2;
    expect(service.loaded()).toBe(true);
  });

  it('should set languages to empty array on load failure', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    await promise;

    expect(service.languages()).toEqual([]);
    expect(service.loaded()).toBe(false);
    expect(service.loading()).toBe(false);
  });

  it('should handle null response data', async () => {
    const promise = service.load();

    const req = httpMock.expectOne('/api/v1/languages');
    req.flush({ data: null, total: 0 });

    await promise;

    expect(service.languages()).toEqual([]);
    expect(service.loaded()).toBe(true);
  });
});
