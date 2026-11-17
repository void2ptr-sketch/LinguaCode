import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildApiUrl } from '../../../shared/api/api-url';
import { ProgramsApiService } from './programs-api.service';
import type { ProgramWritePayload } from '../repository/program-catalog.port';

const matchUrl = (url: string) => (r: { url: string }) => r.url === url;

describe('ProgramsApiService', () => {
  let service: ProgramsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProgramsApiService],
    });
    service = TestBed.inject(ProgramsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ── search ──

  it('should search programs with query', async () => {
    const promise = service.search({ query: 'test', page: { page: 0, pageSize: 10 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    expect(req.request.params.get('query')).toBe('test');
    req.flush({
      data: [{ id: 1, title: 'Program 1', courseId: 10, lessonIds: [1, 2], order: 0, updatedAt: '2026-01-01T00:00:00Z' }],
      total: 1,
    });

    const result = await promise;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Program 1');
    expect(result.totalItems).toBe(1);
  });

  it('should search programs with courseId', async () => {
    const promise = service.search({ courseId: '42', page: { page: 0, pageSize: 20 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    expect(req.request.params.get('courseId')).toBe('42');
    req.flush({ data: [], total: 0 });

    const result = await promise;
    expect(result.items).toEqual([]);
  });

  it('should handle empty search results', async () => {
    const promise = service.search({ page: { page: 0, pageSize: 10 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    req.flush({ data: [], total: 0 });

    const result = await promise;
    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  // ── getById ──

  it('should get program by id with lessons', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1')));
    req.flush({
      data: {
        id: 1, title: 'Program 1', programDescription: 'Desc', courseId: 10,
        lessonIds: [1], order: 0, requiredTier: 'FREE', published: true, updatedAt: '2026-01-01T00:00:00Z',
        lessons: [{ id: 1, title: 'Lesson 1', programId: 1, scenarioIds: [1], lessonOrder: 0, updatedAt: '2026-01-01T00:00:00Z' }],
      },
    });

    const result = await promise;
    expect(result.id).toBe('1');
    expect(result.lessons).toHaveLength(1);
    expect(result.lessons[0].scenarioIds).toEqual(['1']);
  });

  it('should handle program without lessons', async () => {
    const promise = service.getById('2');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/2')));
    req.flush({
      data: { id: 2, title: 'Empty', courseId: 10, lessonIds: [], order: 0, updatedAt: '', lessons: [] },
    });

    const result = await promise;
    expect(result.lessons).toEqual([]);
  });

  // ── getByCourse ──

  it('should get programs by course', async () => {
    const promise = service.getByCourse('10');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/by-course/10')));
    req.flush({
      data: [{ id: 1, title: 'P1', courseId: 10, lessonIds: [1], order: 0, updatedAt: '', lessons: [] }],
    });

    const result = await promise;
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should handle empty course programs', async () => {
    const promise = service.getByCourse('999');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/by-course/999')));
    req.flush({ data: [] });

    const result = await promise;
    expect(result).toEqual([]);
  });

  // ── getByCourseWithLessons ──

  it('should get programs with lessons by course', async () => {
    const promise = service.getByCourseWithLessons('10');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/by-course/10/with-lessons')));
    req.flush({
      data: [{ id: 1, title: 'P1', courseId: 10, lessonIds: [1], order: 0, updatedAt: '', lessons: [{ id: 1, title: 'L1', programId: 1, lessonOrder: 0, updatedAt: '' }] }],
    });

    const result = await promise;
    expect(result[0].lessons).toHaveLength(1);
  });

  // ── getLessons ──

  it('should get lessons for a program', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [
        { id: 1, title: 'L1', programId: 1, lessonOrder: 0, updatedAt: '' },
        { id: 2, title: 'L2', programId: 1, lessonOrder: 1, updatedAt: '' },
      ],
    });

    const result = await promise;
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
  });

  it('should handle program with no lessons', async () => {
    const promise = service.getLessons('999');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/999/lessons')));
    req.flush({ data: [] });

    const result = await promise;
    expect(result).toEqual([]);
  });

  // ── create ──

  it('should create a program', async () => {
    const payload: ProgramWritePayload = {
      title: 'New Program', description: 'Desc', courseId: '10',
      lessonIds: [], order: 0, requiredTier: 'FREE',
    };
    const promise = service.create(payload);

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs')));
    expect(req.request.method).toBe('POST');
    req.flush({
      data: { id: 5, title: 'New Program', programDescription: 'Desc', courseId: 10, lessonIds: [], order: 0, updatedAt: '' },
    });

    const result = await promise;
    expect(result.id).toBe('5');
  });

  it('should convert numeric course ID to number', async () => {
    const payload: ProgramWritePayload = {
      title: 'Test', description: '', courseId: '42',
      lessonIds: [], order: 0, requiredTier: 'FREE',
    };
    const promise = service.create(payload);

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs')));
    expect(req.request.body.courseId).toBe(42);
    req.flush({ data: { id: 1, title: 'Test', courseId: 42, lessonIds: [], order: 0, updatedAt: '' } });
    await promise;
  });

  // ── update ──

  it('should update a program', async () => {
    const payload: ProgramWritePayload = {
      title: 'Updated', description: 'New', courseId: '10',
      lessonIds: [], requiredTier: 'FREE', published: true, order: 1,
    };
    const promise = service.update('1', payload);

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1')));
    expect(req.request.method).toBe('PUT');
    req.flush({
      data: { id: 1, title: 'Updated', programDescription: 'New', courseId: 10, lessonIds: [], order: 1, published: true, updatedAt: '' },
    });

    const result = await promise;
    expect(result.published).toBe(true);
  });

  // ── delete ──

  it('should delete a program', async () => {
    const promise = service.delete('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1')));
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    await promise;
  });

  // ── edge cases ──

  it('should handle program with missing optional fields', async () => {
    const promise = service.search({ page: { page: 0, pageSize: 10 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    req.flush({
      data: [{ id: 1, title: 'Minimal', courseId: 10, lessonIds: null, order: null, updatedAt: '' }],
      total: 1,
    });

    const result = await promise;
    expect(result.items[0].lessonCount).toBe(0);
    expect(result.items[0].order).toBe(0);
  });

  it('should parse prerequisiteLessonIds as comma-separated string', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [{ id: 1, title: 'L', programId: 1, scenarioIds: [1], prerequisiteLessonIds: '3,4,5', lessonOrder: 0, updatedAt: '' }],
    });

    const result = await promise;
    expect(result[0].prerequisiteLessonIds).toEqual(['3', '4', '5']);
  });

  // ── map edge cases ──

  it('should handle program with null fields in search results', async () => {
    const promise = service.search({ page: { page: 0, pageSize: 10 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    req.flush({
      data: [{ id: 1, title: null, courseId: null, lessonIds: null, order: null, updatedAt: null }],
      total: 1,
    });

    const result = await promise;
    expect(result.items[0].id).toBe('1');
    expect(result.items[0].title).toBe('');
    expect(result.items[0].courseId).toBe('');
    expect(result.items[0].lessonCount).toBe(0);
    expect(result.items[0].order).toBe(0);
  });

  it('should handle program with missing fields in search results', async () => {
    const promise = service.search({ page: { page: 0, pageSize: 10 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    req.flush({
      data: [{ id: 1 }],
      total: 1,
    });

    const result = await promise;
    expect(result.items[0].id).toBe('1');
    expect(result.items[0].title).toBe('');
    expect(result.items[0].order).toBe(0);
  });

  it('should handle program without lessons in getByCourseWithLessons', async () => {
    const promise = service.getByCourseWithLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/by-course/1/with-lessons')));
    req.flush({
      data: [{ id: 1, title: 'P', courseId: 10, lessonIds: [1], order: 0, updatedAt: '' }],
    });

    const result = await promise;
    expect(result[0].lessons).toEqual([]);
  });

  it('should handle lesson with null scenarioIds', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [{ id: 1, title: 'L', programId: 1, scenarioIds: null, lessonOrder: 0, updatedAt: '' }],
    });

    const result = await promise;
    expect(result[0].scenarioIds).toEqual([]);
  });

  it('should handle lesson with undefined prerequisiteLessonIds', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [{ id: 1, title: 'L', programId: 1, prerequisiteLessonIds: undefined, lessonOrder: 0, updatedAt: '' }],
    });

    const result = await promise;
    expect(result[0].prerequisiteLessonIds).toEqual([]);
  });

  it('should handle lesson with numeric prerequisiteLessonIds array', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [{ id: 1, title: 'L', programId: 1, prerequisiteLessonIds: [10, 20], lessonOrder: 0, updatedAt: '' }],
    });

    const result = await promise;
    expect(result[0].prerequisiteLessonIds).toEqual(['10', '20']);
  });

  it('should handle lesson with empty string prerequisiteLessonIds', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [{ id: 1, title: 'L', programId: 1, prerequisiteLessonIds: '', lessonOrder: 0, updatedAt: '' }],
    });

    const result = await promise;
    expect(result[0].prerequisiteLessonIds).toEqual([]);
  });

  it('should handle program with missing requiredTier and published', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1')));
    req.flush({
      data: { id: 1, title: 'P', courseId: 10, lessonIds: [], order: 0, updatedAt: '' },
    });

    const result = await promise;
    expect(result.requiredTier).toBeUndefined();
    expect(result.published).toBeUndefined();
  });

  it('should handle search result with missing lessonIds in index entry', async () => {
    const promise = service.search({ page: { page: 0, pageSize: 10 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    req.flush({
      data: [{ id: 1, title: 'P', lessonIds: undefined }],
      total: 1,
    });

    const result = await promise;
    expect(result.items[0].lessonCount).toBe(0);
  });

  // ── mapProgram null branches ──

  it('should use empty defaults when mapProgram receives all null fields', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1')));
    req.flush({
      data: {
        id: null,
        courseId: null,
        title: null,
        programDescription: null,
        description: null,
        lessonIds: null,
        order: null,
        updatedAt: null,
      },
    });

    const result = await promise;
    expect(result.id).toBe('');
    expect(result.courseId).toBe('');
    expect(result.title).toBe('');
    expect(result.description).toBe('');
    expect(result.lessonIds).toEqual([]);
    expect(result.order).toBe(0);
    expect(result.updatedAt).toBe('');
  });

  it('should use empty defaults when mapProgram receives undefined fields', async () => {
    const promise = service.getById('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1')));
    req.flush({
      data: {},
    });

    const result = await promise;
    expect(result.id).toBe('');
    expect(result.courseId).toBe('');
    expect(result.title).toBe('');
    expect(result.description).toBe('');
    expect(result.lessonIds).toEqual([]);
    expect(result.order).toBe(0);
    expect(result.updatedAt).toBe('');
  });

  // ── mapProgramWithLessons null branches ──

  it('should handle null fields in getByCourseWithLessons program data', async () => {
    const promise = service.getByCourseWithLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/by-course/1/with-lessons')));
    req.flush({
      data: [{
        id: null,
        courseId: null,
        title: null,
        lessonIds: null,
        order: null,
        updatedAt: null,
        lessons: [{
          id: null,
          programId: null,
          title: null,
          lessonDescription: null,
          scenarioIds: null,
          prerequisiteLessonIds: null,
          lessonOrder: null,
          updatedAt: null,
        }],
      }],
    });

    const result = await promise;
    expect(result[0].id).toBe('');
    expect(result[0].title).toBe('');
    expect(result[0].lessons[0].id).toBe('');
    expect(result[0].lessons[0].programId).toBe('');
    expect(result[0].lessons[0].title).toBe('');
    expect(result[0].lessons[0].description).toBe('');
    expect(result[0].lessons[0].scenarioIds).toEqual([]);
    expect(result[0].lessons[0].prerequisiteLessonIds).toEqual([]);
    expect(result[0].lessons[0].order).toBe(0);
    expect(result[0].lessons[0].updatedAt).toBe('');
  });

  // ── buildProgramSearchParams without page ──
  // Note: page is required by ProgramSearchCriteria type, so the
  // `if (criteria.page)` branch is always truthy at runtime.
  // We still verify page params are passed through correctly.

  it('should pass page params through when provided', async () => {
    const promise = service.search({ query: 'test', page: { page: 2, pageSize: 25 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('25');
    req.flush({ data: [], total: 0 });
    await promise;
  });

  // ── mapLesson null branches ──

  it('should use empty defaults when mapLesson receives all null fields', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [{
        id: null,
        programId: null,
        title: null,
        lessonDescription: null,
        scenarioIds: null,
        prerequisiteLessonIds: null,
        lessonOrder: null,
        updatedAt: null,
      }],
    });

    const result = await promise;
    expect(result[0].id).toBe('');
    expect(result[0].programId).toBe('');
    expect(result[0].title).toBe('');
    expect(result[0].description).toBe('');
    expect(result[0].scenarioIds).toEqual([]);
    expect(result[0].prerequisiteLessonIds).toEqual([]);
    expect(result[0].order).toBe(0);
    expect(result[0].updatedAt).toBe('');
  });

  it('should use empty defaults when mapLesson receives undefined fields', async () => {
    const promise = service.getLessons('1');

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/1/lessons')));
    req.flush({
      data: [{}],
    });

    const result = await promise;
    expect(result[0].id).toBe('');
    expect(result[0].programId).toBe('');
    expect(result[0].title).toBe('');
    expect(result[0].description).toBe('');
    expect(result[0].scenarioIds).toEqual([]);
    expect(result[0].prerequisiteLessonIds).toEqual([]);
    expect(result[0].order).toBe(0);
    expect(result[0].updatedAt).toBe('');
  });

  // ── mapProgramIndexEntry null branches ──

  it('should use empty defaults when mapProgramIndexEntry receives null fields', async () => {
    const promise = service.search({ page: { page: 0, pageSize: 10 } });

    const req = httpMock.expectOne(matchUrl(buildApiUrl('/programs/search')));
    req.flush({
      data: [{
        id: null,
        courseId: null,
        title: null,
        lessonIds: null,
        order: null,
        updatedAt: null,
      }],
      total: 1,
    });

    const result = await promise;
    expect(result.items[0].id).toBe('');
    expect(result.items[0].courseId).toBe('');
    expect(result.items[0].title).toBe('');
    expect(result.items[0].order).toBe(0);
    expect(result.items[0].updatedAt).toBe('');
    expect(result.items[0].lessonCount).toBe(0);
  });
});
