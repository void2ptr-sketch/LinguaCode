import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { TagsService } from './tags.service';
import type { TagOption } from './tags.service';

describe('TagsService', () => {
  let service: TagsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TagsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TagsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty tagCodes initially', () => {
    expect(service.tagCodes()).toEqual([]);
  });

  it('should return empty tagLabels initially', () => {
    expect(service.tagLabels()).toEqual({});
  });

  it('should return tag code as label when tag is not loaded', () => {
    const label = service.getLabel('unknown-tag');
    expect(label).toBe('unknown-tag');
  });

  it('should return false for isValid when tags are not loaded', () => {
    expect(service.isValid('any-tag')).toBe(false);
  });

  it('should have loading false initially', () => {
    expect(service.loading()).toBe(false);
  });

  it('should have loaded false initially', () => {
    expect(service.loaded()).toBe(false);
  });

  it('should load tags successfully', async () => {
    const mockTags: TagOption[] = [
      { code: 'new', label: 'New' },
      { code: 'review', label: 'Review' },
    ];

    const loadPromise = service.load();
    const req = httpMock.expectOne('/api/v1/cards/tags');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTags, total: mockTags.length });

    await loadPromise;

    expect(service.loading()).toBe(false);
    expect(service.loaded()).toBe(true);
    expect(service.tagCodes()).toEqual(['new', 'review']);
    expect(service.tagLabels()).toEqual({ new: 'New', review: 'Review' });
  });

  it('should return label for known tag after loading', async () => {
    const mockTags: TagOption[] = [{ code: 'review', label: 'Review' }];

    const loadPromise = service.load();
    const req = httpMock.expectOne('/api/v1/cards/tags');
    req.flush({ data: mockTags, total: 1 });

    await loadPromise;

    const label = service.getLabel('review');
    expect(label).toBe('Review');
  });

  it('should return true for isValid when tag is known', async () => {
    const mockTags: TagOption[] = [{ code: 'new', label: 'New' }];

    const loadPromise = service.load();
    const req = httpMock.expectOne('/api/v1/cards/tags');
    req.flush({ data: mockTags, total: 1 });

    await loadPromise;

    expect(service.isValid('new')).toBe(true);
  });

  it('should fall back to tag code when label not found', async () => {
    const mockTags: TagOption[] = [{ code: 'new', label: 'New' }];

    const loadPromise = service.load();
    const req = httpMock.expectOne('/api/v1/cards/tags');
    req.flush({ data: mockTags, total: 1 });

    await loadPromise;

    const label = service.getLabel('unknown');
    expect(label).toBe('unknown');
  });

  it('should handle load failure gracefully', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('/api/v1/cards/tags');
    req.flush('Server error', { status: 500, statusText: 'Error' });

    await loadPromise;

    expect(service.loading()).toBe(false);
    expect(service.loaded()).toBe(false);
    expect(service.tagCodes()).toEqual([]);
  });

  it('should reload tags', async () => {
    const mockTags: TagOption[] = [{ code: 'new', label: 'New' }];

    const loadPromise1 = service.load();
    let req = httpMock.expectOne('/api/v1/cards/tags');
    req.flush({ data: mockTags, total: 1 });

    await loadPromise1;

    expect(service.loaded()).toBe(true);

    const loadPromise2 = service.reload();
    req = httpMock.expectOne('/api/v1/cards/tags');
    req.flush({ data: mockTags, total: 1 });

    await loadPromise2;

    expect(service.loading()).toBe(false);
    expect(service.loaded()).toBe(true);
  });
});
