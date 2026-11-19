/**
 * App settings service — wraps the generated ReferenceSettings API client
 * and exposes reactive, signal-based settings with fallback defaults.
 *
 * Endpoints:
 * - GET /api/v1/reference/settings/validation → ValidationRulesResponse
 * - GET /api/v1/reference/settings/pagination  → PaginationSettingsResponse
 * - GET /api/v1/reference/settings/sync        → SyncSettingsResponse
 * - GET /api/v1/reference/settings/chinese     → ChineseSettingsResponse
 *
 * All values fall back to hardcoded defaults when the API is unavailable
 * or returns empty data, ensuring the UI never breaks on a fresh deploy.
 */
import { Injectable, computed, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReferenceSettingsService } from './generated/reference-settings';
import type {
  ValidationRulesResponse,
  PaginationSettingsResponse,
  SyncSettingsResponse,
  ChineseSettingsResponse,
} from './generated/models';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly api = inject(ReferenceSettingsService);

  /** Raw responses from backend (null = not yet loaded). */
  private readonly validationRulesState = signal<ValidationRulesResponse | null>(null);
  private readonly paginationState = signal<PaginationSettingsResponse | null>(null);
  private readonly syncState = signal<SyncSettingsResponse | null>(null);
  private readonly chineseState = signal<ChineseSettingsResponse | null>(null);

  /** Whether any settings are currently being loaded. */
  readonly loading = signal(false);
  /** Whether all settings have been successfully loaded. */
  readonly loaded = signal(false);

  /** In-flight load promise for deduplication. */
  private loadPromise: Promise<void> | null = null;

  // ── Validation rules ──────────────────────────────────────────────────

  /** Maximum allowed title length (fallback: 200). */
  readonly maxTitleLength = computed(() => this.validationRulesState()?.maxTitleLength ?? 200);

  /** Maximum allowed description length (fallback: 2000). */
  readonly maxDescriptionLength = computed(
    () => this.validationRulesState()?.maxDescriptionLength ?? 2000,
  );

  /** Maximum number of tags allowed per entity (fallback: 10). */
  readonly maxTagsPerEntity = computed(() => this.validationRulesState()?.maxTagsPerEntity ?? 10);

  /** Whether tags are required (fallback: false). */
  readonly requireTags = computed(() => this.validationRulesState()?.requireTags ?? false);

  // ── Pagination ────────────────────────────────────────────────────────

  /** Default page size (fallback: 50). */
  readonly defaultPageSize = computed(() => this.paginationState()?.defaultPageSize ?? 50);

  /** Maximum allowed page size (fallback: 200). */
  readonly maxPageSize = computed(() => this.paginationState()?.maxPageSize ?? 200);

  // ── Sync ──────────────────────────────────────────────────────────────

  /** Maximum batch size for sync operations (fallback: 500). */
  readonly maxSyncBatchSize = computed(() => this.syncState()?.maxBatchSize ?? 500);

  /** Timeout in seconds for sync operations (fallback: 300). */
  readonly syncTimeoutSeconds = computed(() => this.syncState()?.syncTimeoutSeconds ?? 300);

  // ── Chinese content display ───────────────────────────────────────────

  /** Whether Pinyin is shown (fallback: true). */
  readonly showPinyin = computed(() => this.chineseState()?.showPinyin ?? true);

  /** Whether tone marks are shown (fallback: true). */
  readonly showTones = computed(() => this.chineseState()?.showTones ?? true);

  /** Whether Hanzi characters are shown (fallback: true). */
  readonly showHanzi = computed(() => this.chineseState()?.showHanzi ?? true);

  /** Position of Pinyin relative to Hanzi: `above` | `below` | `right` (fallback: `above`). */
  readonly pinyinPosition = computed(() => this.chineseState()?.pinyinPosition ?? 'above');

  /**
   * Loads all settings from the backend, sharing the in-flight request
   * between concurrent callers.
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
   * Reloads all settings from the backend (bypasses cache).
   *
   * @returns Promise that resolves when loading completes.
   */
  async reload(): Promise<void> {
    this.loaded.set(false);
    await this.load();
  }

  /**
   * Loads all four settings endpoints in parallel.
   *
   * @returns Promise that resolves when loading completes.
   * @private
   */
  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [validation, pagination, sync, chinese] = await Promise.allSettled([
        firstValueFrom(this.api.getValidationRules()),
        firstValueFrom(this.api.getPaginationSettings()),
        firstValueFrom(this.api.getSyncSettings()),
        firstValueFrom(this.api.getChineseSettings()),
      ]);

      if (validation.status === 'fulfilled') {
        this.validationRulesState.set(validation.value as ValidationRulesResponse);
      }
      if (pagination.status === 'fulfilled') {
        this.paginationState.set(pagination.value as PaginationSettingsResponse);
      }
      if (sync.status === 'fulfilled') {
        this.syncState.set(sync.value as SyncSettingsResponse);
      }
      if (chinese.status === 'fulfilled') {
        this.chineseState.set(chinese.value as ChineseSettingsResponse);
      }

      this.loaded.set(
        validation.status === 'fulfilled' &&
          pagination.status === 'fulfilled' &&
          sync.status === 'fulfilled' &&
          chinese.status === 'fulfilled',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
