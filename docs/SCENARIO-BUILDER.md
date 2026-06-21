# Конструктор сценариев (масштабирование)

Переход от in-memory `localStorage` и полной загрузки `CardRepository` к каталогу сценариев и точечной загрузке карточек при прохождении.

Связанные документы: [INDEX.md](./INDEX.md) · [BUSINESS.md](./BUSINESS.md) · [DOMAIN.md](./DOMAIN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CARD-CATALOG.md](./CARD-CATALOG.md) · [TASKS.md](../TASKS.md).

## Решение: индекс сценария + полный Scenario

| Слой | Тип | Назначение |
|------|-----|------------|
| Каталог | `ScenarioIndexEntry` | id, title, authorId, cardSource summary, published, updatedAt |
| Детали | `Scenario` | title, description, `cardSource`, `published`, `updatedAt` |
| Поиск | `ScenarioSearchCriteria` + `PageRequest` | query, scope, authorId + пагинация |
| Ответ API | `PageResponse<ScenarioIndexEntry>` | items + totalItems + totalPages |

Полный `Scenario` запрашивается по `id` только при открытии редактора или прохождении.

## ScenarioCardSource

```typescript
type ScenarioCardSort = 'updatedAt' | 'difficulty' | 'random';

type ScenarioCardSource =
  | { mode: 'fixed'; cardIds: readonly string[] }
  | {
      mode: 'criteria';
      criteria: Omit<CardSearchCriteria, 'page'>;
      limit?: number;
      sort?: ScenarioCardSort;
      seed?: string;
    }
  | {
      mode: 'snapshot';
      cardIds: readonly string[];
      criteria: Omit<CardSearchCriteria, 'page'>;
      limit?: number;
      frozenAt: string;
    };
```

- **criteria** — live-набор (пересчитывается при прохождении).
- **snapshot** — зафиксированный набор (`frozenAt`); создаётся кнопкой «Зафиксировать snapshot» в конструкторе.

## HTTP API

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/scenarios/search?...` | index + фильтры + пагинация |
| GET | `/api/scenarios/:id` | полный `Scenario` |
| POST | `/api/scenarios` | создание |
| PUT | `/api/scenarios/:id` | обновление |
| DELETE | `/api/scenarios/:id` | удаление |
| GET | `/api/scenarios/by-card/:cardId` | сценарии, использующие карточку |
| POST | `/api/cards/batch` | `{ ids: string[] }` → `Card[]` (прохождение) |

Mock в dev: `useScenariosApiMock: true`, `scenariosApiMockInterceptor` + `ScenariosCatalogMockHandler` (хранение в `localStorage`, миграция из legacy JSON).

## Multi-user (mock)

| Возможность | Реализация |
|-------------|------------|
| Scope | `mine` · `published` · `all` в `ScenarioSearchCriteria` |
| Публикация | поле `Scenario.published`, toggle в редакторе |
| Read-only | чужой сценарий — просмотр без save/delete |
| Валидация | `validateScenarioCardSource` в mock handler |
| 403 | PUT/DELETE чужого сценария |

## UI

### Конструктор — `/tools/scenario-builder`

Единый экран **«Конструктор сценариев»** — список сценариев на странице, create / edit / view в `MatDialog`. См. [Dialog редактора](#dialog-редактора).

- paginator + поиск + scope (mine / published / all);
- create / edit / view через `ScenarioBuilderDialogService`;
- источник карточек: fixed / criteria / snapshot;
- preview ids и sort/seed в criteria editor;
- toggle «Опубликовать сценарий»;
- read-only для чужих сценариев (иконка «просмотр»).

### Обучение — `/cards/select`

- `ScenarioPickerComponent` — search + paginator;
- загрузка карточек через `POST /cards/batch`;
- подпись источника в заголовке сессии.

## Dialog редактора

Create / edit / view в modal (аналог [CARD-CATALOG.md — Dialog](./CARD-CATALOG.md#dialog-редактора)).

| Элемент | Путь |
|---------|------|
| Shell dialog | `features/scenario-builder/components/scenario-builder-dialog/` |
| Открытие | `ScenarioBuilderDialogService.openCreate` / `openEdit` |
| Форма | `ScenarioEditorFormComponent` |
| Discard confirm | `CardEditorDiscardDialogComponent` (reuse) |

### Решение

| Слой | Компонент | Назначение |
|------|-----------|------------|
| Страница | `ScenarioBuilderPageComponent` | список, search, scope, paginator, delete |
| Dialog | `ScenarioBuilderDialogComponent` | shell: title, loading, errors, actions |
| Форма | `ScenarioEditorFormComponent` | поля + `ScenarioCardPicker` / `ScenarioCardCriteriaEditor` |
| Сервис | `ScenarioBuilderDialogService` | `openCreate`, `openEdit` |
| Store | `ScenarioBuilderStore` | без изменения CRUD-логики |

```typescript
type ScenarioBuilderDialogData =
  | { mode: 'create' }
  | { mode: 'edit'; scenarioId: string };

