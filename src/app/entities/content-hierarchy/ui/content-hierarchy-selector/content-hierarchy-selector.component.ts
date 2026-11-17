import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import type {
  HierarchyLevel,
  HierarchyOption,
  HierarchyScope,
  HierarchyValue,
} from '../../model/content-hierarchy.types';
import { ContentHierarchyService } from '../../lib/services/content-hierarchy.service';

const ALL_LEVELS: readonly HierarchyLevel[] = [
  'languagePair',
  'course',
  'program',
  'lesson',
  'scenario',
];

/**
 * Cascading content-hierarchy selector.
 *
 * @remarks
 * Renders 1–5 combo boxes (language pair → course → program → lesson →
 * scenario) and loads every option list from the backend tables through
 * `ContentHierarchyService`. Changing a parent level clears all dependent
 * values and reloads the child list.
 *
 * The component works with an optional `ContentHierarchyService` so isolated
 * presentational tests can render it without HTTP providers. Production
 * dialogs provide the service at dialog level.
 */
@Component({
  selector: 'app-content-hierarchy-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './content-hierarchy-selector.component.html',
  styleUrl: './content-hierarchy-selector.component.scss',
})
export class ContentHierarchySelectorComponent implements OnInit {
  private readonly hierarchy = inject(ContentHierarchyService, { optional: true });

  /** Levels to render, in fixed hierarchy order. */
  readonly levels = input<readonly HierarchyLevel[]>(ALL_LEVELS);

  /** Current hierarchy value. */
  readonly value = input<HierarchyValue>({});

  /** Disables all controls. */
  readonly readOnly = input(false);

  /** Individual levels that should stay read-only (e.g. language pair on cards). */
  readonly readOnlyLevels = input<readonly HierarchyLevel[]>([]);

  /** Course search scope: `all` for authoring, `published` for learners. */
  readonly scope = input<HierarchyScope>('all');

  /**
   * Language-pair ID used to filter courses when the pair level is read-only
   * (for example, a card derives its pair from the content languages).
   */
  readonly languagePairId = input<number | undefined>(undefined);

  /** Emits the full hierarchy value after any level changes. */
  readonly valueChange = output<HierarchyValue>();

  /** Options for every level. */
  readonly languagePairs = signal<readonly HierarchyOption[]>([]);
  readonly courses = signal<readonly HierarchyOption[]>([]);
  readonly programs = signal<readonly HierarchyOption[]>([]);
  readonly lessons = signal<readonly HierarchyOption[]>([]);
  readonly scenarios = signal<readonly HierarchyOption[]>([]);

  /** Internal value, kept in sync with the `value` input. */
  readonly currentValue = signal<HierarchyValue>({});

  private readonly lastInputSynced = signal('');
  private readonly requestSeq = new Map<HierarchyLevel, number>();

  /** Whether a given level is rendered. */
  readonly visibleLevels = computed(() => {
    const requested = new Set(this.levels());
    return ALL_LEVELS.filter((level) => requested.has(level));
  });

  constructor() {
    effect(() => {
      const input = this.normalizedInput();
      const serialized = serializeValue(input);
      if (serialized === this.lastInputSynced()) {
        return;
      }
      this.lastInputSynced.set(serialized);
      void this.syncFromValue(input);
    });
  }

  ngOnInit(): void {
    void this.bootstrap();
  }

  /** Whether a level should be rendered. */
  hasLevel(level: HierarchyLevel): boolean {
    return this.visibleLevels().includes(level);
  }

  /** Whether a level is disabled. */
  isDisabled(level: HierarchyLevel): boolean {
    if (this.readOnly() || this.readOnlyLevels().includes(level)) {
      return true;
    }

    switch (level) {
      case 'languagePair':
        return false;
      case 'course':
        return this.currentValue().languagePairId === undefined;
      case 'program':
        return !this.currentValue().courseId;
      case 'lesson':
        return !this.currentValue().programId;
      case 'scenario':
        return !this.currentValue().lessonId;
    }
  }

  /** Handles a language-pair selection. */
  async onLanguagePairChange(languagePairId: number | null): Promise<void> {
    const next: HierarchyValue = {
      languagePairId: languagePairId ?? undefined,
    };
    this.emit(next);
    this.courses.set([]);
    this.programs.set([]);
    this.lessons.set([]);
    this.scenarios.set([]);

    if (next.languagePairId !== undefined) {
      await this.reloadCourses(next.languagePairId);
    }
  }

  /** Handles a course selection. */
  async onCourseChange(courseId: string | null): Promise<void> {
    const next: HierarchyValue = {
      ...this.currentValue(),
      courseId: courseId ?? undefined,
      programId: undefined,
      lessonId: undefined,
      scenarioId: undefined,
    };
    this.emit(next);
    this.programs.set([]);
    this.lessons.set([]);
    this.scenarios.set([]);

    if (next.courseId) {
      await this.reloadPrograms(next.courseId);
    }
  }

  /** Handles a program selection. */
  async onProgramChange(programId: string | null): Promise<void> {
    const next: HierarchyValue = {
      ...this.currentValue(),
      programId: programId ?? undefined,
      lessonId: undefined,
      scenarioId: undefined,
    };
    this.emit(next);
    this.lessons.set([]);
    this.scenarios.set([]);

    if (next.programId) {
      await this.reloadLessons(next.programId);
    }
  }

