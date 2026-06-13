# `LinguaCode` — приложение для исследования и изучения языков

Чеклист MVP и бэклога. Домен: [docs/DOMAIN.md](./docs/DOMAIN.md) · архитектура: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## 1. Инициализация проекта

- [x] Создать Angular-приложение (standalone, без NgModule)
- [x] Подключить Angular Material
- [x] Настроить структуру папок: `core`, `shared`, `features`
- [x] Подключить линтер и форматирование (ESLint, Prettier)
- [x] Добавить базовые скрипты в `package.json` (`start`, `build`, `test`)
- [x] Добавить `.gitignore`, `.editorconfig`, `.nvmrc`

## 2. Базовая архитектура

- [x] Домен описан — см. [docs/DOMAIN.md](./docs/DOMAIN.md)
- [x] Настроить маршрутизацию (`app.routes.ts`, lazy `loadComponent`)
- [x] Добавить layout (шапка, подвал, навигация, контент, menu-*)
  - шапка — `/src/app/core/layout/header`
    - menu-cards — `/src/app/core/layout/menu-cards` (встроено в шапку)
    - menu-tools — `/src/app/core/layout/menu-tools` (встроено в шапку)
    - menu-help — `/src/app/core/layout/menu-help` (встроено в шапку)
    - menu-user — `/src/app/core/layout/menu-user` (встроено в шапку)
  - подвал — `/src/app/core/layout/footer`
  - контент — `/src/app/core/layout/main-layout`
  - навигация — `/src/app/core/layout/navigation`
- [x] Создать `core/models/` — типы из DOMAIN (`User`, `Card`, `Scenario`, `LearningResult`)
- [x] Вынести конфигурацию окружения (`environment.ts`)

## 3. Управление состоянием

- [x] Определить глобальное состояние (сервисы + signals в `core/state/`)
- [x] Избегать лишнего RxJS — только там, где нужны потоки (HTTP, WebSocket)
- [x] Типизировать модели данных (`type`, не `interface`) в `core/models/`

## 4. Первая фича

- [x] Создать папку `features/card-select/` (компонент, сервис, типы — в отдельных подпапках)
- [x] Карточка с выбором ответа (`CardKind: select`)
- [x] Маршрут `/cards/select`
- [x] Подключить фичу в роутинг через `menu-cards`

## 5. API и данные

### MVP

- [x] Mock-сервис и JSON fixtures в `public/data/`
- [x] Обработать состояния загрузки и ошибок (signals)

### После MVP

- [x] Настроить `HttpClient` и interceptors (auth, ошибки) в `core/api/`
- [x] Описать типы ответов API

## 6. Безопасность

- [x] Не хранить секреты в репозитории (`.env` в `.gitignore`, шаблон `.env.example`)
- [x] Санитизация пользовательского ввода (`core/security/`, `UserStore`)
- [x] Проверить зависимости на уязвимости (`npm audit`; скрипт `npm run audit`)

## 7. Качество и релиз

- [x] Написать smoke-тесты для критичных сценариев
- [x] Проверить сборку production (`ng build`; скрипт `npm run build:prod`)
- [x] Обновить `README.md` (описание, запуск, стек, структура)
- [x] Заполнить / обновить `docs/ARCHITECTURE.md`
- [x] Синхронизировать `README.md` с layout (`menu-cards`, `menu-tools`)
- [x] Настроить CI (сборка + тесты на push; `npm run verify`)

---

## Бэклог (после MVP)

### Конструктор сценариев

- [x] Фича `features/scenario-builder/`
- [x] Маршрут `/tools/scenario-builder`
- [x] Точка входа — `menu-tools` в header
- [x] CRUD сценариев (`Scenario`: title, description, cardIds)

### Типы карточек

- [x] `memory` — запоминание
- [x] `symbol` — символы
- [x] `sound` — звук
- [x] `timed` — временное ограничение
- [x] `keyboard` — ввод с клавиатуры
- [x] `draw` — рисование
- [x] Общий `CardHostComponent` для рендера по `kind`

### Результаты обучения

- [x] Сохранение `LearningResult` (локально / API)
- [x] Отображение прогресса пользователя
- [x] Закладки на главной (tabs: приветствие / прогресс / …)
- [x] Подключить фичу в роутинг через `Главная`

### Редактор для карточек