type ScenarioBuilderDialogResult = { saved: boolean };
```

### Режимы dialog

| Режим | Заголовок | Save | Discard confirm |
|-------|-----------|------|-----------------|
| create | «Новый сценарий» | да | при dirty draft |
| edit (свой) | «Редактирование» | да | при dirty draft |
| view (чужой) | «Просмотр сценария» | нет | не требуется |

Read-only определяется через `ScenarioBuilderStore.isReadOnly()`.

### Конфигурация MatDialog

| Параметр | Значение |
|----------|----------|
| `panelClass` | `scenario-builder-dialog` |
| `width` | `min(1100px, 96vw)` |
| `maxHeight` | `90vh` |
| `disableClose` | `true` |
| Mobile | fullscreen через `@media (max-width: 48rem)` в `styles.scss` |

Scroll — только в `mat-dialog-content`; footer с кнопками фиксирован.

### Зависимости внутри dialog

- `CardCatalogSearchStore` — `providers` на dialog-компоненте (picker и criteria editor);
- discard confirm — переиспользовать `CardEditorDiscardDialogComponent` или вынести в `shared/`;
- guard от двойного открытия — в `ScenarioBuilderDialogService`.

### Этап F — dialog UI

| Шаг | Содержание | Статус |
|-----|------------|--------|
| F1 | `ScenarioEditorFormComponent` — вынести форму из page | готово |
| F2 | `ScenarioBuilderDialogComponent` + `ScenarioBuilderDialogService` | готово |
| F3 | Page: убрать inline editor, wiring open/close | готово |
| F4 | Discard confirm, responsive styles, docs | готово |

## Этапы реализации

| Этап | Содержание | Статус |
|------|------------|--------|
| A | типы, HTTP, mock, `ScenarioSearchService` | готово |
| B | paginator, search, index→detail, API validation | готово |
| C | batch cards, scenario picker, source label | готово |
| D | snapshot, sort/seed, preview ids, `scenarioUsesCardEntry` | готово |
| E | scope, published, read-only, server validation | готово |
| F | dialog UI: список на page, CRUD в MatDialog | готово |

## Связанные пути в коде

```
src/app/core/models/scenario-index.types.ts
src/app/core/models/scenario-card-source.types.ts
src/app/core/data/scenarios-api.service.ts
src/app/core/data/scenario-search.service.ts
src/app/core/data/scenarios-storage.ts
src/app/core/data/scenario-card-source.utils.ts
src/app/core/api/scenarios-catalog.mock.handler.ts
src/app/core/api/scenarios-api.mock.interceptor.ts
src/app/features/scenario-builder/
src/app/features/scenario-builder/components/scenario-builder-dialog/
src/app/features/scenario-builder/components/scenario-editor-form/
src/app/features/scenario-builder/utils/scenario-form-draft.utils.ts
src/app/shared/scenario-picker/
src/app/features/card-select/
src/app/features/card-editor/components/card-editor-dialog/             # образец
```
