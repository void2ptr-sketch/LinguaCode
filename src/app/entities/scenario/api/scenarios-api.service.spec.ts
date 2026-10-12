import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ScenariosApiService, ScenarioWritePayload } from './scenarios-api.service';
import type { Scenario, ScenarioIndexEntry, ScenarioSearchPage } from '../../../core/models';

describe('ScenariosApiService', () => {
  let service: ScenariosApiService;
  let httpMock: HttpTestingController;

  const mockScenario: Scenario = {
    id: 'scenario-1',
    title: 'Test Scenario',
    description: 'Test description',
    authorId: 'author-1',
    courseId: 'course-1',
    cardSource: { mode: 'fixed', cardIds: ['card-1'] },
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockScenarioIndexEntry: ScenarioIndexEntry = {
    id: 'scenario-1',
    title: 'Test Scenario',
    authorId: 'author-1',
    cardSourceMode: 'fixed',
    cardSourceSummary: '1 card',
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'Русский → English',
    courseId: 'course-1',
  };

  const mockSearchPage: ScenarioSearchPage = {
    items: [mockScenarioIndexEntry],
    totalItems: 1,
    page: 0,
    pageSize: 20,
    totalPages: 1,
  };

  const mockPayload: ScenarioWritePayload = {
    title: 'Test Scenario',
    description: 'Test description',
    cardSource: { mode: 'fixed', cardIds: ['card-1'] },
    published: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ScenariosApiService],
    });

    service = TestBed.inject(ScenariosApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('search', () => {
    it('should search scenarios and return paginated results', async () => {
      const promise = service.search({
        knownLanguage: 'ru',
        learningLanguage: 'en',
        page: { page: 0, pageSize: 20 },
      });

      const req = httpMock.expectOne((req) => req.url === '/api/scenarios/search');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockSearchPage });

      const result = await promise;
      expect(result).toEqual(mockSearchPage);
    });
  });

  describe('getById', () => {
    it('should retrieve a scenario by ID', async () => {
      const promise = service.getById('scenario-1');

      const req = httpMock.expectOne('/api/scenarios/scenario-1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockScenario });

      const result = await promise;
      expect(result).toEqual(mockScenario);
    });

    it('should throw when scenario is not found', async () => {
      const promise = service.getById('nonexistent');

      const req = httpMock.expectOne('/api/scenarios/nonexistent');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new scenario', async () => {
      const promise = service.create(mockPayload);

      const req = httpMock.expectOne('/api/scenarios');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPayload);
      req.flush({ data: mockScenario });

      const result = await promise;
      expect(result).toEqual(mockScenario);
    });
  });

  describe('update', () => {
    it('should update an existing scenario', async () => {
      const promise = service.update('scenario-1', mockPayload);

      const req = httpMock.expectOne('/api/scenarios/scenario-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockPayload);
      req.flush({ data: mockScenario });

      const result = await promise;
      expect(result).toEqual(mockScenario);
    });
  });

  describe('delete', () => {
    it('should delete a scenario', async () => {
      const promise = service.delete('scenario-1');

      const req = httpMock.expectOne('/api/scenarios/scenario-1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: null });

      const result = await promise;
      expect(result).toBeUndefined();
    });
  });

  describe('findUsingCard', () => {
    it('should find scenarios using a specific card', async () => {
      const promise = service.findUsingCard('card-1');

      const req = httpMock.expectOne('/api/scenarios/by-card/card-1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockScenarioIndexEntry] });

      const result = await promise;
      expect(result).toEqual([mockScenarioIndexEntry]);
    });
  });
});
