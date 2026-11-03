import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { CardDifficulty, CardKind, CardSearchFacets } from '../../../model';
import { CatalogService } from '../../../api/catalog.service';
import { TagsService } from '../../../api/tags.service';
import { groupCatalogTagFacets } from '../../../lib/catalog-tag-groups/catalog-tag-groups.util';
import { CardCatalogSearchStore } from '../../../lib/card-catalog-search/card-catalog-search.store';

/**
 * Card catalog filters component. Provides search, difficulty, kind, and tag filtering
 * for the card catalog.
 * @remarks Delegates filter state management to `CardCatalogSearchStore`.
 */
@Component({
  selector: 'app-card-catalog-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly catalogService = inject(CatalogService);
  private readonly tagsService = inject(TagsService);

  /**
   * Available difficulty levels from backend catalog.
   */
  readonly difficulties = computed<CardDifficulty[]>(() =>
    this.catalogService.difficulties().map((d) => d.code as CardDifficulty),
  );

  /**
   * Labels for difficulty levels from backend catalog.
   */
  readonly difficultyLabels = computed<Record<CardDifficulty, string>>(
    () =>
      Object.fromEntries(
        this.catalogService.difficulties().map((d) => [d.code, d.label]),
      ) as Record<CardDifficulty, string>,
  );

  /**
   * Labels for card kinds from backend catalog.
   */
  readonly kindLabels = computed<Record<CardKind, string>>(
    () =>
      Object.fromEntries(this.catalogService.cardKinds().map((k) => [k.code, k.label])) as Record<
        CardKind,
        string
      >,
  );

  /**
   * Labels for tags from backend catalog.
   */
  readonly tagLabels = computed<Record<string, string>>(() => this.tagsService.tagLabels());

  /**
   * Returns a human-readable label for a tag.
   * Uses backend data when loaded, falls back to tag id.
   */
  getTagLabel(tag: string): string {
    return this.tagsService.getLabel(tag);
  }

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
