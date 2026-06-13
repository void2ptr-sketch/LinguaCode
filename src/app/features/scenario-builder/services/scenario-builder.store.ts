import { Injectable, computed, inject, signal } from '@angular/core';
import { Scenario } from '../../../core/models';
import { sanitizePlainText } from '../../../core/security';
import { UserStore } from '../../../core/state';
import { ScenarioBuilderService } from './scenario-builder.service';
import { CardCatalogItem, ScenarioDraft, ScenarioEditorMode } from '../types';

const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
const sanitizeDescription = (value: string): string => sanitizePlainText(value, 512);

@Injectable({ providedIn: 'root' })
export class ScenarioBuilderStore {
  private readonly scenarioBuilderService = inject(ScenarioBuilderService);
  private readonly userStore = inject(UserStore);

  readonly scenarios = signal<readonly Scenario[]>([]);
  readonly catalog = signal<readonly CardCatalogItem[]>([]);
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
    return new Map(this.catalog().map((item) => [item.id, item]));
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const fixture = await this.scenarioBuilderService.loadCatalog();
      this.catalog.set(fixture.cards);
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
      cardIds: payload.cardIds,
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
            cardIds: payload.cardIds,
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
    const cardIds = [...new Set(draft.cardIds.filter((cardId) => this.catalogById().has(cardId)))];

    if (!title || cardIds.length === 0) {
      this.error.set('Укажите название и выберите хотя бы одну карточку');
      return null;
    }

    return { title, description, cardIds };
  }

  private persist(scenarios: readonly Scenario[]): void {
    this.scenarios.set(scenarios);
    this.scenarioBuilderService.saveScenarios(scenarios);
  }
}
