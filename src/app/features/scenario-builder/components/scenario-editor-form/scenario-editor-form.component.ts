import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { ContentLanguage } from '../../../../entities/card/model';
import type { CourseIndexEntry } from '../../../../entities/course/model';
import type { ProgramWithLessons } from '../../../../entities/program/model';
import type { Lesson } from '../../../../entities/course/model/lesson.types';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import type { ScenarioFormDraft } from '../../utils/scenario-form-draft.utils';

/** Payment tier labels in Russian. */
const TIER_LABELS: Record<string, string> = {
  FREE: 'Бесплатный',
  STARTER: 'Стартовый',
  GROWTH: 'Рост',
  PREMIUM: 'Премиум',
};

/**
 * Scenario editor form component. Provides a form for editing scenarios including
 * title, description, language pair, course hierarchy, and payment tier.
 */
@Component({
  selector: 'app-scenario-editor-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './scenario-editor-form.component.html',
  styleUrl: './scenario-editor-form.component.scss',
})
export class ScenarioEditorFormComponent {
  /** Required scenario form draft being edited. */
  readonly draft = input.required<ScenarioFormDraft>();
  /** Whether the form is in read-only mode. */
  readonly readOnly = input(false);
  /** Available courses for the current language pair. */
  readonly courses = input.required<readonly CourseIndexEntry[]>();
  /** Programs for the selected course (loaded from API). */
  readonly programs = input<readonly ProgramWithLessons[]>([]);
  /** Lessons for the selected program (loaded from API). */
  readonly lessons = input<readonly Lesson[]>([]);

  /** Emits the updated scenario form draft when the user makes changes. */
  readonly draftChange = output<ScenarioFormDraft>();

  private readonly languageService = inject(LanguageService);

  /** Available tier options. */
  readonly tierOptions = Object.keys(TIER_LABELS) as string[];
  /** Tier display labels. */
  readonly tierLabels = TIER_LABELS;

  updateDraft(patch: Partial<ScenarioFormDraft>): void {
    this.draftChange.emit({ ...this.draft(), ...patch });
  }

  onCourseIdChange(courseId: string | null): void {
    // Reset program and lesson when course changes
    this.draftChange.emit({
      ...this.draft(),
      courseId: courseId ?? undefined,
      programId: undefined,
      lessonId: undefined,
    });
  }

  onProgramIdChange(programId: string | null): void {
    // Reset lesson when program changes
    this.draftChange.emit({
      ...this.draft(),
      programId: programId ?? undefined,
      lessonId: undefined,
    });
  }

  onLessonIdChange(lessonId: string | null): void {
    this.draftChange.emit({
      ...this.draft(),
      lessonId: lessonId ?? undefined,
    });
  }

  onKnownLanguageChange(known: ContentLanguage): void {
    this.updateDraft({
      languagePair: { ...this.draft().languagePair, known },
    });
  }

  onLearningLanguageChange(learning: ContentLanguage): void {
    this.updateDraft({
      languagePair: { ...this.draft().languagePair, learning },
    });
  }

  onRequiredTierChange(tier: string | null): void {
    this.draftChange.emit({
      ...this.draft(),
      requiredTier: (tier as ScenarioFormDraft['requiredTier']) ?? undefined,
    });
  }

  updatePublished(published: boolean): void {
    this.draftChange.emit({ ...this.draft(), published });
  }

  languagePairInvalid(): boolean {
    const pair = this.draft().languagePair;
    return pair.known === pair.learning;
  }
}