  /** Handles a lesson selection. */
  async onLessonChange(lessonId: string | null): Promise<void> {
    const next: HierarchyValue = {
      ...this.currentValue(),
      lessonId: lessonId ?? undefined,
      scenarioId: undefined,
    };
    this.emit(next);
    this.scenarios.set([]);

    if (next.lessonId) {
      await this.reloadScenarios(next.lessonId);
    }
  }

  /** Handles a scenario selection. */
  onScenarioChange(scenarioId: string | null): void {
    this.emit({
      ...this.currentValue(),
      scenarioId: scenarioId ?? undefined,
    });
  }

  private async bootstrap(): Promise<void> {
    if (!this.hierarchy) {
      return;
    }

    if (this.hasLevel('languagePair')) {
      try {
        this.languagePairs.set(await this.hierarchy.loadLanguagePairs());
      } catch {
        this.languagePairs.set([]);
      }
    }

    const input = this.normalizedInput();
    const hydrated = await this.hierarchy.hydrate(input);
    this.currentValue.set(hydrated);
    this.lastInputSynced.set(serializeValue(input));

    if (hydrated.languagePairId !== undefined) {
      await this.reloadCourses(hydrated.languagePairId);
    }
    if (hydrated.courseId) {
      await this.reloadPrograms(hydrated.courseId);
    }
    if (hydrated.programId) {
      await this.reloadLessons(hydrated.programId);
    }
    if (hydrated.lessonId) {
      await this.reloadScenarios(hydrated.lessonId);
    }
  }

  private async syncFromValue(value: HierarchyValue): Promise<void> {
    if (!this.hierarchy) {
      this.currentValue.set(value);
      return;
    }

    const hydrated = await this.hierarchy.hydrate(value);
    this.currentValue.set(hydrated);
    this.lastInputSynced.set(serializeValue(value));

    if (hydrated.languagePairId !== undefined) {
      await this.reloadCourses(hydrated.languagePairId);
    }
    if (hydrated.courseId) {
      await this.reloadPrograms(hydrated.courseId);
    }
    if (hydrated.programId) {
      await this.reloadLessons(hydrated.programId);
    }
    if (hydrated.lessonId) {
      await this.reloadScenarios(hydrated.lessonId);
    }
  }

  private async reloadCourses(languagePairId: number): Promise<void> {
    if (!this.hierarchy) {
      return;
    }
    const seq = this.nextSeq('course');
    try {
      const options = await this.hierarchy.loadCourses(languagePairId, this.scope());
      if (seq === this.requestSeq.get('course')) {
        this.courses.set(options);
      }
    } catch {
      if (seq === this.requestSeq.get('course')) {
        this.courses.set([]);
      }
    }
  }

  private async reloadPrograms(courseId: string): Promise<void> {
    if (!this.hierarchy) {
      return;
    }
    const seq = this.nextSeq('program');
    try {
      const options = await this.hierarchy.loadPrograms(courseId);
      if (seq === this.requestSeq.get('program')) {
        this.programs.set(options);
      }
    } catch {
      if (seq === this.requestSeq.get('program')) {
        this.programs.set([]);
      }
    }
  }

  private async reloadLessons(programId: string): Promise<void> {
    if (!this.hierarchy) {
      return;
    }
    const seq = this.nextSeq('lesson');
    try {
      const options = await this.hierarchy.loadLessons(programId);
      if (seq === this.requestSeq.get('lesson')) {
        this.lessons.set(options);
      }
    } catch {
      if (seq === this.requestSeq.get('lesson')) {
        this.lessons.set([]);
      }
    }
  }

  private async reloadScenarios(lessonId: string): Promise<void> {
    if (!this.hierarchy) {
      return;
    }
    const seq = this.nextSeq('scenario');
    try {
      const options = await this.hierarchy.loadScenarios(lessonId);
      if (seq === this.requestSeq.get('scenario')) {
        this.scenarios.set(options);
      }
    } catch {
      if (seq === this.requestSeq.get('scenario')) {
        this.scenarios.set([]);
      }
    }
  }

  private emit(value: HierarchyValue): void {
    this.currentValue.set(value);
    this.lastInputSynced.set(serializeValue(value));
    this.valueChange.emit(value);
  }

  private normalizedInput(): HierarchyValue {
    const value = this.value();
    const pairId = this.languagePairId();
    if (pairId !== undefined && value.languagePairId === undefined) {
      return { ...value, languagePairId: pairId };
    }
    return value;
  }

  private nextSeq(level: HierarchyLevel): number {
    const next = (this.requestSeq.get(level) ?? 0) + 1;
    this.requestSeq.set(level, next);
    return next;
  }
}

function serializeValue(value: HierarchyValue): string {
  return JSON.stringify({
    languagePairId: value.languagePairId ?? null,
    courseId: value.courseId ?? null,
    programId: value.programId ?? null,
    lessonId: value.lessonId ?? null,
    scenarioId: value.scenarioId ?? null,
  });
}
