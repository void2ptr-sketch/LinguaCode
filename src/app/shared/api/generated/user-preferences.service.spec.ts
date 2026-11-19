import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { UserPreferencesService } from './user-preferences';
import type { UserPreferences } from './models';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let httpMock: HttpTestingController;

  const mockPreferences: UserPreferences = {
    interfaceLanguage: 'ru',
    darkMode: false,
    cardFontSize: 'MEDIUM',
    showPinyin: true,
    showTranscription: true,
    cardsPerDay: 50,
    theme: 'azure-blue',
    colorScheme: 'light',
    cardFocusFullscreen: false,
    learningProficiencyLevel: 'beginner',
    activeLanguagePairId: 'pair-1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserPreferencesService],
    });

    service = TestBed.inject(UserPreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('userPreferencesGet', () => {
    it('should call the correct endpoint', async () => {
      const promise = firstValueFrom(service.userPreferencesGet());

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPreferences });

      const response = await promise;
      expect(response).toEqual({ data: mockPreferences });
    });

    it('should call the correct endpoint with response observe', async () => {
      const promise = firstValueFrom(
        service.userPreferencesGet({ observe: 'response' }),
      );

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPreferences });

      const event = await promise;
      expect(event.status).toBe(200);
      expect(event.body).toEqual({ data: mockPreferences });
    });
  });

  describe('userPreferencesPut', () => {
    it('should replace preferences with the provided body', async () => {
      const updateBody: UserPreferences = {
        interfaceLanguage: 'en',
        darkMode: true,
        cardFontSize: 'LARGE',
      };

      const promise = firstValueFrom(service.userPreferencesPut(updateBody));

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('PUT');
      const body = req.request.body as UserPreferences;
      expect(body.interfaceLanguage).toBe('en');
      expect(body.darkMode).toBe(true);
      expect(body.cardFontSize).toBe('LARGE');
      req.flush({ data: updateBody });

      const response = await promise;
      expect(response).toEqual({ data: updateBody });
    });

    it('should call the correct endpoint with response observe', async () => {
      const updateBody: UserPreferences = { theme: 'dark' };

      const promise = firstValueFrom(
        service.userPreferencesPut(updateBody, { observe: 'response' }),
      );

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('PUT');
      req.flush({ data: updateBody });

      const event = await promise;
      expect(event.status).toBe(200);
      expect(event.body).toEqual({ data: updateBody });
    });
  });

  describe('userPreferencesDelete', () => {
    it('should reset preferences to defaults', async () => {
      const promise = firstValueFrom(service.userPreferencesDelete());

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await promise;
    });

    it('should call the correct endpoint with response observe', async () => {
      const promise = firstValueFrom(
        service.userPreferencesDelete({ observe: 'response' }),
      );

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      const event = await promise;
      expect(event.status).toBe(204);
    });
  });

  describe('userPreferencesPatch', () => {
    it('should partially update preferences', async () => {
      const patchBody: UserPreferences = {
        showPinyin: false,
        cardsPerDay: 100,
      };

      const promise = firstValueFrom(service.userPreferencesPatch(patchBody));

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('PATCH');
      const body = req.request.body as UserPreferences;
      expect(body.showPinyin).toBe(false);
      expect(body.cardsPerDay).toBe(100);
      req.flush({ data: patchBody });

      const response = await promise;
      expect(response).toEqual({ data: patchBody });
    });

    it('should call the correct endpoint with response observe', async () => {
      const patchBody: UserPreferences = { colorScheme: 'dark' };

      const promise = firstValueFrom(
        service.userPreferencesPatch(patchBody, { observe: 'response' }),
      );

      const req = httpMock.expectOne('/api/v1/users/me/preferences');
      expect(req.request.method).toBe('PATCH');
      req.flush({ data: patchBody });

      const event = await promise;
      expect(event.status).toBe(200);
      expect(event.body).toEqual({ data: patchBody });
    });
  });

  describe('service structure', () => {
    it('should be injectable', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof service.userPreferencesGet).toBe('function');
      expect(typeof service.userPreferencesPut).toBe('function');
      expect(typeof service.userPreferencesDelete).toBe('function');
      expect(typeof service.userPreferencesPatch).toBe('function');
    });
  });
});
