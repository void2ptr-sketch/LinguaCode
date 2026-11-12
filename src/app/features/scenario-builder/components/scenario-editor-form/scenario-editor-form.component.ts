import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { ContentLanguage } from '../../../../entities/card/model';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import type { ScenarioFormDraft } from '../../utils/scenario-form-draft.utils';

/**
 * Scenario editor form component. Provides a form for editing scenarios including
 * title, description, and language pair (course).
 */
@Component({
  selector: 'app-scenario-editor-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './scenario-editor-form.component.html',
  styleUrl: './scenario-editor-form.component.scss',
})
export class ScenarioEditorFormComponent {
  /** Required scenario form draft being edited. */
  readonly draft = input.required<ScenarioFormDraft>();
  /** Whether the form is in read-only mode. */
  readonly readOnly = input(false);

  /** Emits the updated scenario form draft when the user makes changes. */
  readonly draftChange = output<ScenarioFormDraft>();

  private readonly languageService = inject(LanguageService);

  updateDraft(patch: Partial<ScenarioFormDraft>): void {
    this.draftChange.emit({ ...this.draft(), ...patch });
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

  languagePairInvalid(): boolean {
    const pair = this.draft().languagePair;
    return pair.known === pair.learning;
  }
}
