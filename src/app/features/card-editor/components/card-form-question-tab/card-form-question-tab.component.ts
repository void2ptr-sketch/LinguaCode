import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import type { ContentLanguage, CardKind } from '../../../../entities/card/model';
import { CONTENT_LANGUAGE_LABELS } from '../../../../entities/card/lib/catalog-labels';
import { contentLanguages } from '../../../../entities/language-pair/lib/language-pair.utils';
import type { CardDraft, ChoiceCardDraft } from '../../types';
import { cardFormKindGroup } from '../../utils/form/card-form.registry';
import type { CourseOption, LessonOption, ScenarioOption } from '../../../../entities/card/lib/card-catalog-hierarchy/card-catalog-hierarchy.service';

/**
 * Question tab component for the card form.
 *
 * @remarks
 * Handles language selection, course/lesson/scenario hierarchy,
 * card title, and choice-type prompt fields.
 */
@Component({
  selector: 'app-card-form-question-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
  ],
  templateUrl: './card-form-question-tab.component.html',
})
export class CardFormQuestionTabComponent {
  /** Available courses for the current language pair. */
  readonly availableCourses = input.required<readonly CourseOption[]>();

  /** Available lessons for the selected course. */
  readonly availableLessons = input.required<readonly LessonOption[]>();

  /** Available scenarios for the selected lesson. */
  readonly availableScenarios = input.required<readonly ScenarioOption[]>();

  /** Required card draft being edited. */
  readonly draft = input.required<CardDraft>();

  /** Known (source) language for the card content. */
  readonly knownLanguage = input<ContentLanguage>('ru');

  /** Learning (target) language for the card content. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Emits when the known language changes. */
  readonly knownLanguageChange = output<ContentLanguage>();

  /** Emits when the learning language changes. */
  readonly learningLanguageChange = output<ContentLanguage>();

  /** Emits the updated course ID. */
  readonly courseIdChange = output<string>();

  /** Emits the updated lesson ID. */
  readonly lessonIdChange = output<string>();

  /** Emits the updated scenario ID. */
  readonly scenarioIdChange = output<string>();

  /** Emits the updated title. */
  readonly titleChange = output<string>();

  /** Emits the updated choice prompt known. */
  readonly choicePromptKnownChange = output<string>();

  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  /** Computed choice card draft, or null if not a choice type. */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    const kind = (draft as CardDraft).kind as CardKind;
    if (kind === 'code-select') {
      return null;
    }
    if (cardFormKindGroup(kind) === 'choice') {
      return draft as unknown as ChoiceCardDraft;
    }
    return null;
  });

  updateCourseId(courseId: string): void {
    this.courseIdChange.emit(courseId);
  }

  updateLessonId(lessonId: string): void {
    this.lessonIdChange.emit(lessonId);
  }

  updateScenarioId(scenarioId: string): void {
    this.scenarioIdChange.emit(scenarioId);
  }

  updateTitle(title: string): void {
    this.titleChange.emit(title);
  }

  updateChoicePromptKnown(promptKnown: string): void {
    this.choicePromptKnownChange.emit(promptKnown);
  }
}
