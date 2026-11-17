import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildApiUrl } from '../../../shared/api/api-url';
import {
  LessonsApiService,
  type LessonCreatePayload,
  type LessonUpdatePayload,
} from './lessons-api.service';
import type { Lesson } from '../../../shared/api/generated/models';
import { describe, expect, it } from 'vitest';

/** Helper: build a minimal lesson DTO for mocking. */
function makeLessonDto(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 1,
    programId: 10,
    title: 'Lesson 1',
    lessonDescription: 'Description',
    scenarioIds: [1, 2],
    prerequisiteLessonIds: '["10","20"]',
    lessonOrder: 0,
    updatedAt: '2026-01-01T00:00:00Z',
    published: true,
    requiredTier: 'FREE',
    ...overrides,
  };
}

describe('LessonsApiService', () => {
  let service: LessonsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LessonsApiService],
    });
    service = TestBed.inject(LessonsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ── getById ──

  it('should get a lesson by numeric id', async () => {
    const promise = service.getById('42');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/42'));
    req.flush({ data: makeLessonDto({ id: 42, lessonOrder: 5 }) });

    const result = await promise;
    expect(result.id).toBe('42');
    expect(result.order).toBe(5);
    expect(result.prerequisiteLessonIds).toEqual(['10', '20']);
  });

  it('should get a lesson by slug id', async () => {
    const promise = service.getById('lesson-slug');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/lesson-slug'));
    req.flush({ data: makeLessonDto({ id: 99 }) });

    const result = await promise;
    expect(result.id).toBe('99');
  });

  // ── getByProgramId ──

  it('should get lessons by program id', async () => {
    const promise = service.getByProgramId('10');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/by-program/10'));
    req.flush({
      data: [makeLessonDto({ id: 1, lessonOrder: 0 }), makeLessonDto({ id: 2, lessonOrder: 1 })],
    });

    const result = await promise;
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('should handle null response data for getByProgramId', async () => {
    const promise = service.getByProgramId('999');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/by-program/999'));
    req.flush({ data: null });

    const result = await promise;
    expect(result).toEqual([]);
  });

  // ── getByCourseId ──

  it('should get lessons by course id', async () => {
    const promise = service.getByCourseId('10');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/by-course/10'));
    req.flush({ data: [makeLessonDto({ id: 5, lessonOrder: 3 })] });

    const result = await promise;
    expect(result).toHaveLength(1);
    expect(result[0].order).toBe(3);
  });

  it('should handle null response data for getByCourseId', async () => {
    const promise = service.getByCourseId('999');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/by-course/999'));
    req.flush({ data: null });

    const result = await promise;
    expect(result).toEqual([]);
  });

  // ── create ──

  it('should create a lesson with minimal payload', async () => {
    const payload: LessonCreatePayload = {
      programId: '10',
      title: 'New Lesson',
      description: 'Desc',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
    };
    const promise = service.create(payload);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons'));
    expect(req.request.method).toBe('POST');
    req.flush({ data: makeLessonDto({ id: 5, title: 'New Lesson' }) });

    const result = await promise;
    expect(result.id).toBe('5');
    expect(result.title).toBe('New Lesson');
  });

  it('should include languagePairId and courseId when provided', async () => {
    const payload: LessonCreatePayload = {
      programId: '10',
      title: 'Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
      languagePairId: 42,
      courseId: 'course-1',
    };
    const promise = service.create(payload);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons'));
    expect(req.request.body.languagePairId).toBe(42);
    expect(req.request.body.courseId).toBe('course-1');
    req.flush({ data: makeLessonDto({ id: 1 }) });
    await promise;
  });

  it('should omit languagePairId and courseId when not provided', async () => {
    const payload: LessonCreatePayload = {
      programId: '10',
      title: 'Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
    };
    const promise = service.create(payload);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons'));
    expect(req.request.body.languagePairId).toBeUndefined();
    expect(req.request.body.courseId).toBeUndefined();
    req.flush({ data: makeLessonDto({ id: 1 }) });
    await promise;
  });

  it('should stringify prerequisiteLessonIds', async () => {
    const payload: LessonCreatePayload = {
      programId: '10',
      title: 'Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: ['prereq-1', 'prereq-2'],
      requiredTier: 'FREE',
    };
    const promise = service.create(payload);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons'));
    expect(req.request.body.prerequisiteLessonIds).toBe('["prereq-1","prereq-2"]');
    req.flush({ data: makeLessonDto({ id: 1 }) });
    await promise;
  });

  // ── update ──

  it('should update a lesson', async () => {
    const payload: LessonUpdatePayload = {
      title: 'Updated',
      description: 'New desc',
      order: 2,
      prerequisiteLessonIds: ['1'],
      published: false,
      requiredTier: 'STARTER',
    };
    const promise = service.update('5', payload);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/5'));
    expect(req.request.method).toBe('PUT');
    req.flush({ data: makeLessonDto({ id: 5, published: false }) });

    const result = await promise;
    expect(result.published).toBe(false);
  });

  it('should include languagePairId and courseId in update when provided', async () => {
    const payload: LessonUpdatePayload = {
      title: 'Updated',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      languagePairId: 42,
      courseId: 'course-1',
    };
    const promise = service.update('5', payload);

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/5'));
    expect(req.request.body.languagePairId).toBe(42);
    expect(req.request.body.courseId).toBe('course-1');
    req.flush({ data: makeLessonDto({ id: 5 }) });
    await promise;
  });

  // ── delete ──

  it('should delete a lesson by numeric id', async () => {
    const promise = service.delete('42');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/42'));
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    await promise;
  });

  it('should delete a lesson by slug id', async () => {
    const promise = service.delete('lesson-slug');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/lesson-slug'));
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    await promise;
  });

  // ── mapLessonDto edge cases ──

  it('should handle lesson dto with missing optional fields', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({
      data: {
        id: 1,
        programId: 10,
        title: 'Minimal',
        lessonOrder: null as unknown as number,
        lessonDescription: null as unknown as string,
        scenarioIds: null as unknown as number[],
        prerequisiteLessonIds: null as unknown as string,
        updatedAt: '',
      } as Lesson,
    });

    const result = await promise;
    expect(result.title).toBe('Minimal');
    expect(result.description).toBe('');
    expect(result.order).toBe(0);
    expect(result.scenarioIds).toEqual([]);
    expect(result.prerequisiteLessonIds).toEqual([]);
  });

  it('should handle lesson dto with null data', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({ data: null });

    // When data is null, mapLessonDto receives undefined
    const result = await promise;
    expect(result.id).toBe('');
    expect(result.programId).toBe('');
  });

  it('should handle empty prerequisiteLessonIds string', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({
      data: makeLessonDto({ prerequisiteLessonIds: '' }),
    });

    const result = await promise;
    expect(result.prerequisiteLessonIds).toEqual([]);
  });

  it('should handle malformed prerequisiteLessonIds JSON', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({
      data: makeLessonDto({ prerequisiteLessonIds: 'not-json' }),
    });

    const result = await promise;
    expect(result.prerequisiteLessonIds).toEqual([]);
  });

  it('should handle prerequisiteLessonIds as non-array JSON', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({
      data: makeLessonDto({ prerequisiteLessonIds: '"single-string"' }),
    });

    const result = await promise;
    expect(result.prerequisiteLessonIds).toEqual([]);
  });

  it('should map string scenarioIds to string array', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({
      data: makeLessonDto({ scenarioIds: [1, 2, 3] }),
    });

    const result = await promise;
    expect(result.scenarioIds).toEqual(['1', '2', '3']);
  });

  it('should map languagePairId and courseId from dto', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({
      data: makeLessonDto({ languagePairId: 42, courseId: 100 }),
    });

    const result = await promise;
    expect(result.languagePairId).toBe(42);
    expect(result.courseId).toBe('100');
  });

  it('should handle undefined dto in getById', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/lessons/1'));
    req.flush({ data: undefined });

    const result = await promise;
    expect(result.id).toBe('');
    expect(result.programId).toBe('');
    expect(result.title).toBe('');
  });
});
