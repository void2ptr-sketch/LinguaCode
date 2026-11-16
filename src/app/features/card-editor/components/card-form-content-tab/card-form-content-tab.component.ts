import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { CodeHighlightLanguage, ContentLanguage } from '../../../../entities/card/model';
import {
  CODE_HIGHLIGHT_LANGUAGE_LABELS,
  CODE_HIGHLIGHT_LANGUAGES,
} from '../../../../entities/card/lib/utils/code-highlight.utils';
import type { CardDraft } from '../../types';
import { toneVariantPreview } from '../../utils/tone/tone-variant.utils';
import { CardFormPhoneticsPanelComponent } from '../card-form-phonetics-panel/card-form-phonetics-panel.component';

/**
 * Content tab component for the card form.
 *
 * @remarks
 * Renders the card title and all prompt-side fields: known-language prompt,
 * code prompt and caption for code cards, tone syllable base, draw reference
 * hint, and flip-card sides. Prompt lexemes and audio URL live in a collapsed
 * advanced subsection.
 */
@Component({
  selector: 'app-card-form-content-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TextFieldModule,
    CardFormPhoneticsPanelComponent,
  ],
  templateUrl: './card-form-content-tab.component.html',
  styleUrl: './card-form-content-tab.component.scss',
})
export class CardFormContentTabComponent {
  /** Required card draft being edited. */
  readonly draft = input.required<CardDraft>();

  /** Known (source) language for lexeme fields. */
  readonly knownLanguage = input<ContentLanguage>('ru');

  /** Learning (target) language for lexeme fields. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Emits the updated card draft when the user makes changes. */
  readonly draftChange = output<CardDraft>();

  /** Available code highlight languages. */
  readonly codeLanguages = CODE_HIGHLIGHT_LANGUAGES;
  /** Labels for code highlight languages. */
  readonly codeLanguageLabels = CODE_HIGHLIGHT_LANGUAGE_LABELS;

  /** Draft slice for kinds that have a known-language prompt. */
  readonly promptDraft = computed(() => {
    const draft = this.draft();
    switch (draft.kind) {
      case 'select':
      case 'reading':
      case 'timed':
      case 'symbol':
      case 'tone':
      case 'keyboard':
      case 'draw':
      case 'memory':
      case 'sound':
      case 'cloze':
        return draft;
      default:
        return null;
    }
  });

  /** Known-language prompt value, or `null` when the kind has no such field. */
  readonly promptKnown = computed(() => this.promptDraft()?.promptKnown ?? null);

  /** Label for the known-language prompt field. */
  readonly promptLabel = computed(() => {
    const kind = this.draft().kind;
    if (kind === 'reading') {
      return 'Контекст (известный)';
    }
    if (kind === 'tone') {
      return 'Подсказка';
    }
    return 'Вопрос (известный)';
  });

  /** Computed tone card draft. */
  readonly toneDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'tone' ? draft : null;
  });

  /** Computed draw card draft. */
  readonly drawDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'draw' ? draft : null;
  });

  /** Computed code-select card draft. */
  readonly codeSelectDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'code-select' ? draft : null;
  });

  /** Computed code-trace card draft. */
  readonly codeTraceDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'code-trace' ? draft : null;
  });

  /** Computed flip card draft. */
  readonly flipDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'flip' ? draft : null;
  });

  /** Code prompt block for code-select and code-trace cards. */
  readonly codePrompt = computed(() => {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return draft.prompt;
    }
    if (draft.kind === 'code-trace') {
      return draft.code;
    }
    return null;
  });

  /** Whether the draft has prompt lexeme fields (advanced subsection). */
  readonly hasPromptLexeme = computed(() => {
    const kind = this.draft().kind;
    switch (kind) {
      case 'select':
      case 'reading':
      case 'timed':
      case 'symbol':
      case 'tone':
      case 'keyboard':
      case 'draw':
      case 'memory':
      case 'sound':
      case 'cloze':
        return true;
      default:
        return false;
    }
  });

  /** Tone variant preview for the current syllable base. */
  readonly tonePreview = computed(() => {
    const draft = this.toneDraft();
    return draft ? toneVariantPreview(draft.syllableBase, draft.toneOptions) : '';
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
   * Updates the card title.
   *
   * @param title - The new title.
   */
  updateTitle(title: string): void {
    this.updateDraft({ ...this.draft(), title });
  }

  /**
   * Updates the known-language prompt when the kind supports it.
   *
   * @param value - The new prompt text.
   */
  updatePromptKnown(value: string): void {
    const draft = this.promptDraft();
    if (!draft) {
      return;
    }
    this.updateDraft({ ...draft, promptKnown: value });
  }

  /**
   * Updates the code-select caption.
   *
   * @param value - The new caption text.
   */
  updateCaption(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'code-select') {
      return;
    }
    this.updateDraft({ ...draft, caption: value });
  }

  /**
   * Updates the code-trace question.
   *
   * @param value - The new question text.
   */
  updateQuestion(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'code-trace') {
      return;
    }
    this.updateDraft({ ...draft, question: value });
  }

  /**
   * Updates the prompt code for code-select and code-trace cards.
   *
   * @param value - The new code string.
   */
  updateCode(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      this.updateDraft({ ...draft, prompt: { ...draft.prompt, code: value } });
      return;
    }
    if (draft.kind === 'code-trace') {
      this.updateDraft({ ...draft, code: { ...draft.code, code: value } });
    }
  }

  /**
   * Updates the prompt code language for code-select and code-trace cards.
   *
   * @param language - The new syntax highlighting language.
   */
  updateCodeLanguage(language: CodeHighlightLanguage): void {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      this.updateDraft({ ...draft, prompt: { ...draft.prompt, language } });
      return;
    }
    if (draft.kind === 'code-trace') {
      this.updateDraft({ ...draft, code: { ...draft.code, language } });
    }
  }

  /**
   * Updates the tone syllable base.
   *
   * @param value - The new syllable base string.
   */
  updateSyllableBase(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'tone') {
      return;
    }
    this.updateDraft({ ...draft, syllableBase: value });
  }

  /**
   * Updates the draw reference hint.
   *
   * @param value - The new reference hint text.
   */
  updateReferenceHintKnown(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'draw') {
      return;
    }
    this.updateDraft({ ...draft, referenceHintKnown: value });
  }

  /**
   * Updates the front side of a flip card.
   *
   * @param value - The new front text.
   */
  updateFlipFront(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'flip') {
      return;
    }
    this.updateDraft({ ...draft, front: value });
  }

  /**
   * Updates the back side of a flip card.
   *
   * @param value - The new back text.
   */
  updateFlipBack(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'flip') {
      return;
    }
    this.updateDraft({ ...draft, back: value });
  }
}
