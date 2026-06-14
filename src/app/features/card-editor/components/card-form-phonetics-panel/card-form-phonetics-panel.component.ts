import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { LexemeDraftFields } from '../../../../core/data/lexeme-draft.utils';
import type { ContentLanguage } from '../../../../core/models';
import type { CardOptionsEditorState } from '../../utils/card-options-editor.utils';
import type { CardDraft } from '../../types';
import { CardOptionsEditorComponent } from '../card-options-editor/card-options-editor.component';
import { LexemeFieldsComponent } from '../lexeme-fields/lexeme-fields.component';

@Component({
  selector: 'app-card-form-phonetics-panel',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    CardOptionsEditorComponent,
    LexemeFieldsComponent,
  ],
  templateUrl: './card-form-phonetics-panel.component.html',
  styleUrl: './card-form-phonetics-panel.component.scss',
})
export class CardFormPhoneticsPanelComponent {
  readonly draft = input.required<CardDraft>();
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');

  readonly draftChange = output<CardDraft>();

  readonly showPromptLexeme = computed(() => this.draft().kind !== 'tone');

  readonly soundDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  readonly memoryDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  readonly optionsDraft = computed(() => {
    const draft = this.draft();
    if (
      draft.kind === 'select' ||
      draft.kind === 'reading' ||
      draft.kind === 'timed' ||
      draft.kind === 'symbol' ||
      draft.kind === 'sound'
    ) {
      return draft;
    }

    return null;
  });

  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  updatePromptLexeme(fields: LexemeDraftFields): void {
    this.updateDraft({ ...this.draft(), promptLexeme: fields });
  }

  updateAudioUrl(value: string): void {
    this.updateDraft({ ...this.draft(), audioUrl: value });
  }

  updateAudioLabelLexeme(fields: LexemeDraftFields): void {
    const draft = this.draft();
    if (draft.kind === 'sound') {
      this.updateDraft({ ...draft, audioLabelLexeme: fields });
    }
  }

  updatePairLexeme(index: number, fields: LexemeDraftFields): void {
    const draft = this.draft();
    if (draft.kind !== 'memory') {
      return;
    }

    const pairs = draft.pairs.map((pair, pairIndex) => {
      if (pairIndex !== index) {
        return pair;
      }

      const learning = fields.primary.trim() ? fields.primary : pair.learning;
      return { ...pair, learning, learningLexeme: fields };
    });

    this.updateDraft({ ...draft, pairs });
  }

  onOptionsStateChange(state: CardOptionsEditorState): void {
    const draft = this.draft();

    switch (draft.kind) {
      case 'select':
      case 'reading':
      case 'timed':
        this.updateDraft({
          ...draft,
          optionsLearning: state.options,
          optionsLexemes: state.lexemes,
          correctIndex: state.correctIndex,
        });
        break;
      case 'symbol':
        this.updateDraft({
          ...draft,
          symbols: state.options,
          symbolLexemes: state.lexemes,
          correctIndex: state.correctIndex,
        });
        break;
      case 'sound':
        this.updateDraft({
          ...draft,
          optionsKnown: state.options,
          optionsLexemes: state.lexemes,
          correctIndex: state.correctIndex,
        });
        break;
    }
  }

  optionTexts(): readonly string[] {
    const draft = this.draft();
    switch (draft.kind) {
      case 'symbol':
        return draft.symbols;
      case 'sound':
        return draft.optionsKnown;
      case 'select':
      case 'reading':
      case 'timed':
        return draft.optionsLearning;
      default:
        return [];
    }
  }

  optionLexemes(): readonly LexemeDraftFields[] {
    const draft = this.draft();
    switch (draft.kind) {
      case 'symbol':
        return draft.symbolLexemes;
      case 'sound':
      case 'select':
      case 'reading':
      case 'timed':
        return draft.optionsLexemes;
      default:
        return [];
    }
  }

  hasOptionLexemes(): boolean {
    const kind = this.draft().kind;
    return kind === 'select' || kind === 'reading' || kind === 'timed' || kind === 'symbol' || kind === 'sound';
  }

  optionsConfig() {
    const draft = this.draft();
    switch (draft.kind) {
      case 'reading':
        return { title: 'Лексемы вариантов чтения', optionLabelPrefix: 'Чтение', showCorrectRadio: false };
      case 'symbol':
        return { title: 'Лексемы символов', optionLabelPrefix: 'Символ', showCorrectRadio: false };
      case 'sound':
        return { title: 'Лексемы вариантов', optionLabelPrefix: 'Известный', showCorrectRadio: false };
      default:
        return { title: 'Лексемы вариантов', optionLabelPrefix: 'Новый', showCorrectRadio: false };
    }
  }

  optionCorrectIndex(): number {
    const draft = this.draft();
    if ('correctIndex' in draft) {
      return draft.correctIndex;
    }

    return 0;
  }
}