- [x] Фича `features/card-editor/` — каталог + CRUD, маршрут `/tools/cards`
- [x] Объединение «Каталог карточек» и «Редактор карточек» в один экран «Карточки»
- [x] `CardRepository` (localStorage, seed из `select-cards.json`)
- [x] CRUD карточки `select` + preview через `CardHost`
- [x] Редактирование `appearance` (theme, fontSize)
- [x] Подключить repository в scenario-builder
- [x] Формы для остальных `CardKind`
- [x] card-select: прохождение пользовательских сценариев
- [x] удаление/изменение карточки не должно ломать сценарии и LearningResult

#### UI — dialog

- [x] `CardEditorDialogComponent` — MatDialog + `CardForm` + save/cancel
- [x] `CardEditorPage`: каталог без inline editor, create/edit через dialog
- [x] Confirm при закрытии с несохранёнными изменениями
- [x] Responsive: fullscreen dialog на узких экранах (`styles.scss`)
- [ ] Deep link `?id=` для edit (опционально)

### Каталог карточек (масштаб)

Документация: [docs/CARD-CATALOG.md](./docs/CARD-CATALOG.md)

- [x] `shared/pagination/` — `PageRequest`, `PageResponse`, утилиты, UI
- [x] Типы `CardIndexEntry`, `CardSearchCriteria`, `ScenarioCardSource` в `core/models/`
- [x] Документация DOMAIN / ARCHITECTURE / CARD-CATALOG
- [x] Mock `CardSearchService` с facets и `paginateArray`
- [x] Фича `features/card-catalog/` — фильтры, список, `UiPaginationComponent` (слито в card-editor)
- [x] scenario-builder: выбор карточек через поиск каталога (не полный in-memory список)
- [x] HTTP API: `GET /cards/search`, `GET /cards/:id`
- [x] `ScenarioCardSource` (fixed / criteria) в модели и UI
- [x] Каталог: фильтры сверху, результаты снизу (вертикальный layout)
- [x] Sidebar: пункт «Карточки» переименован в «Обучение» (`/cards/select`, icon `school`)
- [x] Sidebar: дублированы маршруты из header — «Карточки» (`/tools/cards`), «Конструктор сценариев» (шапка без изменений)


### Конструктор сценариев (масштаб)

Документация: [docs/SCENARIO-BUILDER.md](./docs/SCENARIO-BUILDER.md)

Уже сделано (MVP + интеграция с каталогом карточек):

- [x] CRUD сценариев в `features/scenario-builder/` (`localStorage`)
- [x] `ScenarioCardSource` (fixed / criteria) — см. также «Каталог карточек (масштаб)»
- [x] Выбор карточек через поиск каталога (`ScenarioCardPicker`, `ScenarioCardCriteriaEditor`)

#### Этап A — модель и API

- [x] Черновик `docs/SCENARIO-BUILDER.md`
- [x] Синхронизация DOMAIN / ARCHITECTURE / README со ссылкой на SCENARIO-BUILDER
- [x] Типы `ScenarioIndexEntry`, `ScenarioSearchCriteria` в `core/models/`
- [x] `ScenariosApiService`: `GET /scenarios/search`, `GET /scenarios/:id`, CRUD
- [x] Mock interceptor сценариев в dev (`useScenariosApiMock`)
- [x] `ScenarioSearchService` → HTTP (миграция из `localStorage`)

#### Этап B — UI конструктора

- [x] Пагинация списка сценариев (`UiPaginationComponent`)
- [x] Поиск / фильтр по названию и scope (mine / published / all)
- [x] Index → detail: полный `Scenario` только при edit/create
- [x] Валидация `fixed` через API (`getCardById`), не только index cache

#### Этап C — прохождение (card-select)

- [x] Загрузка карточек через `POST /cards/batch` без `CardRepository.ensureLoaded()`
- [x] Выбор сценария: `ScenarioPickerComponent` (search + paginator)
- [x] Подпись источника в UI («N карточек» / «до N по критериям» / snapshot)

#### Этап D — семантика ScenarioCardSource

- [x] Режим `snapshot` + кнопка «Зафиксировать snapshot»
- [x] Сортировка criteria (`sort`, `seed` для random)
- [x] Preview resolved ids в редакторе критериев
- [x] `scenarioUsesCardEntry` для criteria (удаление карточки)
- [x] Серверная валидация `cardSource` в mock handler

#### Этап E — multi-user

- [x] Фильтр «мои / опубликованные / все» по `scope` и `authorId`
- [x] Публикация сценария (`published`), read-only для чужих
- [x] Серверная валидация `cardSource` + 403 на изменение чужого сценария

### Редактор карточек — dialog UI

