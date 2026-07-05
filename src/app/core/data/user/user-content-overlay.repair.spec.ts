import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';

import type { Course, Scenario } from '../../models';
import type { UserContentOverlay } from './user-content-overlay.types';
import {
  bindPerlInterviewCourseLanguagePair,
  migratePerlInterviewAuthoringToSeed,
  PERL_INTERVIEW_COURSE_ID,
  PERL_INTERVIEW_COURSE_TITLE,
  RU_PERL_LANGUAGE_PAIR,
  USER_CONTENT_OVERLAY_REPAIR_KEY,
  USER_CONTENT_OVERLAY_REPAIR_VERSION,
  repairUserContentOverlayIfNeeded,
} from './user-content-overlay.repair';
import { USER_CONTENT_OVERLAY_KEY } from './user-content-overlay.types';

describe('user-content-overlay.repair', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should bind perl interview course and related content to ru→perl', () => {
    const overlay: UserContentOverlay = {
      version: 1,
      courses: {
        'user-course-1': {
          id: 'user-course-1',
          title: PERL_INTERVIEW_COURSE_TITLE,
          description: 'Draft',
          authorId: 'local-user',
          languagePair: { known: 'ru', learning: 'en' },
          lessonIds: ['lesson-1'],
          published: false,
          updatedAt: '2026-06-14T00:00:00.000Z',
        } satisfies Course,
      },
      lessons: {
        'lesson-1': {
          id: 'lesson-1',
          courseId: 'user-course-1',
          title: 'Урок 1',
          description: '',
          scenarioIds: ['scenario-1'],
          prerequisiteLessonIds: [],
          order: 0,
          updatedAt: '2026-06-14T00:00:00.000Z',
        },
      },
      scenarios: {
        'scenario-1': {
          id: 'scenario-1',
          title: 'Perl basics',
          description: '',
          authorId: 'local-user',
          published: false,
          updatedAt: '2026-06-14T00:00:00.000Z',
          languagePair: { known: 'ru', learning: 'en' },
          cardSource: { mode: 'fixed', cardIds: ['card-1'] },
        } satisfies Scenario,
      },
      cards: {},
      cardIndexMeta: {
        'card-1': {
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
      },
      deletedSystemIds: {},
    };

    const result = bindPerlInterviewCourseLanguagePair(overlay);

    expect(result.changed).toBeTrue();
    expect((result.overlay.courses['user-course-1'] as Course).languagePair).toEqual(
      RU_PERL_LANGUAGE_PAIR,
    );
    expect((result.overlay.scenarios['scenario-1'] as Scenario).languagePair).toEqual(
      RU_PERL_LANGUAGE_PAIR,
    );
    expect(result.overlay.cardIndexMeta['card-1']).toEqual(
      jasmine.objectContaining({
        knownLanguage: 'ru',
        learningLanguage: 'perl',
      }),
    );
  });

  it('should migrate authoring to seed course and remove duplicate user course', () => {
    const overlay: UserContentOverlay = {
      version: 1,
      courses: {
        'user-course-1': {
          id: 'user-course-1',
          title: PERL_INTERVIEW_COURSE_TITLE,
          description: 'Draft',
          authorId: 'local-user',
          languagePair: RU_PERL_LANGUAGE_PAIR,
          lessonIds: ['lesson-1'],
          published: false,
          updatedAt: '2026-06-14T00:00:00.000Z',
          authoring: {
            idea: '# Perl interview\n\nFocus on scalar context.',
            status: 'draft',
            ideaUpdatedAt: '2026-06-14T00:00:00.000Z',
          },
        } satisfies Course,
      },
      lessons: {
        'lesson-1': {
          id: 'lesson-1',
          courseId: 'user-course-1',
          title: 'Урок 1',
          description: '',
          scenarioIds: [],
          prerequisiteLessonIds: [],
          order: 0,
          updatedAt: '2026-06-14T00:00:00.000Z',
        },
      },
      scenarios: {},
      cards: {},
      cardIndexMeta: {},
      deletedSystemIds: {},
    };

    const result = migratePerlInterviewAuthoringToSeed(overlay);

    expect(result.changed).toBeTrue();
    expect(result.overlay.courses['user-course-1']).toBeUndefined();
    expect(result.overlay.lessons['lesson-1']).toBeUndefined();
    expect((result.overlay.courses[PERL_INTERVIEW_COURSE_ID] as Course).authoring?.idea).toContain(
      'scalar context',
    );
  });

  it('should persist repair once through localStorage', () => {
    localStorage.setItem(
      USER_CONTENT_OVERLAY_KEY,
      JSON.stringify({
        version: 1,
        courses: {
          'user-course-1': {
            id: 'user-course-1',
            title: PERL_INTERVIEW_COURSE_TITLE,
            description: '',
            authorId: 'local-user',
            languagePair: { known: 'ru', learning: 'en' },
            lessonIds: [],
            published: false,
            updatedAt: '2026-06-14T00:00:00.000Z',
          },
        },
        lessons: {},
        scenarios: {},
        cards: {},
        cardIndexMeta: {},
        deletedSystemIds: {},
      }),
    );

    TestBed.configureTestingModule({ imports: [BrowserModule] });

    repairUserContentOverlayIfNeeded();
    repairUserContentOverlayIfNeeded();

    expect(localStorage.getItem(USER_CONTENT_OVERLAY_REPAIR_KEY)).toBe(
      USER_CONTENT_OVERLAY_REPAIR_VERSION,
    );
    const stored = JSON.parse(localStorage.getItem(USER_CONTENT_OVERLAY_KEY) ?? '{}') as UserContentOverlay;
    expect(stored.courses['user-course-1']).toBeUndefined();
  });
});
