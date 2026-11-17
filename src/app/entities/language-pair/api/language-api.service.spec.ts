import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildApiUrl } from '../../../shared/api/api-url';
import { LanguageApiService, type LanguageCreatePayload } from './language-api.service';
import type { LanguageDto } from './language-dto.types';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

function makeLanguageDto(overrides: Partial<LanguageDto> = {}): LanguageDto {
  return {
    id: 1,
    code: 'en',
    displayName: 'English',
    nativeName: 'English',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'sans-serif',
    activeFlag: true,
    ...overrides,
  };
}

describe('LanguageApiService', () => {
  let service: LanguageApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LanguageApiService],
    });
    service = TestBed.inject(LanguageApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ── listAll ──

  it('should return all languages', async () => {
    const promise = service.listAll();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages'));
    req.flush({
      data: [makeLanguageDto({ id: 1, code: 'en' }), makeLanguageDto({ id: 2, code: 'ru' })],
      total: 2,
    });

    const result = await promise;
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe('en');
  });

  it('should handle null response data in listAll', async () => {
    const promise = service.listAll();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages'));
    req.flush({ data: null, total: 0 });

    const result = await promise;
    expect(result).toEqual([]);
  });

  // ── listActive ──

  it('should return only active languages', async () => {
    const promise = service.listActive();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages'));
    req.flush({
      data: [
        makeLanguageDto({ id: 1, code: 'en', activeFlag: true }),
        makeLanguageDto({ id: 2, code: 'ru', activeFlag: true }),
        makeLanguageDto({ id: 3, code: 'de', activeFlag: false }),
      ],
      total: 3,
    });

    const result = await promise;
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.code)).toEqual(['en', 'ru']);
  });

  it('should handle null response data in listActive', async () => {
    const promise = service.listActive();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages'));
    req.flush({ data: null, total: 0 });

    const result = await promise;
    expect(result).toEqual([]);
  });

  it('should return empty when all languages are inactive', async () => {
    const promise = service.listActive();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages'));
    req.flush({
      data: [makeLanguageDto({ id: 1, code: 'en', activeFlag: false })],
      total: 1,
    });

    const result = await promise;
    expect(result).toEqual([]);
  });

  // ── getById ──

  it('should get a language by id', async () => {
    const promise = service.getById(42);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages/42'));
    req.flush({ data: makeLanguageDto({ id: 42, code: 'ja' }) });

    const result = await promise;
    expect(result.id).toBe(42);
    expect(result.code).toBe('ja');
  });

  // ── create ──

  it('should create a language', async () => {
    const payload: LanguageCreatePayload = {
      code: 'xx',
      displayName: 'Test',
      nativeName: 'テスト',
      writingDir: 'ltr',
      supportsTones: false,
      supportsPinyin: false,
      fontFamily: 'sans-serif',
      activeFlag: true,
    };
    const promise = service.create(payload);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages'));
    expect(req.request.method).toBe('POST');
    req.flush({ data: makeLanguageDto({ id: 99, code: 'xx' }) });

    const result = await promise;
    expect(result.id).toBe(99);
    expect(result.code).toBe('xx');
  });

  // ── update ──

  it('should update a language', async () => {
    const promise = service.update(1, { displayName: 'Updated' });

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages/1'));
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: makeLanguageDto({ id: 1, displayName: 'Updated' }) });

    const result = await promise;
    expect(result.displayName).toBe('Updated');
  });

  // ── delete ──

  it('should delete a language', async () => {
    const promise = service.delete(1);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/languages/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    await promise;
  });
});
