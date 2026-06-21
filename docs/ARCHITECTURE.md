# Архитектура LinguaCode

Техническое описание frontend-приложения. Бизнес-контекст — в [BUSINESS.md](./BUSINESS.md); доменная модель — в [DOMAIN.md](./DOMAIN.md). Оглавление: [INDEX.md](./INDEX.md).

## Принципы

| Принцип | Решение |
|---------|---------|
| Компоненты | Angular **standalone**, без NgModule |
| Типизация | `type`, не `interface` |
| Состояние | **Signal API**; RxJS — только HTTP/WebSocket |
| UI | **Angular Material** + SCSS |
| Layout | CSS **Grid**, предпочтительно `grid-template-areas` |
| Организация кода | `core` / `shared` / `features` |

## Слои приложения

```
src/app/
├── core/           # singleton-сервисы, layout, models, глобальное состояние
├── shared/         # переиспользуемые UI-компоненты и утилиты
└── features/       # изолированные фичи (по одной на сценарий использования)
```

### `core`

- **layout/** — shell-приложение (header, navigation, main-layout, footer).
- **models/** — доменные типы (`User`, `Card`, `Scenario`, `LearningResult`, `CardIndexEntry`).
- **state/** — глобальные signal-сервисы (пользователь, сессия, настройки).
- **api/** — HttpClient, interceptors, базовые типы ответов API.

Не импортировать `features/` из `core/`.

### `shared`

- UI-обёртки над Material (кнопки, карточки, индикаторы загрузки).
- **pagination/** — `PageRequest`, `PageResponse`, утилиты, `UiPaginationComponent`, `createPaginationState`.
- **card-catalog-search/** — `CardCatalogSearchStore`, фильтры, `ScenarioCardPickerComponent`.
- Pipes, директивы, утилиты без бизнес-логики.

Может использоваться из `core/` и `features/`.

### `features`

Каждая фича — отдельная папка со своей зоной ответственности:

```
features/card-select/
├── components/     # UI фичи
├── services/       # логика и работа с данными
└── types/          # типы, специфичные для фичи
```

Фичи **не импортируют** друг друга напрямую. Общие типы — в `core/models/`, специфичные — в `features/*/types/`.

## Архитектура подсистем

Детальный структурный дизайн — в файлах `ARCHITECTURE.<подсистема>.md` (UML-диаграммы в формате Mermaid):

| Подсистема | Документ |
|------------|----------|
| `core` | [ARCHITECTURE.core.md](./ARCHITECTURE.core.md) |
| `shared` | [ARCHITECTURE.shared.md](./ARCHITECTURE.shared.md) |
| Практика (`card-select`) | [ARCHITECTURE.card-select.md](./ARCHITECTURE.card-select.md) |
| Dashboard (`home`) | [ARCHITECTURE.home.md](./ARCHITECTURE.home.md) |
| Редактор карточек | [ARCHITECTURE.card-editor.md](./ARCHITECTURE.card-editor.md) |
| Конструктор сценариев | [ARCHITECTURE.scenario-builder.md](./ARCHITECTURE.scenario-builder.md) |
| Программы (course) | [ARCHITECTURE.course.md](./ARCHITECTURE.course.md) |
| Результаты обучения | [ARCHITECTURE.learning-results.md](./ARCHITECTURE.learning-results.md) |

## Layout

Shell-приложение. Контент фич — через `<router-outlet>` в `main-layout`.

```
┌──────────────────────────────────────────────────────┐
│ header                                               │
│   menu-cards · menu-tools · menu-help · menu-user    │
├───────────┬──────────────────────────────────────────┤
│ navigation│ main-layout (router-outlet)              │
├───────────┴──────────────────────────────────────────┤
│ footer                                               │
└──────────────────────────────────────────────────────┘
```

### Компоненты layout

| Компонент | Путь | Назначение |
|-----------|------|------------|
| Header | `core/layout/header` | Шапка, контейнер для menu-* |
| MenuCards | `core/layout/menu-cards` | Навигация к карточкам и режимам обучения |
| MenuTools | `core/layout/menu-tools` | Инструменты (конструктор сценариев и др.) |
| MenuHelp | `core/layout/menu-help` | Справка |
| MenuUser | `core/layout/menu-user` | Профиль пользователя |
| Navigation | `core/layout/navigation` | Боковое меню: главная, обучение, каталог карточек, конструктор, справка, профиль |
| MainLayout | `core/layout/main-layout` | Область контента |
| Footer | `core/layout/footer` | Подвал |

Компоненты `menu-*` встроены в **header**; боковое **navigation** дублирует ключевые маршруты обучения и инструментов (шапка при этом сохраняется).

| Пункт (sidebar) | Маршрут | Дублирует в header |
|-----------------|---------|-------------------|
| Обучение | `/cards/select` | `menu-cards` → «Карточки» |
| Карточки | `/tools/cards` | `menu-tools` → «Карточки» |
| Конструктор сценариев | `/tools/scenario-builder` | `menu-tools` → «Конструктор сценариев» |

### Grid (SCSS)

```scss
.shell {
  display: grid;
  grid-template-areas:
    "header header"
    "nav    main"
    "footer footer";
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}
```

## Роутинг

Центральный файл — `app.routes.ts`. Layout — родительский route с дочерними маршрутами фич.

```typescript
// app.routes.ts (схема)
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'cards/select', pathMatch: 'full' },
      { path: 'cards/select', loadComponent: () => import('./features/card-select/...') },
      // features/scenario-builder/ — конструктор сценариев
      // остальные фичи — отдельные lazy routes
    ],
  },
];
```

- Фичи подключаются **lazy** (`loadComponent`).
- `menu-cards` в header ведёт на прохождение карточек (`/cards/select`); в sidebar — пункт **«Обучение»**.
- `menu-tools` в header ведёт на инструменты; в sidebar — **«Карточки»** (`/tools/cards`) и **«Конструктор сценариев»**.

## Модель данных

Сущности и типы домена — в [DOMAIN.md](./DOMAIN.md#модели).

Кратко:

- `User`, `Card`, `Scenario`, `LearningResult`, `CardAppearance`
- `Card` — discriminated union по полю `kind`
- на MVP реализован только `SelectCard` (`kind: 'select'`)
- **Конструктор сценариев** — инструмент для создания и редактирования `Scenario` (`features/scenario-builder/`); масштабирование — [SCENARIO-BUILDER.md](./SCENARIO-BUILDER.md)

### Рендер карточек (после MVP)

Общий `CardHostComponent` выбирает компонент по `card.kind`:

```
Card (kind) → CardHostComponent → SelectCardComponent | MemoryCardComponent | ...
```

На MVP достаточно прямого рендера `SelectCardComponent` без host.

## Управление состоянием

### Signal-сервисы

```typescript
@Injectable({ providedIn: 'root' })
export class CardSelectStore {
  readonly cards = signal<readonly SelectCard[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // методы load(), selectAnswer(), reset() — mutating через update/set
}
```

### Правила

| Данные | Где хранить |
|--------|-------------|
| UI-состояние фичи | signal-сервис внутри `features/*/` |
| Глобальные настройки, пользователь | `core/state/` |
| Сценарии (конструктор) | `features/scenario-builder/` · [SCENARIO-BUILDER.md](./SCENARIO-BUILDER.md) |
| Ответ API | signal; конвертация из Observable через `toSignal()` или `rxResource` |

RxJS — **только** на границе HTTP/WebSocket, не в шаблонах и не в компонентах напрямую.

## Данные и API

### MVP

Backend на старте **не требуется**. Данные — mock-сервис + JSON fixtures в `assets/data/`.

```typescript
@Injectable({ providedIn: 'root' })
export class CardApiService {
  // MVP: читает fixtures
  // позже: HttpClient + environment.apiUrl
}
```

### После MVP

- `HttpClient` + interceptors (`core/api/`):
  - **auth** — токен в заголовке (когда появится авторизация);
  - **error** — централизованная обработка HTTP-ошибок.
- Конфигурация — `src/environments/environment.ts`.
- Состояния загрузки и ошибок — signals в store-сервисах.

## Фичи

### MVP: `card-select`

1. Отображение карточки с вопросом и вариантами ответа.
2. Выбор ответа и проверка (верно / неверно).
3. Переход к следующей карточке в сценарии.

| | |
|---|---|
| Маршрут | `/cards/select` |
| Точка входа | `menu-cards` в header, **«Обучение»** в sidebar |
| Путь | `features/card-select/` |

### `scenario-builder`

Конструктор сценариев — список на странице, CRUD в `MatDialog` (`cardSource`: fixed / criteria / snapshot).

| | |
|---|---|
| Маршрут | `/tools/scenario-builder` |
| Точка входа | `menu-tools` в header, **«Конструктор сценариев»** в sidebar |
| Путь | `features/scenario-builder/` |
| Список | `ScenarioBuilderStore` + `ScenarioSearchService` |
| Редактор | `ScenarioBuilderDialogComponent` + `ScenarioEditorFormComponent` |
| Пара языков | [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md) — `User.preferences.languagePair` |
| Масштабирование | [SCENARIO-BUILDER.md](./SCENARIO-BUILDER.md) |

### `card-management` (`features/card-editor/`)

Единый экран **«Карточки»** — поиск по index, CRUD в `MatDialog`, каталог на странице.

| | |
|---|---|
| Маршрут | `/tools/cards` (redirect: `/tools/card-editor`, `/tools/card-catalog`) |
| Точка входа | `menu-tools` → «Карточки» в header, **«Карточки»** в sidebar |
| Путь | `features/card-editor/` |
| Список | `CardCatalogSearchStore` + `CardSearchService` |
| Редактор | `CardEditorDialogComponent` + `CardEditorStore` + `card-form` |

## Безопасность

- Секреты — только в `.env` / environment, **не в репозитории**.
- Пользовательский ввод — санитизация через Angular (`DomSanitizer`) при отображении HTML.
- Зависимости — периодический `npm audit`.

## Локализация (бэклог)

- `@angular/localize`, файлы `src/locale/messages.LANG.ts`.
- Фича `features/locale/` — переключение языка.
- Языки: EN, ZH.

## Связанные документы

- [INDEX.md](./INDEX.md) — оглавление документации
- [BUSINESS.md](./BUSINESS.md) — бизнес-идеи и продуктовое видение
- [DOMAIN.md](./DOMAIN.md) — доменная модель, типы, конструктор сценариев
- [CARD-CATALOG.md](./CARD-CATALOG.md) — индекс карточек, поиск, пагинация
- [TASKS.md](../TASKS.md) — чеклист реализации
- [README.md](../README.md) — обзор и быстрый старт
- [.gitrules](./.gitrules) — Git-процесс
