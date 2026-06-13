import { Injectable, computed, inject, signal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';

import { CardSearchService } from '../../core/data';
import type {
  CardDifficulty,
  CardKind,
  CardSearchPage,
  ContentLanguage,
} from '../../core/models';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../pagination';

@Injectable()
export class CardCatalogSearchStore {
  private readonly cardSearchService = inject(CardSearchService);

  readonly query = signal('');
  readonly language = signal<ContentLanguage | null>(null);
  readonly difficulty = signal<CardDifficulty | null>(null);
  readonly selectedKinds = signal<readonly CardKind[]>([]);
  readonly selectedTags = signal<readonly string[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  readonly loading = computed(() => this.cardSearchService.loading());
  readonly error = computed(() => this.cardSearchService.error());
  readonly result = signal<CardSearchPage | null>(null);

  readonly entries = computed(() => this.result()?.items ?? []);
  readonly facets = computed(() => this.result()?.facets ?? null);
  readonly totalItems = computed(() => this.result()?.totalItems ?? 0);

  async init(): Promise<void> {
    await this.executeSearch();
  }

  reload(): void {
    void this.init();
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.resetPageAndSearch();
  }

  setLanguage(value: ContentLanguage | null): void {
    this.language.set(value);
    this.resetPageAndSearch();
  }

  setDifficulty(value: CardDifficulty | null): void {
    this.difficulty.set(value);
    this.resetPageAndSearch();
  }

  toggleKind(kind: CardKind): void {
    const current = this.selectedKinds();
    this.selectedKinds.set(
      current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
    );
    this.resetPageAndSearch();
  }

  toggleTag(tag: string): void {
    const current = this.selectedTags();
    this.selectedTags.set(
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
    this.resetPageAndSearch();
  }

  clearFilters(): void {
    this.query.set('');
    this.language.set(null);
    this.difficulty.set(null);
    this.selectedKinds.set([]);
    this.selectedTags.set([]);
    this.resetPageAndSearch();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.executeSearch();
  }

  private resetPageAndSearch(): void {
    this.pageIndex.set(0);
    void this.executeSearch();
  }

  private async executeSearch(): Promise<void> {
    try {
      const result = await this.cardSearchService.search(this.currentCriteria());
      this.result.set(result);
    } catch {
      this.result.set(null);
    }
  }

  private currentCriteria() {
    return {
      query: this.query().trim() || undefined,
      language: this.language() ?? undefined,
      difficulty: this.difficulty() ?? undefined,
      kinds: this.selectedKinds().length > 0 ? this.selectedKinds() : undefined,
      tags: this.selectedTags().length > 0 ? this.selectedTags() : undefined,
      page: {
        page: this.pageIndex(),
        pageSize: this.pageSize(),
      },
    };
  }
}
