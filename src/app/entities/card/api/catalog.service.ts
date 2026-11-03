/**
 * Service that loads card catalog metadata (kinds, difficulties, content languages)
 * from the backend instead of relying on hardcoded constants.
 *
 * Endpoints:
 * - GET /api/v1/cards/kinds       → card kinds + labels + difficulty options
 * - GET /api/v1/content-languages → content language definitions
 */
import { Injectable, computed, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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
  private readonly contentLanguagesApi = inject(ContentLanguagesService);

  /** Raw card-kinds response from backend. */
  private readonly cardKindsRaw = signal<ReferenceOptionDto[]>([]);

  /** Raw content-languages response from backend. */
  private readonly contentLanguagesRaw = signal<ReferenceOptionDto[]>([]);

  /** Whether card kinds are currently being loaded. */
  readonly loading = signal(false);

  /** Whether all catalog data has been successfully loaded. */
  readonly loaded = signal(false);

  /** Parsed card kinds (non-difficulty options). */
  readonly cardKinds = computed<CatalogOption[]>(() => {
    return this.cardKindsRaw()
      .filter((opt) => opt.code && opt.code !== 'difficulty')
      .map((opt) => ({ code: opt.code!, label: opt.label ?? opt.code! }));
  });

  /** Difficulty options from backend. */
  readonly difficulties = computed<CatalogOption[]>(() => {
    return this.cardKindsRaw()
      .filter((opt) => opt.code === 'difficulty' && opt.label)
      .flatMap((opt) =>
        (opt.label ?? '')
          .split(',')
          .map((d) => ({ code: d.trim().toLowerCase(), label: d.trim() }))
          .filter((d) => d.code),
      );
  });

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
   * Loads all catalog data from the backend.
   *
   * @returns Promise that resolves when loading completes.
   */
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [kindsRes, langsRes] = await Promise.all([
        firstValueFrom(this.cardKindsApi.listAll7<ReferenceOptionDtoList>()),
        firstValueFrom(this.contentLanguagesApi.listAll6<ReferenceOptionDtoList>()),
      ]);

      const kindsData = (kindsRes as ReferenceOptionDtoList)?.data ?? [];
      const langsData = (langsRes as ReferenceOptionDtoList)?.data ?? [];

      this.cardKindsRaw.set(kindsData);
      this.contentLanguagesRaw.set(langsData);
      this.loaded.set(true);
    } catch {
      this.cardKindsRaw.set([]);
      this.contentLanguagesRaw.set([]);
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
