import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { Card } from '../../../../core/models';
import { CardDraft, DEFAULT_CARD_DIRECTION } from '../../types';
import { normalizeCardDraft } from '../../utils/card-validation.utils';
import { CardAppearanceFieldsComponent } from '../card-appearance-fields/card-appearance-fields.component';
import { CardPreviewComponent } from '../card-preview/card-preview.component';

@Component({
  selector: 'app-card-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    CardAppearanceFieldsComponent,
    CardPreviewComponent,
  ],
  templateUrl: './card-form.component.html',
  styleUrl: './card-form.component.scss',
})
export class CardFormComponent {
  readonly draft = input.required<CardDraft>();
  readonly previewId = input('preview-card');

  readonly draftChange = output<CardDraft>();

  readonly previewCard = computed((): Card => {
    return (
      normalizeCardDraft(this.draft(), this.previewId()) ?? this.fallbackPreviewCard(this.draft())
    );
  });

  readonly previewFontSize = computed(() => this.draft().appearance.fontSize);

  readonly selectDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'select' ? draft : null;
  });

  readonly memoryDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  readonly symbolDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'symbol' ? draft : null;
  });

  readonly soundDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  readonly timedDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'timed' ? draft : null;
  });

  readonly keyboardDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'keyboard' ? draft : null;
  });

  readonly drawDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'draw' ? draft : null;
  });

  updateDraft(nextDraft: CardDraft): void {
    this.draftChange.emit(nextDraft);
  }

  updateTitle(title: string): void {
    this.updateDraft({ ...this.draft(), title });
  }

  updateAppearance(appearance: CardDraft['appearance']): void {
    this.updateDraft({ ...this.draft(), appearance });
  }

  updatePromptKnown(value: string): void {
    const draft = this.draft();
    if ('promptKnown' in draft) {
      this.updateDraft({ ...draft, promptKnown: value });
    }
  }

  updateAudioLabelLearning(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'sound') {
      this.updateDraft({ ...draft, audioLabelLearning: value });
    }
  }

  updateReferenceHintKnown(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'draw') {
      this.updateDraft({ ...draft, referenceHintKnown: value });
    }
  }

  updateTimeLimitSec(value: number): void {
    const draft = this.draft();
    if (draft.kind === 'timed') {
      this.updateDraft({ ...draft, timeLimitSec: value });
    }
  }

  updateCorrectIndex(index: number): void {
    const draft = this.draft();
    if ('correctIndex' in draft) {
      this.updateDraft({ ...draft, correctIndex: index });
    }
  }

  updatePair(index: number, side: 'known' | 'learning', value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'memory') {
      return;
    }

    const pairs = draft.pairs.map((pair, pairIndex) =>
      pairIndex === index ? { ...pair, [side]: value } : pair,
    );
    this.updateDraft({ ...draft, pairs });
  }

  addPair(): void {
    const draft = this.draft();
    if (draft.kind !== 'memory' || draft.pairs.length >= 12) {
      return;
    }

    this.updateDraft({ ...draft, pairs: [...draft.pairs, { known: '', learning: '' }] });
  }

  removePair(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'memory' || draft.pairs.length <= 1) {
      return;
    }

    this.updateDraft({
      ...draft,
      pairs: draft.pairs.filter((_, pairIndex) => pairIndex !== index),
    });
  }

  updateSelectOption(index: number, value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'select') {
      return;
    }

    const optionsLearning = [...draft.optionsLearning];
    optionsLearning[index] = value;
    this.updateDraft({ ...draft, optionsLearning });
  }

  addSelectOption(): void {
    const draft = this.draft();
    if (draft.kind !== 'select' || draft.optionsLearning.length >= 8) {
      return;
    }

    this.updateDraft({ ...draft, optionsLearning: [...draft.optionsLearning, ''] });
  }

  removeSelectOption(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'select' || draft.optionsLearning.length <= 2) {
      return;
    }

    const optionsLearning = draft.optionsLearning.filter((_, itemIndex) => itemIndex !== index);
    let correctIndex = draft.correctIndex;
    if (correctIndex === index) {
      correctIndex = 0;
    } else if (correctIndex > index) {
      correctIndex -= 1;
    }

    this.updateDraft({ ...draft, optionsLearning, correctIndex });
  }

  updateTimedOption(index: number, value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'timed') {
      return;
    }

    const optionsLearning = [...draft.optionsLearning];
    optionsLearning[index] = value;
    this.updateDraft({ ...draft, optionsLearning });
  }

  addTimedOption(): void {
    const draft = this.draft();
    if (draft.kind !== 'timed' || draft.optionsLearning.length >= 8) {
      return;
    }

    this.updateDraft({ ...draft, optionsLearning: [...draft.optionsLearning, ''] });
  }

  removeTimedOption(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'timed' || draft.optionsLearning.length <= 2) {
      return;
    }

    const optionsLearning = draft.optionsLearning.filter((_, itemIndex) => itemIndex !== index);
    let correctIndex = draft.correctIndex;
    if (correctIndex === index) {
      correctIndex = 0;
    } else if (correctIndex > index) {
      correctIndex -= 1;
    }

    this.updateDraft({ ...draft, optionsLearning, correctIndex });
  }

  updateSymbolOption(index: number, value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'symbol') {
      return;
    }

    const symbols = [...draft.symbols];
    symbols[index] = value;
    this.updateDraft({ ...draft, symbols });
  }

  addSymbolOption(): void {
    const draft = this.draft();
    if (draft.kind !== 'symbol' || draft.symbols.length >= 8) {
      return;
    }

    this.updateDraft({ ...draft, symbols: [...draft.symbols, ''] });
  }

  removeSymbolOption(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'symbol' || draft.symbols.length <= 2) {
      return;
    }

    const symbols = draft.symbols.filter((_, itemIndex) => itemIndex !== index);
    let correctIndex = draft.correctIndex;
    if (correctIndex === index) {
      correctIndex = 0;
    } else if (correctIndex > index) {
      correctIndex -= 1;
    }

    this.updateDraft({ ...draft, symbols, correctIndex });
  }

  updateSoundOption(index: number, value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'sound') {
      return;
    }

    const optionsKnown = [...draft.optionsKnown];
    optionsKnown[index] = value;
    this.updateDraft({ ...draft, optionsKnown });
  }

  addSoundOption(): void {
    const draft = this.draft();
    if (draft.kind !== 'sound' || draft.optionsKnown.length >= 8) {
      return;
    }

    this.updateDraft({ ...draft, optionsKnown: [...draft.optionsKnown, ''] });
  }

  removeSoundOption(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'sound' || draft.optionsKnown.length <= 2) {
      return;
    }

    const optionsKnown = draft.optionsKnown.filter((_, itemIndex) => itemIndex !== index);
    let correctIndex = draft.correctIndex;
    if (correctIndex === index) {
      correctIndex = 0;
    } else if (correctIndex > index) {
      correctIndex -= 1;
    }

    this.updateDraft({ ...draft, optionsKnown, correctIndex });
  }

  updateKeyboardAnswer(index: number, value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard') {
      return;
    }

    const acceptedAnswersKnown = [...draft.acceptedAnswersKnown];
    acceptedAnswersKnown[index] = value;
    this.updateDraft({ ...draft, acceptedAnswersKnown });
  }

  addKeyboardAnswer(): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard' || draft.acceptedAnswersKnown.length >= 8) {
      return;
    }

    this.updateDraft({ ...draft, acceptedAnswersKnown: [...draft.acceptedAnswersKnown, ''] });
  }

  removeKeyboardAnswer(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard' || draft.acceptedAnswersKnown.length <= 1) {
      return;
    }

    const acceptedAnswersKnown = draft.acceptedAnswersKnown.filter(
      (_, answerIndex) => answerIndex !== index,
    );
    this.updateDraft({ ...draft, acceptedAnswersKnown });
  }

  private fallbackPreviewCard(draft: CardDraft): Card {
    const appearance = draft.appearance;

    switch (draft.kind) {
      case 'select':
        return {
          id: this.previewId(),
          kind: 'select',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          optionsLearning: ['Вариант 1', 'Вариант 2'],
          correctIndex: 0,
          appearance,
        };
      case 'memory':
        return {
          id: this.previewId(),
          kind: 'memory',
          title: draft.title || 'Новая карточка',
          promptKnown: draft.promptKnown || 'Подсказка',
          pairs: [{ known: 'A', learning: 'B' }],
          appearance,
        };
      case 'symbol':
        return {
          id: this.previewId(),
          kind: 'symbol',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          symbols: ['👋', '🔥'],
          correctIndex: 0,
          appearance,
        };
      case 'sound':
        return {
          id: this.previewId(),
          kind: 'sound',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          audioLabelLearning: draft.audioLabelLearning || 'Hello',
          optionsKnown: ['Привет', 'Пока'],
          correctIndex: 0,
          appearance,
        };
      case 'timed':
        return {
          id: this.previewId(),
          kind: 'timed',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          optionsLearning: ['A', 'B'],
          correctIndex: 0,
          timeLimitSec: draft.timeLimitSec || 30,
          appearance,
        };
      case 'keyboard':
        return {
          id: this.previewId(),
          kind: 'keyboard',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          acceptedAnswersKnown: ['ответ'],
          appearance,
        };
      case 'draw':
        return {
          id: this.previewId(),
          kind: 'draw',
          title: draft.title || 'Новая карточка',
          promptKnown: draft.promptKnown || 'Подсказка',
          referenceHintKnown: draft.referenceHintKnown || 'Ориентир',
          appearance,
        };
    }
  }
}
