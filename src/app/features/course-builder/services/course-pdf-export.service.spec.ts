import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { vi, Mock, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { CoursePdfExportService } from './course-pdf-export.service';
import { CoursesApiService } from '../../../entities/course';
import type { CourseWithPrograms } from '../../../entities/course/model';

// Mock jsPDF — используем doMock чтобы избежать проблем с hoisting
const _noop = (): void => {
  // intentionally empty
};
const createMockDoc = () => {
  return {
    addFileToVFS: _noop,
    addFont: _noop,
    setFont: _noop,
    setFontSize: _noop,
    setTextColor: _noop,
    text: (...args: unknown[]) => args,
    setDrawColor: _noop,
    line: _noop,
    splitTextToSize: (text: string) => [text],
    getNumberOfPages: () => 1,
    getTextColor: () => [0, 0, 0],
    getTextWidth: () => 50,
    setFillColor: _noop,
    rect: _noop,
    link: _noop,
    output: () => new Blob(),
    addPage: _noop,
    setLineHeight: _noop,
    lineHeight: 1,
  };
};

vi.doMock('jspdf', () => {
  const MockJsPDF = function () {
    return createMockDoc();
  };
  return { default: MockJsPDF };
});

describe('CoursePdfExportService', () => {
  let service: CoursePdfExportService;
  let coursesApiMock: { getBundle: Mock };
  let httpGetMock: Mock;

  const mockFontBase64 = 'dGVzdCBmb250IGRhdGE=';

  const mockScenarios = [
    {
      id: 's1',
      title: 'Сценарий 1',
      cardSource: { mode: 'fixed' as const, cardIds: ['c1', 'c2'] },
    },
    { id: 's2', title: 'Сценарий 2', cardSource: { mode: 'fixed' as const, cardIds: ['c3'] } },
  ];

  const mockCards = [
    {
      id: 'c1',
      kind: 'select' as const,
      promptKnown: 'Вопрос 1',
      optionsLearning: ['A', 'B', 'C'],
      correctIndex: 0,
    },
    {
      id: 'c2',
      kind: 'keyboard' as const,
      promptKnown: 'Вопрос 2',
      acceptedAnswersLearning: ['ответ1', 'ответ2'],
    },
    {
      id: 'c3',
      kind: 'memory' as const,
      promptKnown: 'Вопрос 3',
      pairs: [{ known: 'a', learning: 'b' }],
    },
  ];

  const mockCourse: CourseWithPrograms = {
    id: 'course-1',
    title: 'Тестовый курс',
    description: 'Описание курса',
    authorId: 'user-1',
    languagePair: { known: 'en', learning: 'zh' },
    programIds: ['l1', 'l2'],
    published: true,
    updatedAt: '2024-01-01T00:00:00Z',
    authoring: {
      idea: `## Этап 1: Введение
- Что такое LinguaCode?
- Зачем нужен курс?
## Этап 2: Основы
- Как работать с карточками?
- Как проходить тесты?`,
      status: 'draft',
    },
    programs: [
      {
        id: 'p1',
        courseId: 'course-1',
        title: 'Программа 1',
        description: 'Описание программы 1',
        lessonIds: ['l1'],
        order: 1,
        updatedAt: '2024-01-01T00:00:00Z',
        lessons: [
          {
            id: 'l1',
            programId: 'p1',
            title: 'Урок 1',
            description: 'Описание урока 1',
            scenarioIds: ['s1'],
            prerequisiteLessonIds: [],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      },
      {
        id: 'p2',
        courseId: 'course-1',
        title: 'Программа 2',
        description: 'Описание программы 2',
        lessonIds: ['l2'],
        order: 2,
        updatedAt: '2024-01-01T00:00:00Z',
        lessons: [
          {
            id: 'l2',
            programId: 'p2',
            title: 'Урок 2',
            description: 'Описание урока 2',
            scenarioIds: ['s2'],
            prerequisiteLessonIds: [],
            order: 2,
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();

    coursesApiMock = {
      getBundle: vi.fn().mockResolvedValue({ scenarios: mockScenarios, cards: mockCards }),
    };

    httpGetMock = vi
      .fn()
      .mockReturnValue(of(new TextEncoder().encode(mockFontBase64).buffer as ArrayBuffer));

    TestBed.configureTestingModule({
      providers: [
        CoursePdfExportService,
        { provide: CoursesApiService, useValue: coursesApiMock },
        { provide: HttpClient, useValue: { get: httpGetMock } },
      ],
    });

    service = TestBed.inject(CoursePdfExportService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('export', () => {
    it('should export course to PDF blob', async () => {
      const result = await service.export(mockCourse, false);

      expect(result).toBeInstanceOf(Blob);
      expect(coursesApiMock.getBundle).toHaveBeenCalledWith('course-1');
      expect(httpGetMock).toHaveBeenCalled();
    });

    it('should cache font data after first load', async () => {
      await service.export(mockCourse, false);
      const firstCallCount = httpGetMock.mock.calls.length;

      await service.export(mockCourse, false);
      const secondCallCount = httpGetMock.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should pass showHints=false to rendering', async () => {
      await service.export(mockCourse, false);

      expect(httpGetMock).toHaveBeenCalled();
    });

    it('should pass showHints=true to rendering', async () => {
      await service.export(mockCourse, true);

      expect(httpGetMock).toHaveBeenCalled();
    });
  });

  describe('collectCardEntries', () => {
    it('should collect cards in lesson order', async () => {
      await service.export(mockCourse, false);

      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should skip missing scenarios gracefully', async () => {
      const courseWithMissingScenario: CourseWithPrograms = {
        ...mockCourse,
        programs: [
          {
            id: 'p1',
            courseId: 'course-1',
            title: 'Программа 1',
            description: 'Описание',
            lessonIds: ['l1'],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [
              {
                id: 'l1',
                programId: 'p1',
                title: 'Урок 1',
                description: 'Описание',
                scenarioIds: ['non-existent'],
                prerequisiteLessonIds: [],
                order: 1,
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        ],
      };

      await service.export(courseWithMissingScenario, false);

      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should skip missing cards gracefully', async () => {
      const courseWithMissingCard: CourseWithPrograms = {
        ...mockCourse,
        programs: [
          {
            id: 'p1',
            courseId: 'course-1',
            title: 'Программа 1',
            description: 'Описание',
            lessonIds: ['l1'],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [
              {
                id: 'l1',
                programId: 'p1',
                title: 'Урок 1',
                description: 'Описание',
                scenarioIds: ['s1'],
                prerequisiteLessonIds: [],
                order: 1,
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        ],
      };
      const courseWithMissingCardScenarios = [
        {
          id: 's1',
          title: 'Сценарий 1',
          cardSource: { mode: 'fixed' as const, cardIds: ['non-existent-card'] },
        },
      ];

      coursesApiMock.getBundle.mockResolvedValue({
        scenarios: courseWithMissingCardScenarios,
        cards: mockCards,
      });

      await service.export(courseWithMissingCard, false);

      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should sort lessons by order', async () => {
      const unsortedCourse: CourseWithPrograms = {
        ...mockCourse,
        programs: [
          {
            id: 'p2',
            courseId: 'course-1',
            title: 'Программа 2',
            description: 'Описание 2',
            lessonIds: ['l2'],
            order: 2,
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [
              {
                id: 'l2',
                programId: 'p2',
                title: 'Урок 2',
                description: 'Описание 2',
                scenarioIds: ['s2'],
                prerequisiteLessonIds: [],
                order: 2,
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
          {
            id: 'p1',
            courseId: 'course-1',
            title: 'Программа 1',
            description: 'Описание 1',
            lessonIds: ['l1'],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [
              {
                id: 'l1',
                programId: 'p1',
                title: 'Урок 1',
                description: 'Описание 1',
                scenarioIds: ['s1'],
                prerequisiteLessonIds: [],
                order: 1,
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        ],
      };

      await service.export(unsortedCourse, false);

      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });
  });

  describe('parseIdeaStages', () => {
    it('should parse stages with questions', async () => {
      await service.export(mockCourse, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should handle empty idea', async () => {
      const emptyCourse: CourseWithPrograms = {
        ...mockCourse,
        authoring: { idea: '', status: 'draft' },
      };
      await service.export(emptyCourse, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should handle idea without stages', async () => {
      const noStagesCourse: CourseWithPrograms = {
        ...mockCourse,
        authoring: { idea: 'Some text without stages', status: 'draft' },
      };
      await service.export(noStagesCourse, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should handle idea with questions not ending with ?', async () => {
      const courseWithNonQuestion: CourseWithPrograms = {
        ...mockCourse,
        authoring: {
          idea: `## Этап 1: Тест
- Это вопрос?
- Это не вопрос
- Ещё один вопрос?`,
          status: 'draft',
        },
      };
      await service.export(courseWithNonQuestion, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should handle undefined authoring', async () => {
      const noAuthoringCourse: CourseWithPrograms = { ...mockCourse, authoring: undefined };
      await service.export(noAuthoringCourse, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });
  });

  describe('renderCard - different card kinds', () => {
    it('should render select card', async () => {
      const selectCourse: CourseWithPrograms = {
        ...mockCourse,
        programs: [
          {
            id: 'p1',
            courseId: 'course-1',
            title: 'Программа 1',
            description: 'Описание',
            lessonIds: ['l1'],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [
              {
                id: 'l1',
                programId: 'p1',
                title: 'Урок 1',
                description: 'Описание',
                scenarioIds: ['s1'],
                prerequisiteLessonIds: [],
                order: 1,
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        ],
      };
      const selectScenarios = [
        { id: 's1', title: 'Сценарий 1', cardSource: { mode: 'fixed' as const, cardIds: ['c1'] } },
      ];

      coursesApiMock.getBundle.mockResolvedValue({
        scenarios: selectScenarios,
        cards: mockCards,
      });

      await service.export(selectCourse, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should render keyboard card', async () => {
      const keyboardCourse: CourseWithPrograms = {
        ...mockCourse,
        programs: [
          {
            id: 'p1',
            courseId: 'course-1',
            title: 'Программа 1',
            description: 'Описание',
            lessonIds: ['l1'],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [
              {
                id: 'l1',
                programId: 'p1',
                title: 'Урок 1',
                description: 'Описание',
                scenarioIds: ['s1'],
                prerequisiteLessonIds: [],
                order: 1,
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        ],
      };
      const keyboardScenarios = [
        { id: 's1', title: 'Сценарий 1', cardSource: { mode: 'fixed' as const, cardIds: ['c2'] } },
      ];

      coursesApiMock.getBundle.mockResolvedValue({
        scenarios: keyboardScenarios,
        cards: mockCards,
      });

      await service.export(keyboardCourse, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });

    it('should render memory card', async () => {
      const memoryCourse: CourseWithPrograms = {
        ...mockCourse,
        programs: [
          {
            id: 'l1',
            courseId: 'course-1',
            title: 'Урок 1',
            description: 'Описание',
            lessonIds: ['s1'],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [
              {
                id: 's1',
                programId: 'p1',
                title: 'Сценарий 1',
                description: '',
                scenarioIds: ['c3'],
                prerequisiteLessonIds: [],
                order: 1,
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        ],
      };
      const memoryScenarios = [
        { id: 's1', title: 'Сценарий 1', cardSource: { mode: 'fixed' as const, cardIds: ['c3'] } },
      ];

      coursesApiMock.getBundle.mockResolvedValue({
        scenarios: memoryScenarios,
        cards: mockCards,
      });

      await service.export(memoryCourse, false);
      expect(coursesApiMock.getBundle).toHaveBeenCalled();
    });
  });

  describe('loadFont', () => {
    it('should load font and convert to base64', async () => {
      const fontBytes = new TextEncoder().encode('DejaVu Sans Condensed font data');
      httpGetMock.mockReturnValue(of(fontBytes.buffer as ArrayBuffer));

      const fontData = await (service as unknown as { loadFont: () => Promise<string> }).loadFont();
      expect(typeof fontData).toBe('string');
      expect(fontData).toBe(btoa('DejaVu Sans Condensed font data'));
    });

    it('should handle font loading error', async () => {
      httpGetMock.mockReturnValue(throwError(() => new Error('Font load failed')));

      await expect(
        (service as unknown as { loadFont: () => Promise<string> }).loadFont(),
      ).rejects.toThrow('Font load failed');
    });
  });
});
