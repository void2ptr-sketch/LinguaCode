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

  /**
   * Available difficulty levels for card filtering.
   *
   * @remarks
   * Populated from the shared `DIFFICULTIES` constant.
   */
  readonly difficulties = DIFFICULTIES;
  /**
   * Labels for difficulty levels.
   *
   * @remarks
   * Maps each difficulty value to a human-readable string.
   */
  readonly difficultyLabels = DIFFICULTY_LABELS;
  /**
   * Labels for card kinds.
   *
   * @remarks
   * Maps each card kind to a human-readable string.
   */
  readonly kindLabels = CARD_KIND_LABELS;
  /**
   * Utility function to generate tag labels.
   *
   * @remarks
   * Used in templates to render tag names.
   */
  readonly tagLabel = tagLabel;

  /**
   * Computed search facets from the catalog store.
   *
   * @remarks
   * Derived from `store.facets()` with explicit casting to `CardSearchFacets`.
   * Returns `null` when facets are not yet available.
   */
  readonly facets = computed(() => this.store.facets() as CardSearchFacets | null);

  /**
   * Computed grouped tag facets for display.
   *
   * @remarks
   * Groups raw tag facets into themed sections (Themes, Subtopics, Other Tags)
   * using `groupCatalogTagFacets`.
   */
  readonly tagGroups = computed(() => {
    const facets = this.store.facets();
    if (!facets) {
      return [];
    }

    return groupCatalogTagFacets(facets.tags);
  });

  /**
   * Handles search query input changes.
   *
   * @param value - The new search query string.
   */
  onQueryInput(value: string): void {
    this.store.setQuery(value);
  }

  /**
   * Handles difficulty filter changes.
   *
   * @param value - The selected difficulty level, or `null` to clear.
   */
  onDifficultyChange(value: CardDifficulty | null): void {
    this.store.setDifficulty(value);
  }

  /**
   * Handles course filter changes.
   *
   * @param courseId - The selected course ID, or `null` to clear.
   */
  onCourseChange(courseId: string | null): void {
    void this.store.setCourse(courseId);
  }

  /**
   * Handles lesson filter changes.
   *
   * @param lessonId - The selected lesson ID, or `null` to clear.
   */
  onLessonChange(lessonId: string | null): void {
    void this.store.setLesson(lessonId);
  }

  /**
   * Handles scenario filter changes.
   *
   * @param scenarioId - The selected scenario ID, or `null` to clear.
   */
  onScenarioChange(scenarioId: string | null): void {
    this.store.setScenario(scenarioId);
  }

  /**
   * Checks whether a given card kind is currently selected.
   *
   * @param kind - The card kind to check.
   * @returns `true` if the kind is in the selected kinds set.
   */
  isKindSelected(kind: CardKind): boolean {
    return this.store.selectedKinds().includes(kind);
  }

  /**
   * Checks whether a given tag is currently selected.
   *
   * @param tag - The tag to check.
   * @returns `true` if the tag is in the selected tags set.
   */
  isTagSelected(tag: string): boolean {
    return this.store.selectedTags().includes(tag);
  }

  /**
   * Toggles a card kind in the selected kinds.
   *
   * @param kind - The card kind to add or remove.
   */
  toggleKind(kind: CardKind): void {
    this.store.toggleKind(kind);
  }

  /**
   * Toggles a tag in the selected tags.
   *
   * @param tag - The tag to add or remove.
   */
  toggleTag(tag: string): void {
    this.store.toggleTag(tag);
  }

  /**
   * Clears all active search filters and resets pagination.
   *
   * @remarks
   * Delegates to `store.clearFilters()`, which preserves locked language pair settings.
   */
  clearFilters(): void {
    this.store.clearFilters();
  }
}
