import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CardFormQuestionTabComponent } from './card-form-question-tab.component';
import type { CardDraft } from '../../types';
import type {
  CourseOption,
  LessonOption,
  ScenarioOption,
} from '../../../../entities/card/lib/card-catalog-hierarchy/card-catalog-hierarchy.service';

const createBaseDraft = (kind: CardDraft['kind']): CardDraft =>
  ({
    kind,
    title: 'Test',
    direction: 'known-to-learning' as const,
    promptKnown: 'Q?',
    optionsLearning: ['A', 'B'],
    optionsKnown: ['A', 'B'],
    optionsLexemes: [],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptLexeme: {
      primary: '',
      script: 'latn',
      pinyin: '',
      zhuyin: '',
      palladius: '',
      ipa: '',
      audioUrl: '',
      acceptedReadings: '',
    },
    audioUrl: '',
  }) as CardDraft;

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CardFormQuestionTabComponent],
  template: `
    <app-card-form-question-tab
      [draft]="draft"
      [availableCourses]="courses"
      [availableLessons]="lessons"
      [availableScenarios]="scenarios"
      [knownLanguage]="knownLang"
      [learningLanguage]="learnLang"
      (knownLanguageChange)="onKnownLangChange($event)"
      (learningLanguageChange)="onLearnLangChange($event)"
      (courseIdChange)="onCourseIdChange($event)"
      (lessonIdChange)="onLessonIdChange($event)"
      (scenarioIdChange)="onScenarioIdChange($event)"
      (titleChange)="onTitleChange($event)"
      (choicePromptKnownChange)="onChoicePromptKnownChange($event)"
    />
  `,
})
class HostComponent {
  draft: CardDraft = createBaseDraft('select');
  courses: CourseOption[] = [];
  lessons: LessonOption[] = [];
  scenarios: ScenarioOption[] = [];
  knownLang: 'ru' | 'en' = 'ru';
  learnLang: 'en' | 'zh' = 'en';
  onKnownLangChange: (_v: string) => void = vi.fn();
  onLearnLangChange: (_v: string) => void = vi.fn();
  onCourseIdChange: (_v: string) => void = vi.fn();
  onLessonIdChange: (_v: string) => void = vi.fn();
  onScenarioIdChange: (_v: string) => void = vi.fn();
  onTitleChange: (_v: string) => void = vi.fn();
  onChoicePromptKnownChange: (_v: string) => void = vi.fn();
}

