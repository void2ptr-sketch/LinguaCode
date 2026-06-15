# Каталог карточек (масштабирование)

План перехода от in-memory `CardRepository` к каталогу на сотни тысяч карточек.

Связанные документы: [DOMAIN.md](./DOMAIN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md) · [CJK-CONTENT.md](./CJK-CONTENT.md) · [PHONETIC-CONTENT.md](./PHONETIC-CONTENT.md) · [TASKS.md](../TASKS.md).

## Проблема

Сейчас `CardRepository` загружает все карточки в память (`localStorage` + seed JSON). Для большого каталога это не масштабируется:

- медленная первичная загрузка;
- тяжёлые списки в scenario-builder и card-editor;
- невозможность server-side фильтрации и фасетов.

## Решение: индекс + полная карточка

| Слой | Тип | Назначение |
|------|-----|------------|
| Каталог | `CardIndexEntry` | id, kind, title, language, difficulty, tags, updatedAt |
| Детали | `Card` | полный payload по `kind` (question, options, …) |
| Поиск | `CardSearchCriteria` + `PageRequest` | фильтры + пагинация |
| Ответ API | `PageResponse<CardIndexEntry>` | items + totalItems + totalPages |

Полная карточка запрашивается по `id` только когда нужна (редактор, preview, прохождение).

## Пагинация

Модуль **`shared/pagination/`** — типы, утилиты и UI:

| Экспорт | Назначение |
|---------|------------|
| `PageRequest`, `PageResponse<T>` | API и mock search |
| `paginateArray`, `clampPage`, `toOffsetLimit` | server-side / mock |
| `paginateItems`, `createPaginationState` | in-memory списки (signals) |
| `UiPaginationComponent` | обёртка над `MatPaginator` |

```typescript
type PageRequest = { page: number; pageSize: number };

type PageResponse<T> = {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
```

`PageRequest` использует `page` (0-based); `MatPaginator` — `pageIndex` (то же значение, другое имя поля).

## Поиск и фасеты

```typescript
type CardSearchCriteria = {
  query?: string;
  language?: ContentLanguage;
  difficulty?: CardDifficulty;
  kinds?: readonly CardKind[];
  tags?: readonly string[];
  page: PageRequest;
};
```

`CardSearchFacets` — агрегаты для фильтров (язык, сложность, kind, tags) с `count`.

Mock-эндпоинт: `GET /api/cards/search?...` → `{ data: CardSearchPage }`, `GET /api/cards/:id` → `{ data: Card }`.

В dev (`useCardsApiMock: true`) ответы отдаёт `cardsApiMockInterceptor` на базе fixtures. В production запросы идут на реальный backend по `environment.apiUrl`.

## Сценарии

Сейчас `Scenario.cardIds` — фиксированный список. Для динамических наборов:

```typescript
type ScenarioCardSource =
  | { mode: 'fixed'; cardIds: readonly string[] }
  | { mode: 'criteria'; criteria: Omit<CardSearchCriteria, 'page'>; limit?: number };
```

Миграция: существующие сценарии остаются `fixed`; новые могут ссылаться на критерии.

## UI

Экран **`/tools/cards`** (`features/card-editor/`):

- панель фильтров (language, difficulty, kind, tags);
- в режиме G8 (`pairLocked`) — подпись **«Курс: …»** с активной `LanguagePair` и подсказкой в шапке фильтров (сменить курс — Профиль; **программы** G11 — `/courses`, конструктор);
- таблица / список по `CardIndexEntry` + paginator;
- edit / delete на строке;
- **CRUD в `MatDialog`** — `CardEditorDialogComponent` + `CardForm` (fullscreen на узких экранах).

**Точки входа:** `menu-tools` → «Карточки» в header; пункт **«Карточки»** в боковой navigation. Прохождение сценариев — **«Обучение»** в sidebar (`/cards/select`), header `menu-cards` без изменений.

## Dialog редактора

| Элемент | Путь |
|---------|------|
| Shell dialog | `features/card-editor/components/card-editor-dialog/` |
| Открытие | `CardEditorDialogService.openCreate` / `openEdit` |
| Форма | `CardFormComponent` (переиспользуется) |
| Discard confirm | `CardEditorDiscardDialogComponent` |

- `disableClose: true` — закрытие только через кнопки;
- при dirty draft — confirm «Закрыть без сохранения?»;
- после save — `catalogStore.reload()`.

## Dialog прогона карточки (try)

| Элемент | Путь |
|---------|------|
| Shell dialog | `features/card-editor/components/card-try-dialog/` |
| Открытие | `CardTryDialogService.open(cardId)` |
| Store | `SingleCardPlayStore` (provider на dialog) |
| Рендер | `CardHostComponent` + `card-answer.utils` |

- кнопка **play** на строке каталога `/tools/cards`;
- direction toggle, feedback, «Ещё раз» / «Закрыть»;
- **не** пишет `LearningResult` (тестовый режим);
- `.card-try-dialog` — fullscreen на узких экранах.

## Этапы реализации

| Этап | Содержание | Статус |
|------|------------|--------|
| A | `shared/pagination`, типы `CardIndexEntry` / `CardSearchCriteria`, docs | готово |
| B | Mock `CardSearchService` с `paginateArray` + facets | готово |
| C | UI каталога + editor merge в `/tools/cards` | готово |
| D | HTTP API: `GET /cards/search`, `GET /cards/:id` (mock interceptor в dev) | готово |

## Связанные пути в коде

```
src/app/shared/pagination/           # PageRequest, PageResponse, utils, UiPaginationComponent
src/app/shared/card-catalog-search/  # поиск, фильтры, ScenarioCardPickerComponent
src/app/core/models/                 # card-index.types, card-search.types
src/app/core/data/                 # CardSearchService, CardsApiService
src/app/core/api/                  # cardsApiMockInterceptor, CardsCatalogMockHandler
src/app/features/card-editor/     # UI «Карточки»: каталог + dialog CRUD
src/app/features/card-editor/components/card-editor-dialog/
src/app/features/card-editor/components/card-try-dialog/
```
