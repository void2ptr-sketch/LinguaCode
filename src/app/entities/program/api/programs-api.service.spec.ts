import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProgramsApiService } from './programs-api.service';
import type { Program, ProgramWithLessons } from '../model';
import type { ProgramWritePayload } from '../repository/program-catalog.port';

describe('ProgramsApiService', () => {
  let service: ProgramsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProgramsApiService,
        { provide: HttpClient, useFactory: () => TestBed.inject(HttpClient) },
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProgramsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── search ──

  it('should search programs with query', () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          title: 'Program 1',
          courseId: 10,
          lessonIds: [1, 2],
          order: 0,
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
    };

    service.search({ query: 'test', page: { page: 0, pageSize: 10 } }).then((result) => {
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Program 1');
      expect(result.totalItems).toBe(1);
      expect(result.page).toBe(0);
    });

    const req = httpMock.expectOne('/api/v1/programs/search');
    expect(req.request.params.get('query')).toBe('test');
    req.flush(mockResponse);
  });

  it('should search programs with courseId', () => {
    const mockResponse = { data: [], total: 0 };

    service.search({ courseId: 42, page: { page: 0, pageSize: 20 } }).then((result) => {
      expect(result.items).toEqual([]);
    });

    const req = httpMock.expectOne('/api/v1/programs/search');
    expect(req.request.params.get('courseId')).toBe('42');
    req.flush(mockResponse);
  });

  it('should handle empty search results', () => {
    const mockResponse = { data: [], total: 0 };

    service.search({ page: { page: 0, pageSize: 10 } }).then((result) => {
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    const req = httpMock.expectOne('/api/v1/programs/search');
    req.flush(mockResponse);
  });

  // ── getById ──

  it('should get program by id with lessons', () => {
    const mockResponse = {
      data: {
        id: 1,
        title: 'Program 1',
        programDescription: 'Description',
        courseId: 10,
        lessonIds: [1],
        order: 0,
        requiredTier: 'FREE',
        published: true,
        updatedAt: '2026-01-01T00:00:00Z',
        lessons: [
          {
            id: 1,
            title: 'Lesson 1',
            lessonDescription: 'Desc',
            programId: 1,
            scenarioIds: [1],
            lessonOrder: 0,
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      },
    };

    service.getById('1').then((result) => {
      expect(result.id).toBe('1');
      expect(result.title).toBe('Program 1');
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].id).toBe('1');
      expect(result.lessons[0].scenarioIds).toEqual(['1']);
    });

    const req = httpMock.expectOne('/api/v1/programs/1');
    req.flush(mockResponse);
  });

  it('should handle program without lessons', () => {
    const mockResponse = {
      data: {
        id: 2,
        title: 'Empty Program',
        courseId: 10,
        lessonIds: [],
        order: 0,
        updatedAt: '2026-01-01T00:00:00Z',
        lessons: [],
      },
    };

    service.getById('2').then((result) => {
      expect(result.lessons).toEqual([]);
    });

    const req = httpMock.expectOne('/api/v1/programs/2');
    req.flush(mockResponse);
  });

  // ── getByCourse ──

  it('should get programs by course', () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          title: 'Program 1',
          courseId: 10,
          lessonIds: [1],
          order: 0,
          updatedAt: '2026-01-01T00:00:00Z',
          lessons: [],
        },
      ],
    };

    service.getByCourse('10').then((result) => {
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    const req = httpMock.expectOne('/api/v1/programs/by-course/10');
    req.flush(mockResponse);
  });

  it('should handle empty course programs', () => {
    const mockResponse = { data: [] };

    service.getByCourse('999').then((result) => {
      expect(result).toEqual([]);
    });

    const req = httpMock.expectOne('/api/v1/programs/by-course/999');
    req.flush(mockResponse);
  });

  // ── getByCourseWithLessons ──

  it('should get programs with lessons by course', () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          title: 'Program 1',
          courseId: 10,
          lessonIds: [1],
          order: 0,
          updatedAt: '2026-01-01T00:00:00Z',
          lessons: [
            {
              id: 1,
              title: 'Lesson 1',
              programId: 1,
              lessonOrder: 0,
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ],
        },
      ],
    };

    service.getByCourseWithLessons('10').then((result) => {
      expect(result).toHaveLength(1);
      expect(result[0].lessons).toHaveLength(1);
    });

    const req = httpMock.expectOne('/api/v1/programs/by-course/10/with-lessons');
    req.flush(mockResponse);
  });

  // ── getLessons ──

  it('should get lessons for a program', () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          title: 'Lesson 1',
          programId: 1,
          lessonOrder: 0,
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          title: 'Lesson 2',
          programId: 1,
          lessonOrder: 1,
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    };

    service.getLessons('1').then((result) => {
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    const req = httpMock.expectOne('/api/v1/programs/1/lessons');
    req.flush(mockResponse);
  });

  it('should handle program with no lessons', () => {
    const mockResponse = { data: [] };

    service.getLessons('999').then((result) => {
      expect(result).toEqual([]);
    });

    const req = httpMock.expectOne('/api/v1/programs/999/lessons');
    req.flush(mockResponse);
  });

  // ── create ──

  it('should create a program', () => {
    const payload: ProgramWritePayload = {
      title: 'New Program',
      description: 'Description',
      courseId: '10',
      order: 0,
    };

    const mockResponse = {
      data: {
        id: 5,
        title: 'New Program',
        programDescription: 'Description',
        courseId: 10,
        lessonIds: [],
        order: 0,
        updatedAt: '2026-01-01T00:00:00Z',
      },
    };

    service.create(payload).then((result) => {
      expect(result.id).toBe('5');
      expect(result.title).toBe('New Program');
    });

    const req = httpMock.expectOne('/api/v1/programs');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should convert numeric course ID to number', () => {
    const payload: ProgramWritePayload = {
      title: 'Test',
      courseId: '42',
    };

    const mockResponse = { data: { id: 1, title: 'Test', courseId: 42, lessonIds: [], order: 0, updatedAt: '' } };

    service.create(payload).then(() => {
      const req = httpMock.expectOne('/api/v1/programs');
      expect(req.request.body.courseId).toBe(42);
      req.flush(mockResponse);
    });
  });

  // ── update ──

  it('should update a program', () => {
    const payload: ProgramWritePayload = {
      title: 'Updated',
      description: 'New desc',
      courseId: '10',
      lessonIds: [],
      requiredTier: 'FREE',
      published: true,
      order: 1,
    };

    const mockResponse = {
      data: {
        id: 1,
        title: 'Updated',
        programDescription: 'New desc',
        courseId: 10,
        lessonIds: [],
        order: 1,
        published: true,
        updatedAt: '2026-01-01T00:00:00Z',
      },
    };

    service.update('1', payload).then((result) => {
      expect(result.title).toBe('Updated');
      expect(result.published).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/programs/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  // ── delete ──

  it('should delete a program', () => {
    service.delete('1').then(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/programs/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  // ── mapProgram with missing fields ──

  it('should handle program with missing optional fields', () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          title: 'Minimal',
          courseId: 10,
          lessonIds: null,
          order: null,
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
    };

    service.search({ page: { page: 0, pageSize: 10 } }).then((result) => {
      expect(result.items[0].lessonCount).toBe(0);
      expect(result.items[0].order).toBe(0);
    });

    const req = httpMock.expectOne('/api/v1/programs/search');
    req.flush(mockResponse);
  });

  // ── mapLesson with prerequisiteLessonIds as string ──

  it('should parse prerequisiteLessonIds as comma-separated string', () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          title: 'Lesson',
          programId: 1,
          scenarioIds: [1, 2],
          prerequisiteLessonIds: '3,4,5',
          lessonOrder: 0,
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    };

    service.getLessons('1').then((result) => {
      expect(result[0].prerequisiteLessonIds).toEqual(['3', '4', '5']);
    });

    const req = httpMock.expectOne('/api/v1/programs/1/lessons');
    req.flush(mockResponse);
  });
});
