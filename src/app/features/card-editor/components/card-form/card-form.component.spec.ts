import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardFormComponent } from './card-form.component';
import { CardCatalogHierarchyService } from '../../../../entities/card/lib/services/card-catalog-hierarchy.service';
import { CatalogService } from '../../../../entities/card/api/catalog.service';
import type { CardDraft } from '../../types';

const appearance = { theme: 'azure-blue', fontSize: 'md' as const };

const promptLexeme = {
  primary: '你好',
  script: 'hani' as const,
  pinyin: '',
  zhuyin: '',
  palladius: '',
  ipa: '',
  audioUrl: '',
  acceptedReadings: '',
};

const baseDraft = {
  title: 'Test Card',
  appearance,
  courseId: '',
  programId: '',
  lessonId: '',
  scenarioId: '',
};

const createDraft = (kind: CardDraft['kind']): CardDraft => {
  switch (kind) {
    case 'code-select':
      return {
        ...baseDraft,
        kind,
        caption: '',
        prompt: { code: 'console.log()', language: 'javascript' },
        options: [
          { code: 'a', language: 'javascript' },
          { code: 'b', language: 'javascript' },
        ],
        correctIndex: 0,
      } as CardDraft;
    case 'keyboard':
      return {
        ...baseDraft,
        kind,
        direction: 'known-to-learning',
        promptKnown: 'Type this',
        acceptedAnswersKnown: ['answer'],
        answerMode: 'auto',
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'draw':
      return {
        ...baseDraft,
        kind,
        promptKnown: 'Draw this',
        referenceHintKnown: 'hint',
        targetCharacter: '永',
        practiceMode: 'freehand',
        radicalHint: '',
        strokeGuides: [],
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'memory':
      return {
        ...baseDraft,
        kind,
        promptKnown: 'Match these',
        pairs: [
          {
            known: 'A',
            learning: 'B',
            learningLexeme: { ...promptLexeme, primary: 'B', script: 'latn' },
          },
        ],
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'sound':
      return {
        ...baseDraft,
        kind,
        direction: 'known-to-learning',
        promptKnown: 'Listen',
        audioLabelLearning: 'Audio',
        audioLabelLexeme: { ...promptLexeme, primary: 'Audio', script: 'latn' },
        optionsKnown: ['A', 'B'],
        optionsLexemes: [
          { ...promptLexeme, primary: 'A' },
          { ...promptLexeme, primary: 'B' },
        ],
        correctIndex: 0,
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'symbol':
      return {
        ...baseDraft,
        kind,
        direction: 'known-to-learning',
        promptKnown: 'Question?',
        symbols: ['👋', '🔥'],
        symbolLexemes: [
          { ...promptLexeme, primary: '👋' },
          { ...promptLexeme, primary: '🔥' },
        ],
        optionsKnown: ['Ответ A', 'Ответ B'],
        correctIndex: 0,
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'select':
    case 'reading':
    case 'timed':
      return {
        ...baseDraft,
        kind,
        direction: 'known-to-learning',
        promptKnown: 'Question?',
        optionsLearning: ['Option A', 'Option B'],
        optionsKnown: ['Ответ A', 'Ответ B'],
        optionsLexemes: [
          { ...promptLexeme, primary: 'A' },
          { ...promptLexeme, primary: 'B' },
        ],
        correctIndex: 0,
        ...(kind === 'timed' ? { timeLimitSec: 30 } : {}),
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'tone':
      return {
        ...baseDraft,
        kind,
        direction: 'known-to-learning',
        promptKnown: 'Tone?',
        syllableBase: 'ma',
        toneOptions: [1, 2, 3, 4],
        correctIndex: 0,
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'cloze':
      return {
        ...baseDraft,
        kind,
        promptKnown: 'Fill in',
        options: ['A', 'B'],
        acceptedAnswers: ['A'],
        correctAnswer: 'A',
        correctIndex: 0,
        promptLexeme,
        audioUrl: '',
      } as CardDraft;
    case 'code-trace':
      return {
        ...baseDraft,
        kind,
        caption: '',
        question: 'What?',
        code: { code: 'print(1)', language: 'python' },
        outputOptions: ['1', '2'],
        correctIndex: 0,
      } as CardDraft;
    case 'flip':
      return {
        ...baseDraft,
        kind,
        front: 'Front',
        back: 'Back',
        audioUrl: '',
      } as CardDraft;
    default:
      return { ...baseDraft, kind: 'select' } as CardDraft;
  }
};

describe('CardFormComponent', () => {
  let component: CardFormComponent;
  let fixture: ComponentFixture<CardFormComponent>;

  const mockHierarchyService = {
    loadCourses: async (): Promise<{ id: string; title: string }[]> => [],
    loadAllCourses: async (): Promise<{ id: string; title: string }[]> => [],
    loadPrograms: async () => [],
    loadLessons: async () => [],
    getScenariosForLesson: () => [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardFormComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: CardCatalogHierarchyService, useValue: mockHierarchyService },
        {
          provide: CatalogService,
          useValue: {
            difficulties: vi.fn(() => [{ code: 'beginner', label: 'Начальный' }]),
            cardKinds: vi.fn(() => []),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CardFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('inputs', () => {
    it('should have required draft input', () => {
      expect(component.draft).toBeDefined();
    });

    it('should have previewId input with default', () => {
      expect(component.previewId).toBeDefined();
    });

    it('should have knownLanguage input with default', () => {
      expect(component.knownLanguage).toBeDefined();
    });

    it('should have learningLanguage input with default', () => {
      expect(component.learningLanguage).toBeDefined();
    });

    it('should have defaultAppearance input', () => {
      expect(component.defaultAppearance).toBeDefined();
    });

    it('should have meta input with default', () => {
      expect(component.meta).toBeDefined();
    });

    it('should have uxMode input defaulting to advanced', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      expect(component.uxMode).toBeDefined();
      expect(component.uxMode()).toBe('advanced');
    });
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });

    it('should have knownLanguageChange output', () => {
      expect(component.knownLanguageChange).toBeDefined();
    });

    it('should have learningLanguageChange output', () => {
      expect(component.learningLanguageChange).toBeDefined();
    });

    it('should have metaChange output', () => {
      expect(component.metaChange).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should load all courses regardless of the active language pair', async () => {
      const loadAllCourses = vi
        .spyOn(mockHierarchyService, 'loadAllCourses')
        .mockResolvedValue([{ id: 'course-cpp-complete', title: 'C++ Complete Course' }]);
      const loadCourses = vi.spyOn(mockHierarchyService, 'loadCourses');

      fixture.componentRef.setInput('draft', createDraft('select'));
      await component.ngOnInit();

      expect(loadAllCourses).toHaveBeenCalledTimes(1);
      expect(loadCourses).not.toHaveBeenCalled();
      expect(component.availableCourses()).toEqual([
        { id: 'course-cpp-complete', title: 'C++ Complete Course' },
      ]);
    });
  });

  describe('signals', () => {
    it('should have availableCourses signal', () => {
      expect(component.availableCourses()).toEqual([]);
    });

    it('should have availableLessons signal', () => {
      expect(component.availableLessons()).toEqual([]);
    });

    it('should have availableScenarios signal', () => {
      expect(component.availableScenarios()).toEqual([]);
    });

    it('should have kindGroup computed', () => {
      expect(component.kindGroup).toBeDefined();
    });

    it('should have effectiveAppearance computed', () => {
      expect(component.effectiveAppearance).toBeDefined();
    });

    it('should have draftForPreview computed', () => {
      expect(component.draftForPreview).toBeDefined();
    });

    it('should have previewCard computed', () => {
      expect(component.previewCard).toBeDefined();
    });

    it('should have previewFontSize computed', () => {
      expect(component.previewFontSize).toBeDefined();
    });
  });

  describe('updateDraft', () => {
    it('should emit draftChange', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      const spy = vi.spyOn(component.draftChange, 'emit');
      const newDraft = createDraft('select');
      component.updateDraft(newDraft);
      expect(spy).toHaveBeenCalledWith(newDraft);
    });
  });

  describe('updateTitle', () => {
    it('should emit updated draft with new title', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateTitle('New Title');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
    });
  });

  describe('updateChoicePromptKnown', () => {
    it('should emit updated draft with new promptKnown for select kind', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateChoicePromptKnown('New Prompt');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ promptKnown: 'New Prompt' }));
    });

    it('should not update promptKnown for code-select kind', () => {
      fixture.componentRef.setInput('draft', createDraft('code-select'));
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateChoicePromptKnown('New Prompt');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onKnownLanguageChange', () => {
    it('should emit knownLanguageChange', () => {
      const spy = vi.spyOn(component.knownLanguageChange, 'emit');
      component.onKnownLanguageChange('en');
      expect(spy).toHaveBeenCalledWith('en');
    });

    it('should emit metaChange with new known language', () => {
      fixture.componentRef.setInput('meta', { knownLanguage: 'ru' });
      const metaSpy = vi.spyOn(component.metaChange, 'emit');
      component.onKnownLanguageChange('en');
      expect(metaSpy).toHaveBeenCalledWith(expect.objectContaining({ knownLanguage: 'en' }));
    });
  });

  describe('onLearningLanguageChange', () => {
    it('should emit learningLanguageChange', () => {
      const spy = vi.spyOn(component.learningLanguageChange, 'emit');
      component.onLearningLanguageChange('zh');
      expect(spy).toHaveBeenCalledWith('zh');
    });
  });

  describe('choiceDraft', () => {
    it.each(['select', 'reading', 'timed', 'symbol', 'tone'] as const)(
      'should return draft for %s',
      (kind) => {
        fixture.componentRef.setInput('draft', createDraft(kind));
        expect(component.choiceDraft()).not.toBeNull();
      },
    );

    it.each(['code-select', 'cloze', 'code-trace', 'flip'] as const)(
      'should return null for %s',
      (kind) => {
        fixture.componentRef.setInput('draft', createDraft(kind));
        expect(component.choiceDraft()).toBeNull();
      },
    );
  });

  describe('choiceOptionsConfig', () => {
    it('should return config for reading kind', () => {
      fixture.componentRef.setInput('draft', createDraft('reading'));
      const config = component.choiceOptionsConfig();
      expect(config.title).toBe('Варианты чтения');
      expect(config.optionLabelPrefix).toBe('Чтение');
      expect(config.showCorrectRadio).toBe(true);
    });

    it('should return config for symbol kind', () => {
      fixture.componentRef.setInput('draft', createDraft('symbol'));
      expect(component.choiceOptionsConfig().title).toBe('Символы');
    });

    it('should return config for select kind', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      const config = component.choiceOptionsConfig();
      expect(config.title).toBe('Варианты (новый)');
      expect(config.optionLabelPrefix).toBe('Ответ');
    });

    it('should return config for timed kind', () => {
      fixture.componentRef.setInput('draft', createDraft('timed'));
      expect(component.choiceOptionsConfig().title).toBe('Варианты (новый)');
    });
  });

  describe('choiceOptionTexts', () => {
    it('should return empty array for code-select kind', () => {
      fixture.componentRef.setInput('draft', createDraft('code-select'));
      expect(component.choiceOptionTexts()).toEqual([]);
    });

    it('should return symbols for symbol kind', () => {
      fixture.componentRef.setInput('draft', {
        ...createDraft('symbol'),
        symbols: ['👋', '🔥'],
      } as CardDraft);
      expect(component.choiceOptionTexts()).toEqual(['👋', '🔥']);
    });
  });

  describe('choiceOptionLexemes', () => {
    it('should return empty array for code-select kind', () => {
      fixture.componentRef.setInput('draft', createDraft('code-select'));
      expect(component.choiceOptionLexemes()).toEqual([]);
    });
  });

  describe('onChoiceOptionsStateChange', () => {
    it('should emit updated draft with options state for reading kind', () => {
      fixture.componentRef.setInput('draft', createDraft('reading'));
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.onChoiceOptionsStateChange({
        options: ['B', 'C'],
        lexemes: [],
        correctIndex: 1,
      });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ optionsLearning: ['B', 'C'], correctIndex: 1 }),
      );
    });
  });

  describe('tabs', () => {
    it('should expose the five semantic tabs in order', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      expect(component.tabs().map((tab) => tab.label)).toEqual([
        'Содержание',
        'Ответы',
        'Оформление',
        'Размещение',
        'Публикация',
      ]);
      expect(component.tabs().map((tab) => tab.id)).toEqual([
        'content',
        'answers',
        'appearance',
        'placement',
        'publishing',
      ]);
    });

    it.each(['code-select', 'keyboard', 'draw', 'memory', 'sound'] as const)(
      'should show the same visible labels for %s',
      (kind) => {
        fixture.componentRef.setInput('draft', createDraft(kind));
        expect(component.tabs().filter((tab) => tab.visible).map((tab) => tab.label)).toEqual([
          'Содержание',
          'Ответы',
          'Оформление',
          'Размещение',
          'Публикация',
        ]);
      },
    );

    it('should hide the answers tab for flip cards', () => {
      fixture.componentRef.setInput('draft', createDraft('flip'));
      expect(component.tabs().find((tab) => tab.id === 'answers')?.visible).toBe(false);
    });

    it('should show only content, answers, and placement in basic mode', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      fixture.componentRef.setInput('uxMode', 'basic');
      expect(component.tabs().filter((tab) => tab.visible).map((tab) => tab.id)).toEqual([
        'content',
        'answers',
        'placement',
      ]);
    });

    it('should keep placement visible in basic mode without hierarchy context', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      fixture.componentRef.setInput('uxMode', 'basic');
      expect(component.tabs().find((tab) => tab.id === 'placement')?.visible).toBe(true);
    });

    it('should show all five tabs in advanced mode', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      fixture.componentRef.setInput('uxMode', 'advanced');
      expect(component.tabs().filter((tab) => tab.visible).map((tab) => tab.id)).toEqual([
        'content',
        'answers',
        'appearance',
        'placement',
        'publishing',
      ]);
    });

    it('should badge the content tab when title and prompt are missing', () => {
      fixture.componentRef.setInput(
        'draft',
        { ...createDraft('select'), title: '', promptKnown: '' } as CardDraft,
      );
      const content = component.tabs().find((tab) => tab.id === 'content');
      expect(content?.badge).toBe('2');
      expect(content?.badgeAriaLabel).toBe('Содержание, 2 ошибки');
    });

    it('should badge the answers tab when answer data is missing', () => {
      fixture.componentRef.setInput(
        'draft',
        { ...createDraft('select'), optionsLearning: [] } as CardDraft,
      );
      const answers = component.tabs().find((tab) => tab.id === 'answers');
      expect(answers?.badge).toBe('1');
      expect(answers?.badgeAriaLabel).toBe('Ответы, 1 ошибка');
    });

    it('should not badge tabs without blocking validation rules', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      fixture.componentRef.setInput('uxMode', 'advanced');
      expect(component.tabs().find((tab) => tab.id === 'appearance')?.badge).toBeUndefined();
      expect(component.tabs().find((tab) => tab.id === 'placement')?.badge).toBeUndefined();
      expect(component.tabs().find((tab) => tab.id === 'publishing')?.badge).toBeUndefined();
    });
  });

  describe('activeTabId', () => {
    it('should start at content', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      expect(component.activeTabId()).toBe('content');
    });

    it('should update on tab change', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      component.onTabChange('appearance');
      expect(component.activeTabId()).toBe('appearance');
    });

    it('should reset to content when the active tab becomes hidden', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      component.onTabChange('answers');
      fixture.componentRef.setInput('draft', createDraft('flip'));
      fixture.detectChanges();
      expect(component.activeTabId()).toBe('content');
    });

    it('should reset to content when the UX mode hides the active tab', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      fixture.componentRef.setInput('uxMode', 'advanced');
      component.onTabChange('publishing');
      fixture.componentRef.setInput('uxMode', 'basic');
      fixture.detectChanges();
      expect(component.activeTabId()).toBe('content');
    });
  });

  describe('rendered tab content', () => {
    it.each(['code-select', 'keyboard', 'draw', 'memory', 'sound'] as const)(
      'should render the content tab for %s',
      (kind) => {
        fixture.componentRef.setInput('draft', createDraft(kind));
        component.onTabChange('content');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('app-card-form-content-tab')).toBeTruthy();
      },
    );

    it.each(['code-select', 'keyboard', 'draw', 'memory', 'sound'] as const)(
      'should render the answers tab for %s',
      (kind) => {
        fixture.componentRef.setInput('draft', createDraft(kind));
        component.onTabChange('answers');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('app-card-form-answers-tab')).toBeTruthy();
      },
    );

    it.each(['select', 'reading', 'timed', 'symbol'] as const)(
      'should render the options editor exactly once in the answers tab for %s',
      (kind) => {
        fixture.componentRef.setInput('draft', createDraft(kind));
        component.onTabChange('answers');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('app-card-options-editor').length).toBe(1);

        component.onTabChange('content');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('app-card-options-editor').length).toBe(0);
      },
    );

    it('should render the appearance tab', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      component.onTabChange('appearance');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-card-form-appearance-tab')).toBeTruthy();
    });

    it('should render the placement tab', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      component.onTabChange('placement');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-card-form-placement-tab')).toBeTruthy();
    });

    it('should render the publishing tab', () => {
      fixture.componentRef.setInput('draft', createDraft('select'));
      fixture.componentRef.setInput('meta', {
        difficulty: 'beginner',
        tags: [],
        requiredTier: 'FREE',
        published: true,
      });
      component.onTabChange('publishing');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-card-form-publishing-tab')).toBeTruthy();
    });
  });

  describe('metaChange output', () => {
    it('should emit metaChange', () => {
      const spy = vi.spyOn(component.metaChange, 'emit');
      component.metaChange.emit({ knownLanguage: 'ru', learningLanguage: 'en' });
      expect(spy).toHaveBeenCalledWith({ knownLanguage: 'ru', learningLanguage: 'en' });
    });
  });

  describe('languages and languageLabels', () => {
    it('should have languages', () => {
      expect(Array.isArray(component.languages())).toBe(true);
    });

    it('should have languageLabels', () => {
      expect(component.languageLabels()).toBeDefined();
    });
  });
});
