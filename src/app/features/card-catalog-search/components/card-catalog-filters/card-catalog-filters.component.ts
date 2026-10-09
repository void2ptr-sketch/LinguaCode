import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { CardDifficulty, CardKind, CardSearchFacets } from '../../../../core/models';
import {
  CARD_KIND_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  tagLabel,
} from '../../../../shared/constants/catalog-labels';
import { groupCatalogTagFacets } from '../../utils/catalog-tag-groups/catalog-tag-groups.util';
import { CardCatalogSearchStore } from '../../'

/**
 * Card catalog filters component. Provides search, difficulty, kind, and tag filtering
 * for the card catalog.
 * @remarks Delegates filter state management to `CardCatalogSearchStore`.
 */
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

  /** Available difficulty levels. */
  readonly difficulties = DIFFICULTIES;
  /** Labels for difficulty levels. */
  readonly difficultyLabels = DIFFICULTY_LABELS;
  /** Labels for card kinds. */
  readonly kindLabels = CARD_KIND_LABELS;
  /** Utility function to generate tag labels. */
  readonly tagLabel = tagLabel;

  /** Computed search facets from the catalog store. */
  readonly facets = computed(() => this.store.facets() as CardSearchFacets | null);

  /** Computed grouped tag facets for display. */
  readonly tagGroups = computed(() => {
    const facets = this.store.facets();
    if (!facets) {
      return [];
    }

    return groupCatalogTagFacets(facets.tags);
  });

  onQueryInput(value: string): void {
    this.store.setQuery(value);
  }

  onDifficultyChange(value: CardDifficulty | null): void {
    this.store.setDifficulty(value);
  }

  onCourseChange(courseId: string | null): void {
    void this.store.setCourse(courseId);
  }

  onLessonChange(lessonId: string | null): void {
    void this.store.setLesson(lessonId);
  }

  onScenarioChange(scenarioId: string | null): void {
    this.store.setScenario(scenarioId);
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
