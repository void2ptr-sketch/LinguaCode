import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { ReferenceSettingsService } from './reference-settings';

describe('ReferenceSettingsService', () => {
  let service: ReferenceSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReferenceSettingsService],
    });

    service = TestBed.inject(ReferenceSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getValidationRules', () => {
    it('should call the correct endpoint', async () => {
      const mockResponse = {
        maxTitleLength: 200,
        maxDescriptionLength: 5000,
        maxTagsPerEntity: 10,
        requireTags: false,
      };

      const promise = firstValueFrom(service.getValidationRules());

      const req = httpMock.expectOne('/api/v1/reference/settings/validation');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await promise;
      expect(response).toEqual(mockResponse);
    });

    it('should call the correct endpoint with response observe', async () => {
      const mockResponse = {
        maxTitleLength: 100,
        maxDescriptionLength: 3000,
        maxTagsPerEntity: 5,
        requireTags: true,
      };

      const promise = firstValueFrom(service.getValidationRules({ observe: 'response' }));

      const req = httpMock.expectOne('/api/v1/reference/settings/validation');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const event = await promise;
      expect(event.status).toBe(200);
      expect(event.body).toEqual(mockResponse);
    });
  });

  describe('getSyncSettings', () => {
    it('should call the correct endpoint', async () => {
      const mockResponse = {
        maxBatchSize: 50,
        syncTimeoutSeconds: 30,
      };

      const promise = firstValueFrom(service.getSyncSettings());

      const req = httpMock.expectOne('/api/v1/reference/settings/sync');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await promise;
      expect(response).toEqual(mockResponse);
    });

    it('should call the correct endpoint with response observe', async () => {
      const mockResponse = { maxBatchSize: 100, syncTimeoutSeconds: 60 };

      const promise = firstValueFrom(service.getSyncSettings({ observe: 'response' }));

      const req = httpMock.expectOne('/api/v1/reference/settings/sync');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const event = await promise;
      expect(event.status).toBe(200);
      expect(event.body).toEqual(mockResponse);
    });
  });

  describe('getPaginationSettings', () => {
    it('should call the correct endpoint', async () => {
      const mockResponse = {
        defaultPageSize: 20,
        maxPageSize: 100,
      };

      const promise = firstValueFrom(service.getPaginationSettings());

      const req = httpMock.expectOne('/api/v1/reference/settings/pagination');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await promise;
      expect(response).toEqual(mockResponse);
    });

    it('should call the correct endpoint with response observe', async () => {
      const mockResponse = { defaultPageSize: 50, maxPageSize: 200 };

      const promise = firstValueFrom(service.getPaginationSettings({ observe: 'response' }));

      const req = httpMock.expectOne('/api/v1/reference/settings/pagination');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const event = await promise;
      expect(event.status).toBe(200);
      expect(event.body).toEqual(mockResponse);
    });
  });

  describe('getChineseSettings', () => {
    it('should call the correct endpoint', async () => {
      const mockResponse = {
        showPinyin: true,
        showTones: true,
        showHanzi: true,
        pinyinPosition: 'above',
      };

      const promise = firstValueFrom(service.getChineseSettings());

      const req = httpMock.expectOne('/api/v1/reference/settings/chinese');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await promise;
      expect(response).toEqual(mockResponse);
    });

    it('should call the correct endpoint with response observe', async () => {
      const mockResponse = { showPinyin: false, showTones: false, showHanzi: true };

      const promise = firstValueFrom(service.getChineseSettings({ observe: 'response' }));

      const req = httpMock.expectOne('/api/v1/reference/settings/chinese');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const event = await promise;
      expect(event.status).toBe(200);
      expect(event.body).toEqual(mockResponse);
    });
  });

  describe('service structure', () => {
    it('should be injectable', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof service.getValidationRules).toBe('function');
      expect(typeof service.getSyncSettings).toBe('function');
      expect(typeof service.getPaginationSettings).toBe('function');
      expect(typeof service.getChineseSettings).toBe('function');
    });
  });
});
