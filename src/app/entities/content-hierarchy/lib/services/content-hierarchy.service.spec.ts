import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ContentHierarchyService } from './content-hierarchy.service';
import { CourseSearchService } from '../../../course/search/course-search.service';
import { LanguagePairsApiService } from '../../../language-pair/api/language-pairs-api.service';
import { LanguageService } from '../../../language-pair/services/language.service';
import { LessonsApiService } from '../../../lesson/api/lessons-api.service';
import { ProgramsApiService } from '../../../program/api/programs-api.service';
import { ScenarioSearchService } from '../../../scenario/search/scenario-search.service';

describe('ContentHierarchyService', () => {
  let service: ContentHierarchyService;

  const languagePairsApi = {
    listAll: vi.fn(async () => [
      { id: 1, knownCode: 'ru', learningCode: 'en' },
      { id: 2, knownCode: 'ru', learningCode: 'zh' },
    ]),
  };

  const languageService = {
    load: vi.fn(async () => undefined),
    getLabels: vi.fn(() => ({ ru: 'Русский', en: 'English', zh: '中文' })),
  };

  const courseSearch = {
    search: vi.fn(async () => ({
      items: [
        { id: 'course-1', title: 'Course One' },
        { id: 'course-2', title: 'Course Two' },
      ],
    })),
    getById: vi.fn(async () => ({ id: 'course-1', title: 'Course One', languagePairId: 1 })),
  };

  const programsApi = {
    getByCourse: vi.fn(async () => [
      { id: 'program-1', title: 'Program One' },
      { id: 'program-2', title: 'Program Two' },
    ]),
    getById: vi.fn(async () => ({
      id: 'program-1',
      title: 'Program One',
      courseId: 'course-1',
      languagePairId: 1,
    })),
  };

  const lessonsApi = {
    getByProgramId: vi.fn(async () => [
      { id: 'lesson-1', title: 'Lesson One' },
      { id: 'lesson-2', title: 'Lesson Two' },
    ]),
    getById: vi.fn(async () => ({
      id: 'lesson-1',
      title: 'Lesson One',
      programId: 'program-1',
      courseId: 'course-1',
      languagePairId: 1,
    })),
  };

  const scenarioSearch = {
    getByLessonId: vi.fn(async () => [
      { id: 'scenario-1', title: 'Greeting' },
      { id: 'scenario-2', title: 'Numbers' },
    ]),
    getById: vi.fn(async () => ({
      id: 'scenario-1',
      title: 'Greeting',
      lessonId: 'lesson-1',
      programId: 'program-1',
      courseId: 'course-1',
      languagePairId: 1,
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ContentHierarchyService,
        { provide: LanguagePairsApiService, useValue: languagePairsApi },
        { provide: LanguageService, useValue: languageService },
        { provide: CourseSearchService, useValue: courseSearch },
        { provide: ProgramsApiService, useValue: programsApi },
        { provide: LessonsApiService, useValue: lessonsApi },
        { provide: ScenarioSearchService, useValue: scenarioSearch },
      ],
    });

    service = TestBed.inject(ContentHierarchyService);
  });

  it('loads and formats language pairs from the registry', async () => {
    const pairs = await service.loadLanguagePairs();

    expect(pairs).toEqual([
      { id: 1, title: 'Русский → English' },
      { id: 2, title: 'Русский → 中文' },
    ]);
    expect(languagePairsApi.listAll).toHaveBeenCalledTimes(1);
  });

  it('caches language pairs', async () => {
    await service.loadLanguagePairs();
    await service.loadLanguagePairs();

    expect(languagePairsApi.listAll).toHaveBeenCalledTimes(1);
  });

  it('loads courses filtered by languagePairIds', async () => {
    const courses = await service.loadCourses(1);

    expect(courses).toEqual([
      { id: 'course-1', title: 'Course One' },
      { id: 'course-2', title: 'Course Two' },
    ]);
    expect(courseSearch.search).toHaveBeenCalledWith({
      scope: 'all',
      languagePairIds: [1],
      page: { page: 0, pageSize: 100 },
    });
  });

  it('returns no courses without a language pair', async () => {
    const courses = await service.loadCourses(undefined);

    expect(courses).toEqual([]);
    expect(courseSearch.search).not.toHaveBeenCalled();
  });

  it('caches courses per pair and scope', async () => {
    await service.loadCourses(1);
    await service.loadCourses(1);
    await service.loadCourses(1, 'published');

    expect(courseSearch.search).toHaveBeenCalledTimes(2);
  });

  it('loads programs by course', async () => {
    const programs = await service.loadPrograms('course-1');

    expect(programs).toEqual([
      { id: 'program-1', title: 'Program One' },
      { id: 'program-2', title: 'Program Two' },
    ]);
    expect(programsApi.getByCourse).toHaveBeenCalledWith('course-1');
  });

  it('loads lessons by program', async () => {
    const lessons = await service.loadLessons('program-1');

    expect(lessons).toEqual([
      { id: 'lesson-1', title: 'Lesson One' },
      { id: 'lesson-2', title: 'Lesson Two' },
    ]);
    expect(lessonsApi.getByProgramId).toHaveBeenCalledWith('program-1');
  });

  it('loads scenarios by lesson with real titles', async () => {
    const scenarios = await service.loadScenarios('lesson-1');

    expect(scenarios).toEqual([
      { id: 'scenario-1', title: 'Greeting' },
      { id: 'scenario-2', title: 'Numbers' },
    ]);
    expect(scenarioSearch.getByLessonId).toHaveBeenCalledWith('lesson-1');
  });

  it('hydrates ancestors from a scenario', async () => {
    const hydrated = await service.hydrate({ scenarioId: 'scenario-1' });

    expect(hydrated).toEqual({
      scenarioId: 'scenario-1',
      lessonId: 'lesson-1',
      programId: 'program-1',
      courseId: 'course-1',
      languagePairId: 1,
    });
  });

  it('hydrates ancestors from a lesson when the scenario is absent', async () => {
    const hydrated = await service.hydrate({ lessonId: 'lesson-1' });

    expect(hydrated).toEqual({
      lessonId: 'lesson-1',
      programId: 'program-1',
      courseId: 'course-1',
      languagePairId: 1,
    });
  });

  it('clears caches on full invalidation', async () => {
    await service.loadLanguagePairs();
    await service.loadCourses(1);
    service.invalidate();

    await service.loadLanguagePairs();
    await service.loadCourses(1);

    expect(languagePairsApi.listAll).toHaveBeenCalledTimes(2);
    expect(courseSearch.search).toHaveBeenCalledTimes(2);
  });

  it('clears a specific parent cache', async () => {
    await service.loadPrograms('course-1');
    service.invalidate('course', 'course-1');
    await service.loadPrograms('course-1');

    expect(programsApi.getByCourse).toHaveBeenCalledTimes(2);
  });
});
