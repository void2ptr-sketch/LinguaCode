import { Injectable, computed, inject, signal } from '@angular/core';

import { UserStore } from '../../user/model/user.store';
import { UserApiService } from '../../user/api/user-api.service';
import { normalizeLanguageCode } from '../utils/language-code.utils';
import { buildMirrorGroupKey, isContentLanguage } from '../utils/language-pair.utils';
import type { ContentLanguage } from '../../card/model';
import type { LanguagePair } from '../model/language-pair.types';
import type { PairGroup } from '../model/language-pair.types';
import type { DirectionCardEvent, DirectionItem } from '../ui/direction-card.component';
import { LanguageService } from './language.service';
import { AvailablePairsService } from './available-pairs.service';

/** Result of an activation attempt on a single direction card. */
export type SetActivePairResult = { ok: true } | { ok: false; reason: string };

/** Result of a removal attempt on a single direction card. */
export type RemovePairResult = { ok: true } | { ok: false; reason: string };

/**
 * Manages the user's language pairs on the profile page.
 *
 * @remarks
 * Encapsulates the mirror-group semantics that used to live in
 * `user-page.component`:
 * - builds the read-only pair catalog from `AvailablePairsService`
 *   (registry CRUD lives in `/tools/language-pairs`, author zone);
 * - groups catalog rows into mirror pairs (EN↔RU) with per-group
 *   activation highlight;
 * - activates a single direction strictly within its own mirror group
 *   (replacing the mirror sibling) and syncs the global active pair;
 * - removes a single direction, moving its group highlight to the mirror
 *   sibling when one remains.
 *
 * UI concerns (confirmation dialog, snackbar messages) stay in the calling
 * component — the service returns typed results instead.
 */
@Injectable({ providedIn: 'root' })
export class UserLanguagePairManagerService {
  private readonly userStore = inject(UserStore);
  private readonly availablePairs = inject(AvailablePairsService);
  private readonly userApi = inject(UserApiService);
  private readonly languageService = inject(LanguageService);

  /** Whether the language dictionary or the pair catalog is still loading. */
  readonly loading = computed(
    () =>
      this.languageService.loading() ||
      (this.availablePairs.loading() && !this.availablePairs.loaded()),
  );

  /** DB pairs filtered by the user's selected languages (normalized codes). */
  readonly configuredPairs = computed(() =>
    this.availablePairs.visiblePairs().map((p) => ({
      id: String(p.id),
      known: normalizeLanguageCode(p.knownCode),
      learning: normalizeLanguageCode(p.learningCode),
    })),
  );

  /** Search text for filtering the pair catalog (label or code). */
  readonly pairSearch = signal('');

  /**
   * Pairs grouped by mirror languages (EN↔RU, EN↔DE …).
   *
   * @remarks
   * The `isActive` flag of each direction card is derived from the
   * per-mirror-group highlight (`UserStore.activeByMirrorGroup`), NOT from
   * the global active pair. This isolates events: activation within one
   * mirror pair group never changes the highlight of other mirror pairs.
   */
  readonly groupedPairs = computed<PairGroup[]>(() => {
    const pairs = this.configuredPairs();
    const groupActive = this.userStore.activeByMirrorGroup();
    const groups = new Map<string, DirectionItem[]>();

    for (const p of pairs) {
      const key = buildMirrorGroupKey(p.known, p.learning);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      const marker = groupActive[key];
      const isActive = !!marker && marker.known === p.known && marker.learning === p.learning;
      groups.get(key)!.push({
        id: p.id,
        known: p.known,
        learning: p.learning,
        isActive,
      });
    }

    return Array.from(groups.entries()).map(([key, directions]) => ({
      key,
      directions,
      count: directions.length,
    }));
  });

