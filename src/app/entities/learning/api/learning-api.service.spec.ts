import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildApiUrl } from '../../../shared/api/api-url';
import { LearningApiService } from './learning-api.service';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('LearningApiService', () => {
  let service: LearningApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearningApiService],
    });
    service = TestBed.inject(LearningApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ── record ──

  it('should record a learning result with scenarioId', async () => {
    const result = {
      cardId: 'card-456',
      scenarioId: 'scenario-789',
      correct: true,
      answeredAt: '2026-01-01T00:00:00.000Z',
    };
    const promise = service.record(result);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/learning/results'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.cardId).toBe('card-456');
    expect(req.request.body.scenarioId).toBe('scenario-789');
    expect(req.request.body.correct).toBe(true);
    req.flush({
      data: {
        id: 1,
        userId: 42,
        cardId: 456,
        scenarioId: 789,
        correct: true,
        answeredAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const res = await promise;
    expect(res.id).toBe('1');
    expect(res.userId).toBe('42');
    expect(res.cardId).toBe('456');
    expect(res.scenarioId).toBe('789');
    expect(res.correct).toBe(true);
  });

  it('should record a learning result without scenarioId', async () => {
    const result = {
      cardId: 'card-123',
      scenarioId: undefined as string | undefined,
      correct: false,
      answeredAt: '2026-06-15T12:00:00.000Z',
    };
    const promise = service.record(result);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/learning/results'));
    expect(req.request.body.scenarioId).toBeNull();
    req.flush({
      data: {
        id: 2,
        userId: 42,
        cardId: 123,
        scenarioId: null,
        correct: false,
        answeredAt: '2026-06-15T12:00:00.000Z',
      },
    });

    const res = await promise;
    expect(res.scenarioId).toBeUndefined();
  });

  // ── findByUser ──

  it('should fetch learning results for a user', async () => {
    const promise = service.findByUser('user-42', 0, 20);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/learning/results/user-42'));
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({
      data: [
        {
          id: 1,
          userId: 42,
          cardId: 100,
          scenarioId: null,
          correct: true,
          answeredAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          userId: 42,
          cardId: 200,
          scenarioId: 5,
          correct: false,
          answeredAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    const res = await promise;
    expect(res).toHaveLength(2);
    expect(res[0].id).toBe('1');
    expect(res[0].cardId).toBe('100');
    expect(res[0].scenarioId).toBeUndefined();
    expect(res[1].scenarioId).toBe('5');
  });

  it('should use default page and pageSize', async () => {
    const promise = service.findByUser('user-1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/learning/results/user-1'));
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ data: [] });
    await promise;
  });

  it('should handle empty results', async () => {
    const promise = service.findByUser('user-999');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/learning/results/user-999'));
    req.flush({ data: [] });

    const res = await promise;
    expect(res).toEqual([]);
  });

  // ── getCardAccuracy ──

  it('should get card accuracy with accuracy value', async () => {
    const promise = service.getCardAccuracy('user-42', 'card-100');

    const req = httpMock.expectOne(
      (r) => r.url === buildApiUrl('/learning/accuracy/user-42/card-100'),
    );
    req.flush({
      data: {
        cardId: 'card-100',
        totalAttempts: 10,
        correctAttempts: 8,
        accuracy: 0.8,
      },
    });

    const res = await promise;
    expect(res.cardId).toBe('card-100');
    expect(res.totalAttempts).toBe(10);
    expect(res.correctAttempts).toBe(8);
    expect(res.accuracy).toBe(0.8);
  });

  it('should get card accuracy with null accuracy', async () => {
    const promise = service.getCardAccuracy('user-42', 'card-999');

    const req = httpMock.expectOne(
      (r) => r.url === buildApiUrl('/learning/accuracy/user-42/card-999'),
    );
    req.flush({
      data: {
        cardId: 'card-999',
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: null,
      },
    });

    const res = await promise;
    expect(res.accuracy).toBeNull();
  });
});
