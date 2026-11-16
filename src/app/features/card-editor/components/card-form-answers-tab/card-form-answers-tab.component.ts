import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { ContentLanguage } from '../../../../entities/card/model';
import type { KeyboardAnswerMode } from '../../../../entities/card/model';
import type { DrawPracticeMode } from '../../../../entities/phonetic/model';
import {
  lookupHanRadicalHint,
  primaryHanCharacter,
} from '../../../../entities/chinese/lib/drawing/draw-stroke-guides.data';
import type {
  CardDraft,
  ChoiceCardDraft,
  CodeSelectCardDraft,
  MemoryCardDraft,
  SoundCardDraft,
} from '../../types';
import type { InputCardDraft } from '../card-form/kind-forms/input-card-form/input-card-form.component';
import { cardFormKindGroup } from '../../utils/form/card-form.registry';
import { CodeSelectCardFormComponent } from '../card-form/kind-forms/code-select-card-form/code-select-card-form.component';
import { ChoiceCardFormComponent } from '../card-form/kind-forms/choice-card-form/choice-card-form.component';
import { InputCardFormComponent } from '../card-form/kind-forms/input-card-form/input-card-form.component';
import { MediaCardFormComponent } from '../card-form/kind-forms/media-card-form/media-card-form.component';
import { PairsCardFormComponent } from '../card-form/kind-forms/pairs-card-form/pairs-card-form.component';

/**
 * Tab component for editing card answers.
 *
 * @remarks
 * Renders the kind-specific answer editor plus inline behavior fields
 * (time limit, keyboard answer mode, draw practice settings). Prompt fields
 * and prompt lexemes live in the content tab.
 */
@Component({
  selector: 'app-card-form-answers-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    CodeSelectCardFormComponent,
    ChoiceCardFormComponent,
    InputCardFormComponent,
    MediaCardFormComponent,
    PairsCardFormComponent,
  ],
  templateUrl: './card-form-answers-tab.component.html',
  styleUrl: './card-form-answers-tab.component.scss',
})
export class CardFormAnswersTabComponent {
  /** The card draft being edited. */
  readonly draft = input.required<CardDraft>();

  /** Known (source) language for the card content. */
  readonly knownLanguage = input<ContentLanguage>('ru');

  /** Learning (target) language for the card content. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Emits the updated card draft when changes are made. */
  readonly draftChange = output<CardDraft>();

  /** Available draw practice mode options. */
  readonly drawPracticeModeOptions: readonly { value: DrawPracticeMode; label: string }[] = [
    { value: 'memory', label: 'По памяти (default UI)' },
    { value: 'tracing', label: 'Трассировка' },
    { value: 'hints', label: 'С подсказками' },
    { value: 'freehand', label: 'Свободное рисование' },
    { value: 'stroke-order', label: 'Порядок черт' },
    { value: 'radicals', label: 'Радикалы' },
  ];

  /** Available keyboard answer mode options. */
  readonly keyboardAnswerModeOptions: readonly { value: KeyboardAnswerMode; label: string }[] = [
    { value: 'auto', label: 'Авто (IPA / пиньинь / текст)' },
    { value: 'text', label: 'Текст' },
    { value: 'pinyin', label: 'Пиньинь с тонами' },
    { value: 'ipa', label: 'IPA' },
  ];

  /** Computed kind group for the current draft. */
  readonly kindGroup = computed(() => cardFormKindGroup(this.draft().kind));

  /** Computed choice card draft (only actual choice kinds). */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    switch (draft.kind) {
      case 'select':
      case 'reading':
      case 'timed':
      case 'symbol':
      case 'tone':
        return draft;
      default:
        return null;
    }
  });

  /** Computed code-select card draft. */
  readonly codeSelectDraft = computed((): CodeSelectCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'code-select' ? draft : null;
  });

  /** Computed input card draft (keyboard, draw). */
  readonly inputDraft = computed((): InputCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'keyboard' || draft.kind === 'draw' ? draft : null;
  });

  /** Computed memory card draft. */
  readonly pairsDraft = computed((): MemoryCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  /** Computed sound card draft. */
  readonly mediaDraft = computed((): SoundCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  /** Computed timed card draft. */
  readonly timedDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'timed' ? draft : null;
  });

  /** Computed keyboard card draft. */
  readonly keyboardDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'keyboard' ? draft : null;
  });

  /** Computed draw card draft. */
  readonly drawDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'draw' ? draft : null;
  });

  /** Whether the current kind has no dedicated answer editor yet. */
  readonly isUnsupportedAnswerKind = computed(() => {
    const kind = this.draft().kind;
    return kind === 'cloze' || kind === 'code-trace';
  });

  /**
   * Emits the updated card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  /**
   * Updates the time limit for timed cards.
   *
   * @param value - The new time limit in seconds.
   */
  updateTimeLimitSec(value: number): void {
    const draft = this.draft();
    if (draft.kind === 'timed') {
      this.updateDraft({ ...draft, timeLimitSec: value });
    }
  }

  /**
   * Updates the keyboard answer mode for keyboard cards.
   *
   * @param value - The new answer mode.
   */
  updateKeyboardAnswerMode(value: KeyboardAnswerMode): void {
    const draft = this.draft();
    if (draft.kind === 'keyboard') {
      this.updateDraft({ ...draft, answerMode: value });
    }
  }

  /**
   * Updates the draw practice mode for draw cards.
   *
   * @param value - The new practice mode.
   */
  updateDrawPracticeMode(value: DrawPracticeMode): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, practiceMode: value });
    }
  }

  /**
   * Updates the radical hint for draw cards.
   *
   * @param value - The new radical hint text.
   */
  updateDrawRadicalHint(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, radicalHint: value });
    }
  }

  /**
   * Auto-fills draw hints (target character and radical hint) from available sources.
   */
  autofillDrawHints(): void {
    const draft = this.draft();
    if (draft.kind !== 'draw') {
      return;
    }

    const source =
      draft.targetCharacter.trim() ||
      draft.promptLexeme.primary.trim() ||
      primaryHanCharacter(draft.referenceHintKnown);
    const character = primaryHanCharacter(source);
    if (!character) {
      return;
    }

    this.updateDraft({
      ...draft,
      targetCharacter: character,
      radicalHint: lookupHanRadicalHint(character) ?? draft.radicalHint,
    });
  }
}