  /**
   * Pair catalog filtered by the search text.
   *
   * @remarks
   * The catalog is the read-only view of the registry (`/language-pairs`
   * via `AvailablePairsService`); the profile never writes to it. A direction
   * card is matched when the search text appears in either language's label,
   * native name or code — case-insensitive.
   */
  readonly filteredGroupedPairs = computed<PairGroup[]>(() => {
    const query = this.pairSearch().trim().toLowerCase();
    const groups = this.groupedPairs();
    if (!query) {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        directions: group.directions.filter((dir) => this.matchesPairSearch(dir, query)),
      }))
      .filter((group) => group.directions.length > 0);
  });

  /** Whether the currently active pair exists. */
  readonly hasActivePair = computed(() => !!this.userStore.activeLanguagePairEntry());

  /** Currently active pair label (e.g. "English → Russian"). */
  readonly activePairLabel = computed(() => {
    const entry = this.userStore.activeLanguagePairEntry();
    if (!entry) {
      return 'No active pair';
    }
    return `${this.getLanguageLabel(entry.pair.known)} → ${this.getLanguageLabel(entry.pair.learning)}`;
  });

  /** Returns the display label for a language code. */
  getLanguageLabel(code: string): string {
    const lang = this.languageService.findByCode(code);
    return lang?.displayName ?? code;
  }

  /**
   * Activates a single direction card.
   *
   * @remarks
   * Strictly scoped to the card's own mirror pair group: the highlight moves
   * to this card within its group (its mirror sibling is the only other card
   * that may change). Cards of other mirror pairs are never affected. The
   * global active learning pair is synced so the header switcher follows the
   * user's explicit choice.
   */
  async setActivePair(event: DirectionCardEvent): Promise<SetActivePairResult> {
    // Resolve the card strictly by its full identity — no ambiguous lookups.
    const pair = this.configuredPairs().find((p) => p.id === event.pairId);
    if (!pair || pair.known !== event.known || pair.learning !== event.learning) {
      return { ok: false, reason: 'Пара не найдена' };
    }
    // Validate that both codes are recognized content languages before proceeding.
    if (!isContentLanguage(pair.known) || !isContentLanguage(pair.learning)) {
      return { ok: false, reason: 'Пара не найдена' };
    }

    const direction: LanguagePair = {
      known: pair.known as ContentLanguage,
      learning: pair.learning as ContentLanguage,
    };
    const groupKey = buildMirrorGroupKey(direction.known, direction.learning);

    // Find the mirror sibling in UserStore (by known/learning, not by backend ID).
    const mirrorSiblingInStore = this.userStore
      .languagePairs()
      .find((e) => e.pair.known === direction.learning && e.pair.learning === direction.known);

    // Remove mirror sibling from UserStore if it exists — without any
    // activation side effects; the highlight is re-established below.
    if (mirrorSiblingInStore) {
      this.userStore.removeMirrorSibling(mirrorSiblingInStore.id);
    }

    // Ensure a UserStore entry exists for the exact direction — without
    // any activation side effects. Capture the returned ID to avoid a
    // redundant store lookup that could fail and send `null` to the backend.
    const entryId = this.userStore.addLanguagePair(direction, { activate: false });
    if (!entryId) {
      return { ok: false, reason: 'Не удалось добавить пару' };
    }

    // Highlight within this mirror pair group only.
    this.userStore.setActivePairInGroup(groupKey, direction);

    // Sync the global active learning pair (header switcher, learning scope).
    this.userStore.setActiveLanguagePair(entryId);

    // Persist active pair to backend (users/preferences only).
    try {
      await this.userApi.patchUserPreferences({
        activeLanguagePairId: entryId,
        learningPairs: this.userStore
          .languagePairs()
          .map((p) => ({ known: p.pair.known, learning: p.pair.learning })),
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: (error as Error).message };
    }
  }

  /**
   * Removes a configured pair (single-card event).
   *
   * @remarks
   * Affects only the removed direction: the matching UserStore entry is
   * removed and this group's highlight moves to the mirror sibling (if still
   * configured) or is cleared. Other mirror pair groups are never touched.
   * The caller is responsible for the confirmation dialog and for showing
   * result messages.
   */
  async removePair(event: DirectionCardEvent): Promise<RemovePairResult> {
    // Resolve the card strictly by its full identity — no ambiguous lookups.
    const pair = this.configuredPairs().find((p) => p.id === event.pairId);
    if (!pair || pair.known !== event.known || pair.learning !== event.learning) {
      return { ok: false, reason: 'Пара не найдена' };
    }

    // Remove the matching UserStore entry (exact codes). The store moves
    // this group's highlight to the mirror sibling or clears it.
    const entry = this.userStore
      .languagePairs()
      .find((e) => e.pair.known === pair.known && e.pair.learning === pair.learning);
    if (entry) {
      this.userStore.removeLanguagePair(entry.id);
    }

    // Refresh the pairs list (force reload after mutation)
    await this.availablePairs.load(true);

    // If the removed direction was this group's highlight and the mirror
    // sibling is still configured, move the highlight to it. This only
    // ever affects the group the removed card belonged to.
    const groupKey = buildMirrorGroupKey(pair.known, pair.learning);
    const marker = this.userStore.activeByMirrorGroup()[groupKey];
    if (marker && marker.known === pair.known && marker.learning === pair.learning) {
      const sibling = this.configuredPairs().find(
        (p) => p.known === pair.learning && p.learning === pair.known,
      );
      if (sibling) {
        this.userStore.setActivePairInGroup(groupKey, {
          known: sibling.known as ContentLanguage,
          learning: sibling.learning as ContentLanguage,
        });
      }
    }

    // Persist updated pairs to backend (users/preferences only).
    try {
      await this.userApi.patchUserPreferences({
        learningPairs: this.userStore
          .languagePairs()
          .map((p) => ({ known: p.pair.known, learning: p.pair.learning })),
        activeLanguagePairId: this.userStore.activeLanguagePairId(),
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: (error as Error).message };
    }
  }

  /** Checks whether a direction card matches the pair search query. */
  private matchesPairSearch(dir: { known: string; learning: string }, query: string): boolean {
    const fields = [
      dir.known,
      dir.learning,
      this.getLanguageLabel(dir.known),
      this.getLanguageLabel(dir.learning),
      this.languageService.findByCode(dir.known)?.nativeName ?? '',
      this.languageService.findByCode(dir.learning)?.nativeName ?? '',
    ];
    return fields.some((f) => f.toLowerCase().includes(query));
  }
}
