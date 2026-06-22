import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  lookupHanRadicalHint,
  lookupHanStrokeGuides,
  primaryHanCharacter,
} from '../../../../core/data/draw-stroke-guides.data';
import type { DrawPracticeMode, KeyboardAnswerMode } from '../../../../core/models';
import type { CardDraft } from '../../types';
import { CardAppearanceFieldsComponent } from '../card-appearance-fields/card-appearance-fields.component';

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
  readonly draft = input.required<CardDraft>();
  readonly isAdvanced = input(false);

  readonly draftChange = output<CardDraft>();

  readonly drawPracticeModeOptions: readonly { value: DrawPracticeMode; label: string }[] = [
    { value: 'memory', label: 'По памяти (default UI)' },
    { value: 'tracing', label: 'Трассировка' },
    { value: 'hints', label: 'С подсказками' },
    { value: 'freehand', label: 'Свободное рисование' },
    { value: 'stroke-order', label: 'Порядок черт' },
    { value: 'radicals', label: 'Радикалы' },
  ];

  readonly keyboardAnswerModeOptions: readonly { value: KeyboardAnswerMode; label: string }[] = [
    { value: 'auto', label: 'Авто (IPA / пиньинь / текст)' },
    { value: 'text', label: 'Текст' },
    { value: 'pinyin', label: 'Пиньинь с тонами' },
    { value: 'ipa', label: 'IPA' },
  ];

  readonly keyboardDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'keyboard' ? draft : null;
  });

  readonly timedDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'timed' ? draft : null;
  });

  readonly drawDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'draw' ? draft : null;
  });

  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  updateAppearance(appearance: CardDraft['appearance']): void {
    this.updateDraft({ ...this.draft(), appearance });
  }

  updateTimeLimitSec(value: number): void {
    const draft = this.draft();
    if (draft.kind === 'timed') {
      this.updateDraft({ ...draft, timeLimitSec: value });
    }
  }

  updateKeyboardAnswerMode(value: KeyboardAnswerMode): void {
    const draft = this.draft();
    if (draft.kind === 'keyboard') {
      this.updateDraft({ ...draft, answerMode: value });
    }
  }

  updateDrawPracticeMode(value: DrawPracticeMode): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, practiceMode: value });
    }
  }

  updateDrawTargetCharacter(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, targetCharacter: value });
    }
  }

  updateDrawRadicalHint(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, radicalHint: value });
    }
  }

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
      strokeGuides: lookupHanStrokeGuides(character).map((guide) => ({ ...guide })),
      radicalHint: lookupHanRadicalHint(character) ?? draft.radicalHint,
    });
  }
}
