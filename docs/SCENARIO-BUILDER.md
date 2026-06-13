# Конструктор сценариев (масштабирование)

Переход от in-memory `localStorage` и полной загрузки `CardRepository` к каталогу сценариев и точечной загрузке карточек при прохождении.

Связанные документы: [DOMAIN.md](./DOMAIN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CARD-CATALOG.md](./CARD-CATALOG.md) · [TASKS.md](../TASKS.md).

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

- paginator + поиск + scope (mine / published / all);
- index → detail при edit/create;
- источник карточек: fixed / criteria / snapshot;
- preview ids и sort/seed в criteria editor;
- toggle «Опубликовать сценарий».

### Обучение — `/cards/select`

- `ScenarioPickerComponent` — search + paginator;
- загрузка карточек через `POST /cards/batch`;
- подпись источника в заголовке сессии.

## Этапы реализации

| Этап | Содержание | Статус |
|------|------------|--------|
| A | типы, HTTP, mock, `ScenarioSearchService` | готово |
| B | paginator, search, index→detail, API validation | готово |
| C | batch cards, scenario picker, source label | готово |
| D | snapshot, sort/seed, preview ids, `scenarioUsesCardEntry` | готово |
| E | scope, published, read-only, server validation | готово |

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
src/app/shared/scenario-picker/
src/app/features/card-select/
```
