import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { CardIndexMetaOverride } from '../../../../core/data/cards/card-index.mapper';
import type { CardDifficulty } from '../../../../core/models/card-index.types';
import { DIFFICULTIES, DIFFICULTY_LABELS } from '../../../card-catalog-search';

/**
 * Form fields component for card metadata (difficulty, tags, last updated date).
 * @remarks Tags are stored as comma-separated strings and parsed into arrays.
 */
@Component({
  selector: 'app-card-meta-fields',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './card-meta-fields.component.html',
  styleUrl: './card-meta-fields.component.scss',
})
export class CardMetaFieldsComponent {
  /** Optional card index meta override. */
  readonly meta = input<CardIndexMetaOverride | undefined>();
  /** Emits the updated card index meta override. */
  readonly metaChange = output<CardIndexMetaOverride>();

  /** Available difficulty levels. */
  readonly difficultyOptions = DIFFICULTIES;
  /** Labels for difficulty levels. */
  readonly difficultyLabels = DIFFICULTY_LABELS;

  updateDifficulty(difficulty: CardDifficulty): void {
    this.updateMeta({ ...this.meta(), difficulty });
  }

  updateTags(tags: string): void {
    const tagsArray = tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    this.updateMeta({ ...this.meta(), tags: tagsArray });
  }

  updateUpdatedAt(updatedAt: string): void {
    this.updateMeta({ ...this.meta(), updatedAt });
  }

  private updateMeta(next: CardIndexMetaOverride): void {
    this.metaChange.emit(next);
  }

  tagsString(): string {
    return this.meta()?.tags?.join(', ') ?? '';
  }
}
