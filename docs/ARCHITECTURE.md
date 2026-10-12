# Архитектура LinguaCode

Техническое описание frontend-приложения. Бизнес-контекст — в [BUSINESS.md](./BUSINESS.md); доменная модель — в [DOMAIN.md](./SYSTEM/DOMAIN.md). Оглавление: [INDEX.md](./INDEX.md).

## Принципы

| Принцип          | Решение                                             |
| ---------------- | --------------------------------------------------- |
| Компоненты       | Angular **standalone**, без NgModule                |
| Типизация        | `type`, не `interface`                              |
| Состояние        | **Signal API**; RxJS — только HTTP/WebSocket        |
| UI               | **Angular Material** + SCSS                         |
| Layout           | CSS **Grid**, предпочтительно `grid-template-areas` |
| Организация кода | **FSD** (Feature-Sliced Design): 6 слоёв, слайсы по доменам |

## Слои приложения (FSD)

Feature-Sliced Design: **6 слоёв**, импорты направлены **строго вниз** (слой может использовать только себя и слои ниже).

```
src/app/
├── app/        # композиция: app/app.config, app/app.routes, provide-api, interceptors, theme-сервис
├── pages/      # страницы-маршруты (*-page компоненты)
├── widgets/    # переиспользуемые UI-компоненты (card-host, cards/*, pickers, layout-оболочки)
├── features/   # изолированные фичи (по одной на сценарий использования)
├── entities/   # доменные слайсы: card, course, lesson, scenario, user, learning, language-pair, phonetic, chinese, content-seed, journey
└── shared/     # доменно-агностичный код: utils, security, api-инфраструктура, theme-типы
```

Правила направлений (проверяются скриптом `node scripts/audit-fsd.mjs`):

| Слой       | Может импортировать                                        |
| ---------- | --------------------------------------------------------- |
| `app`      | всё ниже                                                   |
| `pages`    | widgets, features, entities, shared                       |
| `widgets`  | features, entities, shared                                 |
| `features` | entities, shared                                           |
| `entities` | shared                                                     |
| `shared`   | ничего (только внешние пакеты)                             |

### `entities`

Доменные слайсы. Каждый слайс — папка с сегментами:

```
entities/card/
├── model/        # типы и signal-сервисы (store)
├── lib/          # доменная логика, утилиты
├── api/          # API-сервисы и mock-интерцепторы
├── repository/   # data-access
├── storage/      # localStorage-персистентность
├── search/       # поиск
├── mapping/      # мапперы
└── utils/        # утилиты слайса
```

### `features`

Каждая фича — отдельная папка со своей зоной ответственности:

```
features/card-select/
├── components/     # UI фичи
├── services/       # логика и работа с данными
├── types/          # типы, специфичные для фичи
└── utils/          # утилиты фичи
```

- Фичи **не импортируют** друг друга напрямую (запрещены cross-slice импорты).
- Публичный API фичи — через `index.ts` (компоненты, сервисы, типы).
- Сегменты (`components/`, `services/`, `types/`, `utils/`, `models/`) — принятая в проекте конвенция; FSD допускает произвольные имена сегментов.

### `core/` (удалён)

