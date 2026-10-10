import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  lookupHanRadicalHint,
  primaryHanCharacter,
} from '../../../../core/data/chinese/draw-stroke-guides.data';
import { HanziDataService } from '../../../../core/hanzi-engine/hanzi-data.service';
import type { DrawPracticeMode, KeyboardAnswerMode } from '../../../../core/models';
import type { CardDraft } from '../../types';
import { CardAppearanceFieldsComponent } from '../card-appearance-fields/card-appearance-fields.component';

/**
 * Settings panel component for card form. Provides kind-specific settings (time limit,
 * answer mode, draw practice mode, appearance) alongside appearance fields.
 * @remarks Loads Hanzi stroke count for draw cards via `HanziDataService`.
 */
@Component({
  selector: 'app-card-form-settings-panel',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    CardAppearanceFieldsComponent,
  ],
  templateUrl: './card-form-settings-panel.component.html',
  styleUrl: './card-form-settings-panel.component.scss',
})
export class CardFormSettingsPanelComponent {
  private readonly hanziData = inject(HanziDataService);

  /**
   * Required card draft being edited.
   * @remarks
   * Bound with two-way binding (`[(draft)]`) in parent templates.
   */
  readonly draft = input.required<CardDraft>();

  /**
   * Emits the updated card draft when settings change.
   * @remarks
   * Used with two-way binding: `(draftChange)="onDraftChange($event)"`.
   */
  readonly draftChange = output<CardDraft>();

  /**
   * Stroke count for the draw card's target Hanzi character (null when not applicable).
   * @remarks
   * Loaded asynchronously from `HanziDataService` when the draw draft's target character changes.
   * Only populated for stroke-order practice mode.
   */
  readonly drawHanziStrokeCount = signal<number | null>(null);

  /**
   * Available draw practice mode options for the selector.
   *
   * @remarks
   * Includes memory, tracing, hints, freehand, stroke-order, and radicals modes.
   */
  readonly drawPracticeModeOptions: readonly { value: DrawPracticeMode; label: string }[] = [
    { value: 'memory', label: 'По памяти (default UI)' },
    { value: 'tracing', label: 'Трассировка' },
    { value: 'hints', label: 'С подсказками' },
    { value: 'freehand', label: 'Свободное рисование' },
    { value: 'stroke-order', label: 'Порядок черт' },
    { value: 'radicals', label: 'Радикалы' },
  ];

  /**
   * Available keyboard answer mode options for the selector.
   *
   * @remarks
   * Includes auto (IPA/Pinyin/text), text, Pinyin with tones, and IPA modes.
   */
  readonly keyboardAnswerModeOptions: readonly { value: KeyboardAnswerMode; label: string }[] = [
    { value: 'auto', label: 'Авто (IPA / пиньинь / текст)' },
    { value: 'text', label: 'Текст' },
    { value: 'pinyin', label: 'Пиньинь с тонами' },
    { value: 'ipa', label: 'IPA' },
  ];

  /**
   * Computed keyboard card draft, or `null` if the current draft is not a keyboard card.
   */
  readonly keyboardDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'keyboard' ? draft : null;
  });

  /**
   * Computed timed card draft, or `null` if the current draft is not a timed card.
   */
  readonly timedDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'timed' ? draft : null;
  });

  /**
   * Computed draw card draft, or `null` if the current draft is not a draw card.
   */
  readonly drawDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'draw' ? draft : null;
  });

  constructor() {
    effect(() => {
      const draft = this.drawDraft();
      const character = primaryHanCharacter(draft?.targetCharacter?.trim() ?? '');
      if (!character || (draft?.practiceMode ?? 'freehand') !== 'stroke-order') {
        this.drawHanziStrokeCount.set(null);
        return;
      }

      void this.hanziData.loadCharacter(character).then((model) => {
        this.drawHanziStrokeCount.set(model?.strokes.length ?? null);
      });
    });
  }

  /**
   * Emits the updated card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  /**
   * Updates the card appearance settings.
   *
   * @param appearance - The new appearance configuration.
   */
  updateAppearance(appearance: CardDraft['appearance']): void {
    this.updateDraft({ ...this.draft(), appearance });
  }

  /**
   * Updates the time limit for timed cards.
   *
   * @param value - The new time limit in seconds.
   * @remarks
   * No-op for non-timed cards.
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
   * @remarks
   * No-op for non-keyboard cards.
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
   * @param value - The new practice mode ('freehand' or 'stroke-order').
   * @remarks
   * No-op for non-draw cards.
   */
  updateDrawPracticeMode(value: DrawPracticeMode): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, practiceMode: value });
    }
  }

  /**
   * Updates the target Hanzi character for draw cards.
   *
   * @param value - The new target character string.
   * @remarks
   * No-op for non-draw cards.
   */
  updateDrawTargetCharacter(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, targetCharacter: value });
    }
  }

  /**
   * Updates the radical hint for draw cards.
   *
   * @param value - The new radical hint text.
   * @remarks
   * No-op for non-draw cards.
   */
  updateDrawRadicalHint(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, radicalHint: value });
    }
  }

  /**
   * Auto-fills draw hints (target character and radical hint) from available sources.
   * @remarks
   * Derives target character from `targetCharacter`, `promptLexeme.primary`,
   * or `referenceHintKnown`. Looks up radical hint via `lookupHanRadicalHint()`.
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