describe('CardFormQuestionTabComponent', () => {
  let hostFixture: import('@angular/core/testing').ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: CardFormQuestionTabComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, CardFormQuestionTabComponent],
    });

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();

    component = hostFixture.debugElement.children[0].componentInstance;
  });

  // ── Inputs ──

  it('should have availableCourses input', () => {
    expect(component.availableCourses).toBeDefined();
  });

  it('should have availableLessons input', () => {
    expect(component.availableLessons).toBeDefined();
  });

  it('should have availableScenarios input', () => {
    expect(component.availableScenarios).toBeDefined();
  });

  it('should have draft input', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have knownLanguage input with default', () => {
    expect(component.knownLanguage()).toBe('ru');
  });

  it('should have learningLanguage input with default', () => {
    expect(component.learningLanguage()).toBe('en');
  });

  // ── Outputs ──

  it('should have knownLanguageChange output', () => {
    let emitted: string | undefined;
    component.knownLanguageChange.subscribe((v) => {
      emitted = v;
    });
    component.knownLanguageChange.emit('en' as never);
    expect(emitted).toBe('en');
  });

  it('should have learningLanguageChange output', () => {
    let emitted: string | undefined;
    component.learningLanguageChange.subscribe((v) => {
      emitted = v;
    });
    component.learningLanguageChange.emit('zh' as never);
    expect(emitted).toBe('zh');
  });

  it('should have courseIdChange output', () => {
    let emitted = '';
    component.courseIdChange.subscribe((v) => {
      emitted = v;
    });
    component.courseIdChange.emit('c1');
    expect(emitted).toBe('c1');
  });

  it('should have lessonIdChange output', () => {
    let emitted = '';
    component.lessonIdChange.subscribe((v) => {
      emitted = v;
    });
    component.lessonIdChange.emit('l1');
    expect(emitted).toBe('l1');
  });

  it('should have scenarioIdChange output', () => {
    let emitted = '';
    component.scenarioIdChange.subscribe((v) => {
      emitted = v;
    });
    component.scenarioIdChange.emit('s1');
    expect(emitted).toBe('s1');
  });

  it('should have titleChange output', () => {
    let emitted = '';
    component.titleChange.subscribe((v) => {
      emitted = v;
    });
    component.titleChange.emit('New Title');
    expect(emitted).toBe('New Title');
  });

  it('should have choicePromptKnownChange output', () => {
    let emitted = '';
    component.choicePromptKnownChange.subscribe((v) => {
      emitted = v;
    });
    component.choicePromptKnownChange.emit('New Prompt');
    expect(emitted).toBe('New Prompt');
  });

  // ── Static data ──

  it('should expose languages array', () => {
    expect(component.languages).toBeDefined();
    expect(component.languages.length).toBeGreaterThan(0);
  });

  it('should expose languageLabels', () => {
    expect(component.languageLabels).toBeDefined();
  });

  // ── choiceDraft computed ──

  it('should return choice draft for select card', () => {
    host.draft = createBaseDraft('select');
    hostFixture.detectChanges();
    const result = component.choiceDraft();
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('select');
  });

  it('should return choice draft for timed card', () => {
    host.draft = createBaseDraft('timed');
    hostFixture.detectChanges();
    const result = component.choiceDraft();
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('timed');
  });

  it('should return choice draft for symbol card', () => {
    host.draft = createBaseDraft('symbol');
    hostFixture.detectChanges();
    const result = component.choiceDraft();
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('symbol');
  });

  it('should return null for code-select card', () => {
    host.draft = createBaseDraft('code-select');
    hostFixture.detectChanges();
    const result = component.choiceDraft();
    expect(result).toBeNull();
  });

  it('should return null for keyboard card', () => {
    host.draft = createBaseDraft('keyboard');
    hostFixture.detectChanges();
    const result = component.choiceDraft();
    expect(result).toBeNull();
  });

  it('should return null for draw card', () => {
    host.draft = createBaseDraft('draw');
    hostFixture.detectChanges();
    const result = component.choiceDraft();
    expect(result).toBeNull();
  });

  it('should return null for memory card', () => {
    host.draft = createBaseDraft('memory');
    hostFixture.detectChanges();
    const result = component.choiceDraft();
    expect(result).toBeNull();
  });

  // ── Update methods ──

  it('should emit courseId on updateCourseId', () => {
    let emitted = '';
    component.courseIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateCourseId('course-1');
    expect(emitted).toBe('course-1');
  });

  it('should emit lessonId on updateLessonId', () => {
    let emitted = '';
    component.lessonIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateLessonId('lesson-1');
    expect(emitted).toBe('lesson-1');
  });

  it('should emit scenarioId on updateScenarioId', () => {
    let emitted = '';
    component.scenarioIdChange.subscribe((v) => {
      emitted = v;
    });
    component.updateScenarioId('scenario-1');
    expect(emitted).toBe('scenario-1');
  });

  it('should emit title on updateTitle', () => {
    let emitted = '';
    component.titleChange.subscribe((v) => {
      emitted = v;
    });
    component.updateTitle('New Title');
    expect(emitted).toBe('New Title');
  });

  it('should emit choicePromptKnown on updateChoicePromptKnown', () => {
    let emitted = '';
    component.choicePromptKnownChange.subscribe((v) => {
      emitted = v;
    });
    component.updateChoicePromptKnown('New Prompt');
    expect(emitted).toBe('New Prompt');
  });
});
