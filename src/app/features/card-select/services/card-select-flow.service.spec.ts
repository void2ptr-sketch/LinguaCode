import { TestBed } from '@angular/core/testing';
import { CourseSearchService } from '../../../entities/course';
import { CardSearchService } from '../../../entities/card';
import { ScenarioSearchService } from '../../../entities/scenario';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CardSelectFlowService, LEARNING_TAB } from './card-select-flow.service';
import type { CourseWithLessons } from '../../../entities/course/model';

describe('CardSelectFlowService', () => {
  let service: CardSelectFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CardSelectFlowService,
        {
          provide: CourseSearchService,
          useValue: {
            getById: async () => ({
              id: 'c1',
              title: 'Test Course',
              lessons: [],
              lessonIds: [],
              description: '',
              authorId: 'u1',
              published: true,
              updatedAt: '2026-01-01T00:00:00.000Z',
              languagePair: { known: 'ru', learning: 'en' },
              practiceSettings: {
                mode: 'guided',
                allowDifficultyFilter: false,
                enforceLessonPrerequisites: true,
                requireLessonForScenarios: true,
              },
            } as CourseWithLessons),
          },
        },
        { provide: CardSearchService, useValue: { ensureIndexLoaded: async () => {}, indexEntries: () => [] } },
        {
          provide: ScenarioSearchService,
          useValue: { getById: async () => ({ id: 's1', title: 'Test', cardSource: { mode: 'fixed', cardIds: [] } }) },
        },
        { provide: AppLoggerService, useValue: { warn: () => {}, debug: () => {} } },
      ],
    });

    service = TestBed.inject(CardSelectFlowService);
  });

  afterEach(() => {
    service.resetAll();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('LEARNING_TAB', () => {
    it('should have correct tab indices', () => {
      expect(LEARNING_TAB.course).toBe(0);
      expect(LEARNING_TAB.lessons).toBe(1);
      expect(LEARNING_TAB.scenarios).toBe(2);
      expect(LEARNING_TAB.learning).toBe(3);
    });
  });

  describe('initial state', () => {
    it('should have empty selectedCourseId', () => {
      expect(service.selectedCourseId()).toBe('');
    });

    it('should have empty selectedLessonId', () => {
      expect(service.selectedLessonId()).toBe('');
    });

    it('should have null currentCourse', () => {
      expect(service.currentCourse()).toBeNull();
    });

    it('should start on course tab', () => {
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.course);
    });

    it('should have empty courseTitle', () => {
      expect(service.courseTitle()).toBe('');
    });

    it('should have null missingCardsWarning', () => {
      expect(service.missingCardsWarning()).toBeNull();
    });
  });

  describe('computed values', () => {
    it('should not be open practice with empty course', () => {
      expect(service.isOpenPractice()).toBe(false);
    });

    it('should not allow advancement without course', () => {
      expect(service.canAdvanceFromCourse()).toBe(false);
    });

    it('should not allow advancement without lesson', () => {
      expect(service.canAdvanceFromLessons()).toBe(false);
    });

    it('should not allow starting practice without scenario', () => {
      expect(service.canStartPractice()).toBe(false);
    });

    it('should show no difficulty filter by default', () => {
      expect(service.showDifficultyFilter()).toBe(false);
    });

    it('should require lesson for scenarios by default', () => {
      expect(service.requiresLessonForScenarios()).toBe(false);
    });

    it('should return empty nextStepHint for course tab when no course', () => {
      expect(service.nextStepHint()).toBe('Выберите программу, чтобы продолжить');
    });
  });

  describe('setActiveTab', () => {
    it('should set the active tab index', () => {
      service.setActiveTab(LEARNING_TAB.learning);
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.learning);
    });

    it('should set course tab', () => {
      service.setActiveTab(LEARNING_TAB.course);
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.course);
    });
  });

  describe('setCourseTitleFromLabel', () => {
    it('should extract course title from label with separator', () => {
      service.setCourseTitleFromLabel('My Course · Part 2');
      expect(service.courseTitle()).toBe('My Course');
    });

    it('should use full label when no separator present', () => {
      service.setCourseTitleFromLabel('My Course');
      expect(service.courseTitle()).toBe('My Course');
    });
  });

  describe('setScenarioSourceLabelFromPicker', () => {
    it('should extract source label from label with separator', () => {
      service.setScenarioSourceLabelFromPicker('Scenario Name · 10 cards');
      expect(service.scenarioSourceLabel()).toBe('10 cards');
    });

    it('should use full label when no separator present', () => {
      service.setScenarioSourceLabelFromPicker('No Separator');
      expect(service.scenarioSourceLabel()).toBe('No Separator');
    });
  });

  describe('clearMissingCardsWarning', () => {
    it('should clear the warning', () => {
      service['missingCardsWarning'].set('Some warning');
      service.clearMissingCardsWarning();
      expect(service.missingCardsWarning()).toBeNull();
    });
  });

  describe('onLessonChange', () => {
    it('should set lesson id and clear scenario state', () => {
      service.selectedLessonId.set('old');
      service.selectedScenarioId.set('s1');
      service.scenarioTitle.set('Old');
      service.onLessonChange('new-lesson');
      expect(service.selectedLessonId()).toBe('new-lesson');
      expect(service.selectedScenarioId()).toBe('');
      expect(service.scenarioTitle()).toBe('');
    });

    it('should clear lesson state when empty lessonId', () => {
      service.lessonTitle.set('Old Lesson');
      service.lessonScenarioIds.set(['s1', 's2']);
      service.onLessonChange('');
      expect(service.selectedLessonId()).toBe('');
      expect(service.lessonTitle()).toBe('');
      expect(service.lessonScenarioIds()).toEqual([]);
    });
  });

  describe('onScenarioChange', () => {
    it('should set scenario id', () => {
      service.onScenarioChange('s1');
      expect(service.selectedScenarioId()).toBe('s1');
    });

    it('should clear scenario metadata when deselected', () => {
      service.scenarioTitle.set('Old');
      service.scenarioSourceLabel.set('Old Source');
      service.missingCardsWarning.set('Warning');
      service.onScenarioChange('');
      expect(service.selectedScenarioId()).toBe('');
      expect(service.scenarioTitle()).toBe('');
      expect(service.scenarioSourceLabel()).toBe('');
    });
  });

  describe('onDifficultyChange', () => {
    it('should set difficulty and clear scenario', () => {
      service.selectedScenarioId.set('s1');
      service.scenarioTitle.set('Old');
      service.onDifficultyChange('beginner');
      expect(service.selectedDifficulty()).toBe('beginner');
      expect(service.selectedScenarioId()).toBe('');
      expect(service.scenarioTitle()).toBe('');
    });

    it('should clear difficulty when null', () => {
      service.selectedDifficulty.set('beginner');
      service.onDifficultyChange(null);
      expect(service.selectedDifficulty()).toBeNull();
    });
  });

  describe('goToTab', () => {
    it('should navigate to lessons tab when course is selected', () => {
      service.selectedCourseId.set('c1');
      service.goToTab(LEARNING_TAB.lessons);
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.lessons);
    });

    it('should not navigate to lessons tab when no course is selected', () => {
      service.selectedCourseId.set('');
      service.goToTab(LEARNING_TAB.lessons);
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.course);
    });

    it('should not navigate to learning tab when no scenario is selected', () => {
      service.selectedScenarioId.set('');
      service.goToTab(LEARNING_TAB.learning);
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.course);
    });

    it('should navigate to learning tab when scenario is selected', () => {
      service.selectedScenarioId.set('s1');
      service.goToTab(LEARNING_TAB.learning);
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.learning);
    });

    it('should navigate to any tab when conditions met', () => {
      service.selectedCourseId.set('c1');
      service.selectedScenarioId.set('s1');
      service.goToTab(LEARNING_TAB.scenarios);
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.scenarios);
    });
  });

  describe('advanceFromCurrentTab', () => {
    it('should start practice from scenarios tab when scenario selected', () => {
      service.selectedScenarioId.set('s1');
      service.setActiveTab(LEARNING_TAB.scenarios);
      service.advanceFromCurrentTab();
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.learning);
    });

    it('should not start practice from scenarios tab when no scenario selected', () => {
      service.selectedScenarioId.set('');
      service.setActiveTab(LEARNING_TAB.scenarios);
      service.advanceFromCurrentTab();
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.scenarios);
    });

    it('should advance from course tab to lessons tab', () => {
      service.selectedCourseId.set('c1');
      service.setActiveTab(LEARNING_TAB.course);
      service.advanceFromCurrentTab();
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.lessons);
    });

    it('should advance from lessons tab to scenarios tab', () => {
      service.selectedCourseId.set('c1');
      service.selectedLessonId.set('l1');
      service.setActiveTab(LEARNING_TAB.lessons);
      service.advanceFromCurrentTab();
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.scenarios);
    });

    it('should not advance from lessons tab when no lesson selected', () => {
      service.selectedCourseId.set('c1');
      service.selectedLessonId.set('');
      service.setActiveTab(LEARNING_TAB.lessons);
      service.advanceFromCurrentTab();
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.lessons);
    });
  });

  describe('startPractice', () => {
    it('should navigate to learning tab when scenario selected', () => {
      service.selectedScenarioId.set('s1');
      service.startPractice();
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.learning);
    });

    it('should not navigate when no scenario selected', () => {
      service.selectedScenarioId.set('');
      service.startPractice();
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.course);
    });
  });

  describe('goToNextLessonScenario', () => {
    it('should return next scenario id and switch to learning tab', () => {
      service.selectedLessonId.set('l1');
      service.lessonTitle.set('Test Lesson');
      service.lessonScenarioIds.set(['s1', 's2', 's3']);
      service.selectedScenarioId.set('s1');
      service.setActiveTab(LEARNING_TAB.scenarios);

      const nextId = service.goToNextLessonScenario();

      expect(nextId).toBe('s2');
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.learning);
      expect(service.selectedScenarioId()).toBe('s1');
    });

    it('should return null when no next scenario', () => {
      service.lessonScenarioIds.set(['s1']);
      service.selectedScenarioId.set('s1');
      const nextId = service.goToNextLessonScenario();
      expect(nextId).toBeNull();
    });

    it('should return null when not on last scenario', () => {
      service.lessonScenarioIds.set(['s1', 's2']);
      service.selectedScenarioId.set('s2');
      const nextId = service.goToNextLessonScenario();
      expect(nextId).toBeNull();
    });
  });

  describe('nextStepHint', () => {
    it('should suggest selecting course on course tab', () => {
      expect(service.nextStepHint()).toBe('Выберите программу, чтобы продолжить');
    });

    it('should suggest advancing when course selected', () => {
      service.selectedCourseId.set('c1');
      service.setActiveTab(LEARNING_TAB.course);
      expect(service.nextStepHint()).toBe('Перейдите к выбору урока');
    });

    it('should suggest selecting scenario on lessons tab', () => {
      service.selectedCourseId.set('c1');
      service.selectedLessonId.set('l1');
      service.setActiveTab(LEARNING_TAB.lessons);
      expect(service.nextStepHint()).toBe('Перейдите к выбору сценария');
    });

    it('should suggest starting practice on scenarios tab', () => {
      service.selectedCourseId.set('c1');
      service.selectedLessonId.set('l1');
      service.selectedScenarioId.set('s1');
      service.setActiveTab(LEARNING_TAB.scenarios);
      expect(service.nextStepHint()).toBe('Запустите прохождение карточек');
    });
  });

  describe('resetCourseState', () => {
    it('should reset all course-related state including active tab', () => {
      service.selectedCourseId.set('c1');
      service.courseTitle.set('Test');
      service.activeTabIndex.set(LEARNING_TAB.learning);
      service.missingCardsWarning.set('Warning');
      service.resetCourseState();
      expect(service.selectedCourseId()).toBe('');
      expect(service.courseTitle()).toBe('');
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.course);
      expect(service.missingCardsWarning()).toBeNull();
    });
  });

  describe('resetAll', () => {
    it('should reset all flow state', () => {
      service.selectedCourseId.set('c1');
      service.selectedLessonId.set('l1');
      service.selectedScenarioId.set('s1');
      service.activeTabIndex.set(LEARNING_TAB.learning);
      service.resetAll();
      expect(service.selectedCourseId()).toBe('');
      expect(service.selectedLessonId()).toBe('');
      expect(service.selectedScenarioId()).toBe('');
      expect(service.activeTabIndex()).toBe(LEARNING_TAB.course);
    });
  });
});
