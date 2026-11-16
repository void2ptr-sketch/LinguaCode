import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { CardIndexMetaOverride } from '../../../../entities/card/model';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import type { LanguagePairDto } from '../../../../entities/language-pair/api';
import {
  type CourseOption,
  type LessonOption,
  type ScenarioOption,
} from '../../../../entities/card/lib/services/card-catalog-hierarchy.service';

/**
 * Minimal connection fields for the draft.
 *
 * @remarks
 * Contains only the hierarchy reference fields — avoids circular dependency
 * with the full CardDraft type.
 */
export type ConnectionsDraft = {
  courseId: string | undefined;
  programId: string | undefined;
  lessonId: string | undefined;
  scenarioId: string | undefined;
};

/**
 * Connections tab component for the card form.
 *
 * @remarks
 * Displays and edits all connection fields: language pair (derived from course),
 * course, program, lesson, and scenario.
 * Receives hierarchy data from the parent form component.
 */
@Component({
  selector: 'app-card-connections-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './card-connections-tab.component.html',
  styleUrl: './card-connections-tab.component.scss',
})
export class CardConnectionsTabComponent {
  private readonly languageService = inject(LanguageService);

  /** Required draft containing only connection fields. */
  readonly draft = input.required<ConnectionsDraft>();

  /** Optional card index meta override for language_pair_id. */
  readonly meta = input<CardIndexMetaOverride | undefined>(undefined);

  /** Available courses for the current language pair. */
  readonly availableCourses = input.required<readonly CourseOption[]>();

  /** Available programs for the selected course. */
  readonly availablePrograms = input.required<readonly { id: string; title: string }[]>();

  /** Available lessons for the selected program. */
  readonly availableLessons = input.required<readonly LessonOption[]>();

  /** Available scenarios for the selected lesson. */
  readonly availableScenarios = input.required<readonly ScenarioOption[]>();

  /** Available language pairs from the registry. */
  readonly languagePairs = input<readonly LanguagePairDto[]>([]);

  /** Emits the updated course ID. */
  readonly courseIdChange = output<string>();

  /** Emits the updated program ID. */
  readonly programIdChange = output<string>();

  /** Emits the updated lesson ID. */
  readonly lessonIdChange = output<string>();

  /** Emits the updated scenario ID. */
  readonly scenarioIdChange = output<string>();

  /** Emits the updated language pair ID. */
  readonly languagePairIdChange = output<string>();

  /** Labels for content languages. */
  readonly languageLabels = () => this.languageService.getLabels();

  /**
   * Computed display text for the language pair of the selected course.
   *
   * @remarks
   * Resolves the language pair from the selected course or falls back to
   * the language pair specified in the meta override.
   */
  readonly languagePairDisplay = input.required<string>();

  /**
   * Updates the selected course and notifies the parent.
   *
   * @param courseId - The selected course ID (empty string to deselect).
   */
  updateCourseId(courseId: string): void {
    this.courseIdChange.emit(courseId);
  }

  /**
   * Updates the selected program and notifies the parent.
   *
   * @param programId - The selected program ID (empty string to deselect).
   */
  updateProgramId(programId: string): void {
    this.programIdChange.emit(programId);
  }

  /**
   * Updates the selected lesson and notifies the parent.
   *
   * @param lessonId - The selected lesson ID (empty string to deselect).
   */
  updateLessonId(lessonId: string): void {
    this.lessonIdChange.emit(lessonId);
  }

  /**
   * Updates the selected scenario.
   *
   * @param scenarioId - The selected scenario ID.
   */
  updateScenarioId(scenarioId: string): void {
    this.scenarioIdChange.emit(scenarioId);
  }

  /**
   * Updates the selected language pair.
   *
   * @param languagePairId - The selected language pair ID (empty string to deselect).
   */
  updateLanguagePairId(languagePairId: string): void {
    this.languagePairIdChange.emit(languagePairId);
  }
}
