import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { CardDifficulty, CardKind, ContentLanguage } from '../../core/models';
import {
  CARD_KIND_LABELS,
  CONTENT_LANGUAGE_LABELS,
  CONTENT_LANGUAGES,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
} from './catalog-labels';
import { CardCatalogSearchStore } from './card-catalog-search.store';

@Component({
  selector: 'app-card-catalog-filters',
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './card-catalog-filters.component.html',
  styleUrl: './card-catalog-filters.component.scss',
})
export class CardCatalogFiltersComponent {
  readonly store = inject(CardCatalogSearchStore);

  readonly languages = CONTENT_LANGUAGES;
  readonly difficulties = DIFFICULTIES;
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  readonly difficultyLabels = DIFFICULTY_LABELS;
  readonly kindLabels = CARD_KIND_LABELS;

  onQueryInput(value: string): void {
    this.store.setQuery(value);
  }

  onLanguageChange(value: ContentLanguage | null): void {
    this.store.setLanguage(value);
  }

  onDifficultyChange(value: CardDifficulty | null): void {
    this.store.setDifficulty(value);
  }

  isKindSelected(kind: CardKind): boolean {
    return this.store.selectedKinds().includes(kind);
  }

  isTagSelected(tag: string): boolean {
    return this.store.selectedTags().includes(tag);
  }

  toggleKind(kind: CardKind): void {
    this.store.toggleKind(kind);
  }

  toggleTag(tag: string): void {
    this.store.toggleTag(tag);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }
}
