/**
 * Service for loading tag metadata from the backend.
 *
 * @remarks
 * Loads tags from `GET /api/v1/cards/tags`.
 * Each tag has a `code` and a `label` (human-readable name).
 */
import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { buildApiUrl } from '../../../shared/api/api-url';
import type { ApiListResponse } from '../../../shared/api/api.types';

export type TagOption = {
  code: string;
  label: string;
};

@Injectable({ providedIn: 'root' })
export class TagsService {
  private readonly http = inject(HttpClient);

  /** Raw tags loaded from backend. */
  private readonly tagsRaw = signal<TagOption[]>([]);

  /** Whether tags are currently being loaded. */
  readonly loading = signal(false);

  /** Whether tags have been successfully loaded. */
  readonly loaded = signal(false);

  /** Tag codes from backend. */
  readonly tagCodes = computed<string[]>(() => this.tagsRaw().map((t) => t.code));

  /** { code → label } map for tags from backend. */
  readonly tagLabels = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const tag of this.tagsRaw()) {
      map[tag.code] = tag.label;
    }
    return map;
  });

  /**
   * Returns a human-readable label for a tag.
   * Uses backend data when loaded, falls back to the tag code itself.
   */
  getLabel(tag: string): string {
    const labels = this.tagLabels();
    return labels[tag] ?? tag;
  }

  /**
   * Checks if a tag code is known to the backend catalog.
   */
  isValid(tag: string): boolean {
    return this.tagCodes().includes(tag);
  }

  /**
   * Loads tags from the backend.
   *
   * @returns Promise that resolves when loading completes.
   */
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<ApiListResponse<TagOption>>(buildApiUrl('/cards/tags')),
      );
      const data = response.data ?? [];
      this.tagsRaw.set([...data]);
      this.loaded.set(true);
    } catch {
      this.tagsRaw.set([]);
      this.loaded.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  /** Reloads tags from backend (bypasses cache). */
  async reload(): Promise<void> {
    this.loaded.set(false);
    await this.load();
  }
}