Слой `src/app/core/` **удалён** — shim-баррели больше не нужны. Потребители импортируют напрямую из `entities/*/`, `shared/`, `widgets/`, `app/`. Карта переноса: [ARCHITECTURE.core.md](./ARCHITECTURE/ARCHITECTURE.core.md#куда-переехал-core).

## Архитектура подсистем

Детальный структурный дизайн — в файлах `ARCHITECTURE.<подсистема>.md` (UML-диаграммы в формате Mermaid):

| Подсистема               | Документ                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| Бывший `core`            | [ARCHITECTURE.core.md](./ARCHITECTURE/ARCHITECTURE.core.md)                         |
| `shared`                 | [ARCHITECTURE.shared.md](./ARCHITECTURE/ARCHITECTURE.shared.md)                     |
| Практика (`card-select`) | [ARCHITECTURE.card-select.md](./ARCHITECTURE/ARCHITECTURE.card-select.md)           |
| Dashboard (`home`)       | [ARCHITECTURE.home.md](./ARCHITECTURE/ARCHITECTURE.home.md)                         |
| Редактор карточек        | [ARCHITECTURE.card-editor.md](./ARCHITECTURE/ARCHITECTURE.card-editor.md)           |
| Конструктор сценариев    | [ARCHITECTURE.scenario-builder.md](./ARCHITECTURE/ARCHITECTURE.scenario-builder.md) |
| Программы (course)       | [ARCHITECTURE.course.md](./ARCHITECTURE/ARCHITECTURE.course.md)                     |
| Результаты обучения      | [ARCHITECTURE.learning-results.md](./ARCHITECTURE/ARCHITECTURE.learning-results.md) |

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

| Компонент  | Путь                      | Назначение                                                                       |
| ---------- | ------------------------- | -------------------------------------------------------------------------------- |
| Header     | `widgets/header`          | Шапка, контейнер для menu-\*                                                     |
| MenuCards  | `widgets/menu-cards`      | Навигация к карточкам и режимам обучения                                         |
| MenuTools  | `widgets/menu-tools`      | Инструменты (конструктор сценариев и др.)                                        |
| MenuHelp   | `widgets/menu-help`       | Справка                                                                          |
| MenuUser   | `widgets/menu-user`       | Профиль пользователя                                                             |
| Navigation | `widgets/navigation`      | Боковое меню: главная, обучение, каталог карточек, конструктор, справка, профиль |
| MainLayout | `widgets/main-layout`     | Область контента                                                                 |
| Footer     | `widgets/footer`          | Подвал                                                                           |

Компоненты `menu-*` встроены в **header**; боковое **navigation** дублирует ключевые маршруты обучения и инструментов (шапка при этом сохраняется).

| Пункт (sidebar)       | Маршрут                   | Дублирует в header                     |
| --------------------- | ------------------------- | -------------------------------------- |
| Обучение              | `/cards/select`           | `menu-cards` → «Карточки»              |
| Карточки              | `/tools/cards`            | `menu-tools` → «Карточки»              |
| Конструктор сценариев | `/tools/scenario-builder` | `menu-tools` → «Конструктор сценариев» |

### Grid (SCSS)

```scss
.shell {
  display: grid;
  grid-template-areas:
    'header header'
    'nav    main'
    'footer footer';
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}
```

## Роутинг

Центральный файл — `app/app/app.routes.ts`. Layout — родительский route с дочерними маршрутами фич.

```typescript
// app/app/app.routes.ts (схема)
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./widgets/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'journey', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./pages/home/home-page/home-page.component').then(m => m.HomePageComponent) },
      { path: 'cards/select', loadComponent: () => import('./pages/card-select/card-select-page/card-select-page.component').then(m => m.CardSelectPageComponent) },
      { path: 'courses', loadComponent: () => import('./pages/course-catalog/course-catalog-page/course-catalog-page.component').then(m => m.CourseCatalogPageComponent) },
      { path: 'tools/scenario-builder', loadComponent: () => import('./pages/scenario-builder/scenario-builder-page/scenario-builder-page.component').then(m => m.ScenarioBuilderPageComponent) },
      { path: 'tools/courses', loadComponent: () => import('./pages/course-builder/course-builder-page/course-builder-page.component').then(m => m.CourseBuilderPageComponent) },
      { path: 'tools/cards', loadComponent: () => import('./pages/card-editor/card-editor-page/card-editor-page.component').then(m => m.CardEditorPageComponent) },
      { path: 'help', loadComponent: () => import('./pages/help/help-page.component').then(m => m.HelpPageComponent) },
      { path: 'user', loadComponent: () => import('./pages/user/user-page.component').then(m => m.UserPageComponent) },
      { path: '**', redirectTo: 'home' },
    ],
  },
];
```

- Фичи подключаются **lazy** (`loadComponent`).
- Корневой маршрут `''` редиректит на `/journey` (Journey Map); fallback `**` → `/home` (dashboard).
- `menu-cards` в header ведёт на прохождение карточек (`/cards/select`); в sidebar — пункт **«Обучение»**.
- `menu-tools` в header ведёт на инструменты; в sidebar — **«Карточки»** (`/tools/cards`) и **«Конструктор сценариев»**.
- Все маршруты — внутри `MainLayoutComponent` (shell).

## Модель данных

Сущности и типы домена — в [DOMAIN.md](./SYSTEM/DOMAIN.md#модели).

Кратко:

- `User`, `Card`, `Scenario`, `LearningResult`, `CardAppearance`
- `Card` — discriminated union по полю `kind` (10 типов: `select`, `code-select`, `memory`, `symbol`, `sound`, `timed`, `keyboard`, `draw`, `tone`, `reading`)
- Все 10 `CardKind` реализованы
- **Конструктор сценариев** — инструмент для создания и редактирования `Scenario` (`features/scenario-builder/`); масштабирование — [SCENARIO-BUILDER.md](./FEATURES/SCENARIO-BUILDER.md)

### Рендер карточек

Общий `CardHostComponent` выбирает компонент по `card.kind`:

```
Card (kind) → CardHostComponent → SelectCardComponent | CodeSelectCardComponent | MemoryCardComponent | SymbolCardComponent | SoundCardComponent | TimedCardComponent | KeyboardCardComponent | DrawCardComponent | ToneCardComponent | ReadingCardComponent
```

Все 10 типов карточек реализованы и рендерятся через `CardHostComponent`.

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

| Данные                             | Где хранить                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------- |
| UI-состояние фичи                  | signal-сервис внутри `features/*/`                                          |
| Глобальные настройки, пользователь | `entities/user/model/` (`UserStore`, `UserPersistence`)                     |
| Результаты обучения                | `entities/learning/model/` (`LearningResultsStore`)                         |
| Сценарии (конструктор)             | `features/scenario-builder/` · [SCENARIO-BUILDER.md](./FEATURES/SCENARIO-BUILDER.md) |
| Ответ API                          | signal; конвертация из Observable через `toSignal()` или `rxResource`       |

RxJS — **только** на границе HTTP/WebSocket, не в шаблонах и не в компонентах напрямую.

## Данные и API

### MVP

Backend на старте **не требуется**. Данные — mock-сервис + JSON fixtures в `public/data/`.

```typescript
@Injectable({ providedIn: 'root' })
export class CardApiService {
  // MVP: читает fixtures
  // позже: HttpClient + environment.apiUrl
}
```

### После MVP

- `HttpClient` + interceptors (`app/api/`):
  - **auth** — токен в заголовке (когда появится авторизация);
  - **error** — централизованная обработка HTTP-ошибок.
- Базовые типы ответов API и `buildApiUrl` — `shared/api/` (используются `entities/*/api/`).
- Конфигурация — `src/environments/environment.ts`.
- Состояния загрузки и ошибок — signals в store-сервисах.

## Фичи

### MVP: `card-select`

1. Отображение карточки с вопросом и вариантами ответа.
2. Выбор ответа и проверка (верно / неверно).
3. Переход к следующей карточке в сценарии.

|             |                                                 |
| ----------- | ----------------------------------------------- |
| Маршрут     | `/cards/select`                                 |
| Точка входа | `menu-cards` в header, **«Обучение»** в sidebar |
| Путь        | `features/card-select/`                         |

### `scenario-builder`

Конструктор сценариев — список на странице, CRUD в `MatDialog` (`cardSource`: fixed / criteria / snapshot).

|                 |                                                                          |
| --------------- | ------------------------------------------------------------------------ |
| Маршрут         | `/tools/scenario-builder`                                                |
| Точка входа     | `menu-tools` в header, **«Конструктор сценариев»** в sidebar             |
| Путь            | `features/scenario-builder/`                                             |
| Список          | `ScenarioBuilderStore` + `ScenarioSearchService`                         |
| Редактор        | `ScenarioBuilderDialogComponent` + `ScenarioEditorFormComponent`         |
| Пара языков     | [LANGUAGE-PAIR.md](./FEATURES/LANGUAGE-PAIR.md) — `User.preferences.languagePair` |
| Масштабирование | [SCENARIO-BUILDER.md](./FEATURES/SCENARIO-BUILDER.md)                             |

### `card-management` (`features/card-editor/`)

Единый экран **«Карточки»** — поиск по index, CRUD в `MatDialog`, каталог на странице.

|             |                                                                        |
| ----------- | ---------------------------------------------------------------------- |
| Маршрут     | `/tools/cards` (redirect: `/tools/card-editor`, `/tools/card-catalog`) |
| Точка входа | `menu-tools` → «Карточки» в header, **«Карточки»** в sidebar           |
| Путь        | `features/card-editor/`                                                |
| Список      | `CardCatalogSearchStore` + `CardSearchService`                         |
| Редактор    | `CardEditorDialogComponent` + `CardEditorStore` + `card-form`          |

## Безопасность

- Секреты — только в `.env` / environment, **не в репозитории**.
- Пользовательский ввод — санитизация через Angular (`DomSanitizer`) при отображении HTML.
- Зависимости — периодический `npm audit`.

## Hanzi Engine (draw-карточки)

Offline stroke-data + TypeScript-движок в `src/app/entities/chinese/` (модель, positioning, rendering, animation, validation, quiz). Данные: `public/assets/hanzi/` (Make Me a Hanzi). Sync: `npm run sync:hanzi`.

```typescript
// Data
hanziData.loadCharacter('人'): Promise<HanziCharacterModel | null>
hanziData.loadCharacters(['你','好']): Promise<Map<string, HanziCharacterModel>>
hanziData.getLoadState('人'): HanziLoadState
hanziData.assetUrl('人'): '/assets/hanzi/%E4%BA%BA.json'

// Layout
new HanziPositioner({ width, height, padding }).toCanvas(mmhPoint)
positioner.toCharacterSpace(canvasPoint)

// Quiz (per character session)
new HanziQuizSession(model, positioner, { proficiencyLevel: 'beginner' })
session.submitCanvasStroke(canvasPoints): HanziQuizStrokeResult
session.shouldShowHint(): boolean
session.summary(): { character, totalMistakes, strokeCount }
```

Интеграция: `draw-canvas`, `draw-card`, grading через `hanzi-stroke-match.utils`. Подробности: [TASKS.md](../TASKS.md) (H15).

## Content seed + overlay

Системный контент — `ContentSeedRepository` + `public/data/content-manifest.json`. Пользовательские правки — `UserContentOverlay` (`lingua-code.user-content.v1`). Merge в `user-content-overlay.resolver.ts`. Подробности: [ARCHITECTURE.core.md](./ARCHITECTURE/ARCHITECTURE.core.md#content-seed--overlay), [TASKS.md](../TASKS.md) (G15).

## Локализация (бэклог)

- `@angular/localize`, файлы `src/locale/messages.LANG.ts`.
- Фича `features/locale/` — переключение языка.
- Языки: EN, ZH.

## Связанные документы

- [INDEX.md](./INDEX.md) — оглавление документации
- [BUSINESS.md](./BUSINESS.md) — бизнес-идеи и продуктовое видение
- [DOMAIN.md](./SYSTEM/DOMAIN.md) — доменная модель, типы, конструктор сценариев
- [CARD-CATALOG.md](./SYSTEM/CARD-CATALOG.md) — индекс карточек, поиск, пагинация
- [TASKS.md](../TASKS.md) — чеклист реализации
- [README.md](../README.md) — обзор и быстрый старт
- [GIT-RULES.md](./SYSTEM/GIT-RULES.md) — Git-процесс
