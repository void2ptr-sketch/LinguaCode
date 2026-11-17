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
});
