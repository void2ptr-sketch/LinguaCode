/**
 * Service that loads card catalog metadata (kinds, difficulties, content
 * languages) from the backend.
 *
 * Endpoints:
 * - GET /api/v1/cards/kinds        → card kinds + labels
 * - GET /api/v1/cards/difficulties → difficulty levels from `content_difficulty_levels`
 * - GET /api/v1/content-languages  → content language definitions
 */
import { Injectable, computed, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CardDifficultiesService } from '../../../shared/api/generated/card-difficulties';
import { CardKindsService } from '../../../shared/api/generated/card-kinds';
import { ContentLanguagesService } from '../../../shared/api/generated/content-languages';
import type {
  ReferenceOptionDto,
  ReferenceOptionDtoList,
} from '../../../shared/api/generated/models';

export type CatalogOption = {
  code: string;
  label: string;
};

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly cardKindsApi = inject(CardKindsService);
  private readonly cardDifficultiesApi = inject(CardDifficultiesService);
  private readonly contentLanguagesApi = inject(ContentLanguagesService);

  /** Raw card-kinds response from backend. */
  private readonly cardKindsRaw = signal<ReferenceOptionDto[]>([]);

  /** Raw difficulty-levels response from backend. */
  private readonly difficultiesRaw = signal<ReferenceOptionDto[]>([]);

  /** Raw content-languages response from backend. */
  private readonly contentLanguagesRaw = signal<ReferenceOptionDto[]>([]);

  /** Whether catalog data is currently being loaded. */
  readonly loading = signal(false);

  /** Whether all catalog data has been successfully loaded. */
  readonly loaded = signal(false);

  /** In-flight catalog load, used to deduplicate concurrent callers. */
  private loadPromise: Promise<void> | null = null;

  /** Parsed card kinds (non-difficulty options). */
  readonly cardKinds = computed<CatalogOption[]>(() => {
    return this.cardKindsRaw()
      .filter((opt) => opt.code && opt.code !== 'difficulty')
      .map((opt) => ({ code: opt.code!, label: opt.label ?? opt.code! }));
  });

  /**
   * Difficulty options for select controls.
   *
   * @remarks
   * Values come from the backend reference endpoint backed by the
   * `content_difficulty_levels` table. Constants are used only by the mock
   * interceptor when `useCardsApiMock` is enabled.
   */
  readonly difficulties = computed<CatalogOption[]>(() =>
    this.difficultiesRaw()
      .filter((opt) => opt.code && opt.label)
      .map((opt) => ({ code: opt.code!, label: opt.label! })),
  );

  /** Content language codes from backend. */
  readonly contentLanguageCodes = computed<string[]>(() =>
    this.contentLanguagesRaw()
      .filter((opt) => opt.code)
      .map((opt) => opt.code!),
  );

  /** { code → label } map for card kinds. */
  readonly cardKindLabels = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const kind of this.cardKinds()) {
      map[kind.code] = kind.label;
    }
    return map;
  });

  /** { code → label } map for difficulties. */
  readonly difficultyLabels = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const diff of this.difficulties()) {
      map[diff.code] = diff.label;
    }
    return map;
  });

  /** All valid catalog codes (kinds + difficulties + content languages). */
  readonly validCodes = computed<string[]>(() => [
    ...this.cardKinds().map((k) => k.code),
    ...this.difficulties().map((d) => d.code),
    ...this.contentLanguageCodes(),
  ]);

  /** Checks whether a code is known to the backend catalog. */
  isValid(code: string): boolean {
    return this.validCodes().includes(code);
  }

  /**
   * Loads the catalog once, sharing the in-flight request between callers.
   *
   * @remarks
   * Safe to call from component `ngOnInit`: repeated calls are no-ops once the
   * catalog has been loaded, and concurrent calls share a single HTTP request.
   *
   * @returns Promise that resolves when loading completes.
   */
  async ensureLoaded(): Promise<void> {
    if (this.loaded()) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.load().finally(() => {
        this.loadPromise = null;
      });
    }

    return this.loadPromise;
  }

  /**
   * Loads all catalog data from the backend.
   *
   * @returns Promise that resolves when loading completes.
   */
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [kindsResult, difficultiesResult, langsResult] = await Promise.allSettled([
        firstValueFrom(this.cardKindsApi.listAll7<ReferenceOptionDtoList>()),
        firstValueFrom(this.cardDifficultiesApi.listAll8<ReferenceOptionDtoList>()),
        firstValueFrom(this.contentLanguagesApi.listAll6<ReferenceOptionDtoList>()),
      ]);

      if (kindsResult.status === 'fulfilled') {
        this.cardKindsRaw.set((kindsResult.value as ReferenceOptionDtoList)?.data ?? []);
      }
      if (difficultiesResult.status === 'fulfilled') {
        this.difficultiesRaw.set([...(difficultiesResult.value?.data ?? [])]);
      }
      if (langsResult.status === 'fulfilled') {
        this.contentLanguagesRaw.set((langsResult.value as ReferenceOptionDtoList)?.data ?? []);
      }

      this.loaded.set(
        kindsResult.status === 'fulfilled' &&
          difficultiesResult.status === 'fulfilled' &&
          langsResult.status === 'fulfilled',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Checks if a string is a valid content language code.
   * Delegates to backend data when loaded, falls back to true if not loaded.
   */
  isContentLanguage(code: unknown): code is string {
    if (typeof code !== 'string' || code.length === 0) return false;
    // If catalog is loaded, validate against backend data
    if (this.loaded()) {
      return this.contentLanguageCodes().includes(code);
    }
    // Not loaded yet — defer validation (accept to avoid blocking)
    return true;
  }

  /** Reloads catalog data from backend (bypasses cache). */
  async reload(): Promise<void> {
    this.loaded.set(false);
    await this.load();
  }
}
