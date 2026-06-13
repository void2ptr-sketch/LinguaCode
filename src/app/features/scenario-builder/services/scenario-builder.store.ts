import { Injectable, computed, inject, signal } from '@angular/core';

import {
  DEFAULT_CRITERIA_LIMIT,
  hasCardSearchFilters,
} from '../../../core/data/scenario-card-source.utils';
import { CardSearchService } from '../../../core/data';
import { Scenario, ScenarioCardSource } from '../../../core/models';
import { sanitizePlainText } from '../../../core/security';
import { UserStore } from '../../../core/state';
import { ScenarioBuilderService } from './scenario-builder.service';
import { ScenarioDraft, ScenarioEditorMode } from '../types';

const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
const sanitizeDescription = (value: string): string => sanitizePlainText(value, 512);

@Injectable({ providedIn: 'root' })
export class ScenarioBuilderStore {
  private readonly scenarioBuilderService = inject(ScenarioBuilderService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly userStore = inject(UserStore);

  readonly scenarios = signal<readonly Scenario[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editorMode = signal<ScenarioEditorMode>('list');
  readonly editingScenarioId = signal<string | null>(null);

  readonly editingScenario = computed(() => {
    const id = this.editingScenarioId();
    if (!id) {
      return null;
    }

    return this.scenarios().find((scenario) => scenario.id === id) ?? null;
  });

  readonly catalogById = computed(() => {
    return new Map(this.cardSearchService.indexEntries().map((entry) => [entry.id, entry]));
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.cardSearchService.ensureIndexLoaded();
      this.scenarios.set(this.scenarioBuilderService.loadScenarios());
    } catch {
      this.error.set('Не удалось загрузить данные конструктора');
    } finally {
      this.loading.set(false);
    }
  }

  startCreate(): void {
    this.editorMode.set('create');
    this.editingScenarioId.set(null);
    this.error.set(null);
  }

  startEdit(scenarioId: string): void {
    this.editorMode.set('edit');
    this.editingScenarioId.set(scenarioId);
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingScenarioId.set(null);
    this.error.set(null);
  }

  createScenario(draft: ScenarioDraft): boolean {
    const payload = this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    const scenario: Scenario = {
      id: crypto.randomUUID(),
      title: payload.title,
      description: payload.description,
      authorId: this.userStore.user().id,
      cardSource: payload.cardSource,
    };

    const nextScenarios = [...this.scenarios(), scenario];
    this.persist(nextScenarios);
    this.cancelEdit();
    return true;
  }

  updateScenario(scenarioId: string, draft: ScenarioDraft): boolean {
    const payload = this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    const nextScenarios = this.scenarios().map((scenario) =>
      scenario.id === scenarioId
        ? {
            ...scenario,
            title: payload.title,
            description: payload.description,
            cardSource: payload.cardSource,
          }
        : scenario,
    );

    this.persist(nextScenarios);
    this.cancelEdit();
    return true;
  }

  deleteScenario(scenarioId: string): void {
    const nextScenarios = this.scenarios().filter((scenario) => scenario.id !== scenarioId);
    this.persist(nextScenarios);

    if (this.editingScenarioId() === scenarioId) {
      this.cancelEdit();
    }
  }

  cardTitle(cardId: string): string {
    return this.catalogById().get(cardId)?.title ?? cardId;
  }

  private normalizeDraft(draft: ScenarioDraft): ScenarioDraft | null {
    const title = sanitizeTitle(draft.title);
    const description = sanitizeDescription(draft.description);
    const cardSource = this.normalizeCardSource(draft.cardSource);

    if (!title) {
      this.error.set('Укажите название сценария');
      return null;
    }

    if (!cardSource) {
      return null;
    }

    return { title, description, cardSource };
  }

  private normalizeCardSource(source: ScenarioCardSource): ScenarioCardSource | null {
    if (source.mode === 'fixed') {
      const cardIds = [
        ...new Set(source.cardIds.filter((cardId) => this.catalogById().has(cardId))),
      ];

      if (cardIds.length === 0) {
        this.error.set('Выберите хотя бы одну карточку');
        return null;
      }

      return { mode: 'fixed', cardIds };
    }

    if (!hasCardSearchFilters(source.criteria)) {
      this.error.set('Укажите хотя бы один критерий отбора карточек');
      return null;
    }

    const limit = source.limit ?? DEFAULT_CRITERIA_LIMIT;
    if (limit <= 0) {
      this.error.set('Лимит карточек должен быть больше 0');
      return null;
    }

    return {
      mode: 'criteria',
      criteria: {
        query: source.criteria.query?.trim() || undefined,
        language: source.criteria.language,
        difficulty: source.criteria.difficulty,
        kinds: source.criteria.kinds?.length ? source.criteria.kinds : undefined,
        tags: source.criteria.tags?.length ? source.criteria.tags : undefined,
      },
      limit,
    };
  }

  private persist(scenarios: readonly Scenario[]): void {
    this.scenarios.set(scenarios);
    this.scenarioBuilderService.saveScenarios(scenarios);
  }
}