- [x] `CardEditorDialogComponent` — MatDialog shell + CardForm + save/cancel
- [x] CardEditorPage: убрать inline editor, открывать dialog на create/edit
- [x] Confirm при закрытии с несохранёнными изменениями
- [x] Responsive: fullscreen dialog на узких экранах
- [x] (опционально) Deep link `?id=` для edit
- [x] Обновить CARD-CATALOG.md / ARCHITECTURE (layout «каталог + modal CRUD»)

### Новый сценарий — dialog UI

План: по образцу [card-editor-dialog](../src/app/features/card-editor/components/card-editor-dialog/) — каталог на странице, create/edit/view в `MatDialog`.

- [x] `ScenarioEditorFormComponent` — title, description, published, `cardSource` (fixed / criteria / snapshot)
- [x] `ScenarioBuilderDialogComponent` — MatDialog shell + form + save/cancel
- [x] `ScenarioBuilderDialogService` — `openCreate()` / `openEdit(scenarioId)`
- [x] `ScenarioBuilderPage`: убрать inline editor, открывать dialog на create/edit
- [x] Read-only просмотр чужого сценария в dialog (без save)
- [x] Confirm при закрытии с несохранёнными изменениями (reuse discard dialog)
- [x] `CardCatalogSearchStore` — provider на dialog, не на page
- [x] Responsive: `.scenario-builder-dialog` fullscreen на узких экранах (`styles.scss`)
- [ ] (опционально) Deep link `?scenarioId=` для edit/view
- [x] Обновить SCENARIO-BUILDER.md / ARCHITECTURE (layout «список + modal CRUD»)

### Пара языков (known → learning)

План: [docs/LANGUAGE-PAIR.md](./docs/LANGUAGE-PAIR.md). Обучение — два языка контента; отдельно от UiLocale (`@angular/localize`).

**G0 — домен**

- [x] `LanguagePair`, `CardDirection` в `core/models/language-pair.types.ts`
- [x] Семантика `CardIndexEntry.language` = learning (target)
- [x] DOMAIN.md + LANGUAGE-PAIR.md

**G1 — профиль и сессия**

- [x] `UserPreferences.languagePair` + default `{ known: 'ru', learning: 'en' }`
- [x] `UserStore`: `languagePair`, `languagePairLabel`, persist `localStorage`
- [x] UI `/user` — селекты известный / новый язык
- [x] Подпись пары на `/cards/select`

**G2+ — бэклог**

**G2 — structured content в `Card`**

- [x] `MemoryPair`: `known` / `learning` вместо `front` / `back`
- [x] `SelectCard`: `promptKnown`, `optionsLearning`, `direction: CardDirection`
- [x] Аналогично для `keyboard`, `timed`, `symbol`, `sound` (prompt/answer по языкам)
- [x] `CardDraft` + `card-form` — поля с подписями «известный» / «новый»
- [x] `card-validation.utils` — валидация bilingual-полей
- [x] Миграция demo: `public/data/select-cards.json`, `card-index-meta.json`
- [x] Обновить `CardHostComponent` / renderers (минимально — читать новые поля)

**G3 — каталог и редактор**

- [x] `CardIndexEntry`: `knownLanguage` + `learningLanguage` (или `languagePair`)
- [x] `CardSearchCriteria`: фильтр по паре; фасеты
- [x] `card-editor`: выбор `languagePair` при create/edit → index meta
- [x] `CardCatalogFiltersComponent` — фильтр known / learning
- [x] Scenario criteria editor — prefill learning из профиля пользователя
- [x] API mock + `cards-api.params.utils` — query params пары

**G4 — сценарии**

- [x] `Scenario.languagePair?: LanguagePair`
- [x] `ScenarioEditorFormComponent` — выбор пары (default из `UserStore`)
- [x] Валидация fixed/snapshot: карточки соответствуют паре сценария
- [x] `ScenarioPickerComponent` — фильтр / badge пары
- [x] Mock handler + API validation

**G5 — обучение и результаты**

- [x] `CardHostComponent` — render по `CardDirection` и `UserStore.languagePair`
- [x] Toggle direction в сессии (опционально)
- [x] `LearningResult.languagePair` + `direction?`
- [x] `LearningResultsStore` — статистика с учётом пары
- [x] Фильтр сценариев на `/cards/select` по паре пользователя

**G6 — UiLocale** (отдельный трек, см. «Локализация» ниже)

- [ ] Не смешивать с `ContentLanguage` / `LanguagePair`

### Локализация (UiLocale)

- Настройка каждого языка в отдельном файле
- Поддержка английского языка
- Поддержка китайского языка
- Фича `features/locale/`
- Файлы переводов в `/src/locale`, формат: `messages.LANG.ts`
- Подключить локализацию в роутинг — в навигации
- Автоматическое переключение языка

