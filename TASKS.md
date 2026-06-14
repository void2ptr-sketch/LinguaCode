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

План: [docs/LANGUAGE-PAIR.md](./docs/LANGUAGE-PAIR.md). Обучение — два языка контента; отдельно от UiLocale (`@angular/localize`). CJK-слой: [docs/CJK-CONTENT.md](./docs/CJK-CONTENT.md) (G9). IPA: [docs/PHONETIC-CONTENT.md](./docs/PHONETIC-CONTENT.md) (G10).

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

**G7 — несколько пар, одна активная**

План: [docs/LANGUAGE-PAIR.md](./docs/LANGUAGE-PAIR.md#g7--несколько-пар-одна-активная). Пользователь ведёт несколько курсов (ru→en, ru→zh…), в сессии участвует только **активная** пара.

**G7a — модель и store**

- [x] `UserLanguagePairEntry` (`id`, `pair`, `createdAt`) в `core/models/`
- [x] `UserPreferences`: `languagePairs[]` + `activeLanguagePairId` (замена singleton `languagePair`)
- [x] Миграция `user.persistence.ts`: legacy `languagePair` → одна запись в списке
- [x] `UserStore`: `addLanguagePair`, `removeLanguagePair`, `setActiveLanguagePair`
- [x] `UserStore.languagePair()` — computed **активной** пары (alias для G2–G5 без массового рефакторинга)
- [x] Дедупликация пар; запрет `known === learning`; минимум одна пара в профиле

**G7b — UI профиля**

- [x] `/user` — список пар, «сделать активной», удаление (кроме последней)
- [x] Форма «Добавить пару»; новая пара по умолчанию становится активной
- [x] При удалении активной — переключение на первую оставшуюся

**G7c — быстрое переключение**

- [x] Quick switcher активной пары: `/cards/select` и/или header (`menu-user`)
- [x] Подпись активной пары сохраняется в обучении

**G7d — сессия и прогресс**

- [x] Смена активной пары сбрасывает `CardSelectStore` (confirm при незавершённой сессии — опционально)
- [x] `LearningResultsStore` — статистика по активной паре (как сейчас; данные всех пар уже в `LearningResult`)
- [ ] (опционально) Прогресс на главной — вкладки / фильтр по всем парам пользователя

**G8 — scope UI по активной паре**

План: [docs/LANGUAGE-PAIR.md](./docs/LANGUAGE-PAIR.md#g8--scope-ui-по-активной-паре-черновик). После выбора активной пары каталоги, списки и pickers показывают **только** контент этой пары (курс).

**G8a — каталог карточек**

- [x] `/tools/cards`: `CardCatalogSearchStore.applyLanguagePair()` на init из `UserStore.languagePair()`
- [x] Reload каталога при смене `activeLanguagePairId`
- [x] `clearFilters()` не сбрасывает locked pair (known/learning остаются активными)
- [x] UI: chip «Пара: …» или read-only фильтры языка (режим `pairLocked`) + hint в каталоге

**G8b — pickers в конструкторе**

- [x] `ScenarioCardPicker` — prefill + scope active pair на init
- [x] `ScenarioCardCriteriaEditor` — всегда держать known/learning активной пары
- [x] Reload picker при смене активной пары

**G8c — список сценариев**

- [x] `ScenarioBuilderStore.loadList()` — фильтр по активной паре
- [x] `ScenarioSearchCriteria`: `knownLanguage` + `learningLanguage` (или `languagePair`)
- [x] Mock handler + API: server-side filter (корректная пагинация)
- [x] Заменить/дополнить client-only filter по `languagePairSummary` в `ScenarioPicker`

**G8d — согласованность и edge cases**

- [x] Смена пары на `/tools/*` — reload открытых списков (как G7d для card-select)
- [x] Legacy `Scenario` без `languagePair` — правило: скрыть в strict mode или badge «без пары»
- [x] (опц.) Try dialog — проверка index entry vs active pair
- [ ] (опц.) `UserPreferences.showAllLanguagePairs` — режим автора (снять lock)

**G9 — CJK-контент в карточках (иероглифы, романизация, тоны)**

План: [docs/CJK-CONTENT.md](./docs/CJK-CONTENT.md). Слой структурированного контента для zh (и перспектива ja/ko): Han, пиньинь, жуинь, **система Палладия** (ru→zh), произношение, тоны. Отдельно от UiLocale (G6).

**G9a — домен и типы**

- [x] `CjkLexeme`, `RomanizationSystem`, `CjkDisplayMode` в `core/models/` (`phonetic-content.types.ts`)
- [ ] `TextSegment` (опц., для сегментированного текста)
- [x] Adapter: legacy `string` → минимальная лексема (`LexemeDisplay` fallback, `lexemeFromPrimary`)
- [x] CJK-CONTENT.md синхронизирован с кодом (MVP)

**G9b — отображение**

- [x] CJK-шрифты (Noto Sans SC/TC, Bopomofo) — Google Fonts в `index.html`
- [x] `app-cjk-ruby` — иероглиф + reading (pinyin / zhuyin / palladius)
- [x] `lang` на блоках контента (`zh-Hans` в `cjk-ruby`)

**G9c — настройки ru→zh**

- [x] `CjkLearningPreferences`: `displayRomanization`, `answerRomanization`, `showTones`
- [x] UI `/user`: выбор пиньинь / палладица / жуинь (при `known === 'ru'`, `learning === 'zh'`)
- [x] Палладица скрыта для пар без `known === 'ru'`

**G9d — payload карточек**

- [x] Optional `promptLexeme` / `optionsLexemes` / `learningLexeme` в карточках
- [x] Редактор: поля han, pinyin, zhuyin, palladius, ipa, audioUrl (`app-lexeme-fields`)
- [x] Preview через `LexemeDisplay` + `UserStore` preferences

**G9e — палладица и конвертация**

- [x] Таблица syllable-level: pinyin ↔ palladius (`cjk-romanization.utils.ts`)
- [x] Автозаполнение palladius в редакторе + ручная правка (топонимы: Пекин)
- [x] Demo-карточки ru→zh с палладицей (`select-zh-1`)

**G9f — ответы, звук, тоны**

- [x] CJK normalizer для `keyboard` (`cjk-answer-normalize.utils.ts`)
- [x] `acceptedReadings` в нескольких системах
- [x] `SoundCard`: `audioUrl`; подпись по `displayRomanization`
- [x] Упражнения на тон (опц. kind `tone` / полифония `reading`)
- [x] (опц.) `draw`: canvas, stroke order, радикалы
- [x] (опц.) Виртуальная клавиатура пиньинь с тонами (`app-pinyin-keyboard`, `answerMode: pinyin`)

**G10 — фонетический контент: IPA (International Phonetic Alphabet)**

План: [docs/PHONETIC-CONTENT.md](./docs/PHONETIC-CONTENT.md). Универсальная фонетическая транскрипция для любого `ContentLanguage`; дополняет орфографию G9 (пиньинь, Палладия). Отдельно от UiLocale (G6). MVP: показ + select, не keyboard.

**G10a — домен и типы**

- [x] `PhoneticLexeme`, `IpaVariant`, `PhoneticNotation` в `core/models/`
- [x] Поле `ipa` в расширении G9-лексемы (обратная совместимость)
- [x] PHONETIC-CONTENT.md синхронизирован с кодом (MVP)

**G10b — отображение**

- [x] IPA-шрифт Charis SIL (Google Fonts в `index.html`)
- [x] `app-phonetic-ipa` — рендер транскрипции, ударение `ˈ`/`ˌ`
- [x] `PhoneticDisplayMode` в типах; рендер через `LexemeDisplay`

**G10c — настройки пользователя**

- [x] `PhoneticPreferences`: `showIpa`, `ipaVariantLabel`, `answerModes`
- [x] UI `/user`: включение IPA (для ru→en при активной паре)

**G10d — payload и редактор**

- [x] Поле IPA (+ `IpaVariant[]` через редактор) в `card-form`
- [x] Preview с IPA под словом (`LexemeDisplay`)
- [x] Валидация IPA Unicode ranges (`ipa-normalize.utils.ts`)

**G10e — карточки и упражнения**

- [x] `sound`: подпись IPA + `audioUrl`
- [x] `select` / `memory`: варианты с IPA (ru→en demo)
- [x] `normalizeIpa()` / `answersMatchIpa()` для keyboard-ответов

**G10f — контент и каталог**

- [x] Demo-карточки ru→en с IPA (`select-en-ipa-1`, `select-en-ipa-2`)
- [x] Тег `ipa` в каталоге; поиск по транскрипции (опц.)

**G10g — опционально**

- [x] Автозаполнение IPA для en (CMUdict / Wiktionary)
- [x] zh: IPA с контурами тонов Chao; цепочка pinyin → IPA
- [x] `keyboard`: свободный ввод IPA

**G11 — уроки и курсы (Lesson, Course)**

План: [docs/DOMAIN.md](./docs/DOMAIN.md#иерархия-контента). Над `Scenario` — тематические **уроки** и учебные **курсы**. `LanguagePair` остаётся scope контента (G7/G8); `Course` — программа из уроков в рамках пары.

**G11a — домен и типы**

- [x] `Lesson`, `Course` в `core/models/` (`lesson.types.ts`, `course.types.ts` или общий файл)
- [x] `Course.languagePair: LanguagePair` — фильтр и валидация при создании
- [x] `Lesson.scenarioIds` — порядок сценариев; сценарий может входить в несколько уроков (опц.)
- [x] `LearningResult.lessonId?`, `courseId?` — для прогресса по уроку/курсу
- [x] DOMAIN.md синхронизирован с кодом

**G11b — хранение и API**

- [x] Repository / fixtures: `public/data/courses.json`, `lessons.json` (или вложенная структура)
- [x] CRUD курса и урока (localStorage MVP, как сценарии)
- [x] Индекс / поиск курсов по `languagePair` (аналог `ScenarioIndexEntry`)
- [x] Каскад: удаление курса не ломает сценарии и `LearningResult` (как G5 для карточек)

**G11c — конструктор и каталог**

- [x] Фича `features/course-builder/` или расширение scenario-builder
- [x] Маршрут `/tools/courses` (или вкладка в tools)
- [x] CRUD курса: title, description, `languagePair`, список уроков
- [x] CRUD урока: title, упорядоченный список `scenarioIds` (picker с G8 scope)
- [x] Preview: прохождение урока = цепочка сценариев

**G11d — обучение и прогресс**

- [x] `/cards/select` (или новый маршрут): выбор курса → урока → сценария
- [x] Прогресс по уроку (% сценариев / карточек)
- [x] Прогресс по курсу (агрегация уроков)
- [x] Фильтр списков по активной `LanguagePair` (G8)

**G11e — терминология UI**

- [x] Переименовать chip «Курс: …» → «Пара: …» (активная `LanguagePair`)
- [x] «Курс» в UI — только для сущности `Course`
- [x] Обновить LANGUAGE-PAIR.md / подсказки в каталоге

**G11f — опционально**

- [x] Публикация курсов (`published`); каталог готовых программ
- [x] Prerequisites между уроками
- [x] Сертификат / badge по завершению курса

**G12 — Editor UX (упрощение редактора карточек)**

Контекст: `card-form` (~650 строк TS + ~350 HTML) + `card-validation` (~490 строк) обслуживают **10** `CardKind`; дублируются блоки вариантов (select / timed / reading / sound / symbol); на каждый вариант — **строка + полная лексема** (pinyin, zhuyin, palladius, ipa). Цель: **≤ 8 полей** в базовом режиме для типовой select-карточки; новый kind — **один файл формы**, не правка god-кomponent.

**G12a — фаза 1: быстрые wins (низкий риск)**

- [x] Toggle **«Базовый / Расширенный»** в `CardEditorDialog` (сохранять предпочтение в `sessionStorage`)
- [x] **Базовый:** title, prompt, варианты / пары, correctIndex; без lexeme-блоков, appearance, answerMode, draw meta
- [x] **Расширенный:** текущие поля (лексемы, audio, appearance, режимы)
- [x] `app-lexeme-fields`: контекст **языковой пары** из диалога (`knownLanguage`, `learningLanguage`)
  - ru→en: primary + IPA; остальное в collapsible «Доп. фонетика»
  - ru→zh: primary (han) + pinyin + кнопка palladius; zhuyin/ipa — в «Доп.»
- [x] **Appearance по умолчанию** из `UserStore.preferences()`; override только в «Расширенном»
- [x] **Автосинхронизация** строки варианта и `lexeme.primary` (если lexeme заполнена — строка readonly или auto-fill)
- [x] Подсказки / hints в базовом режиме («лексема — в расширенном»)

**G12b — фаза 2: структурный рефакторинг (средний риск)**

- [x] Вынести **`app-card-options-editor`** — единый UI для select / timed / reading / sound / symbol
  - config: `side`, `options`, `lexemes`, `correctIndex`, labels
  - общие add / remove / reorder / correctIndex в одном TS-модуле
- [x] **Вкладки** в dialog: «Контент» | «Фонетика» | «Настройки» + preview справа
- [x] Разбить `card-form` на shell + kind-forms:
  - `choice-card-form` (select, timed, reading, symbol, tone)
  - `input-card-form` (keyboard, draw)
  - `pairs-card-form` (memory)
  - `media-card-form` (sound)
- [x] Registry `CARD_FORM_BY_KIND` вместо монолитного `@if (kind)` в одном HTML
- [x] Сократить дублирование в `card-validation.utils` (общие validators для option-cards)
- [x] Исправить layout option-row (grid под radio + text + lexeme + delete)

**G12c — фаза 3: упрощение домена (опционально, высокий риск)**

- [ ] Объединить kind'ы в UI создания: **Выбор** / **Ввод** / **Пары** / **Медиа** (4 пункта вместо 10)
- [ ] `reading` → select + тег / meta; `tone` → select с автогенерацией вариантов из `syllableBase`
- [ ] **Lexeme-first:** вариант = только `PhoneticLexeme`; `optionsLearning[i]` — derived при save (migration legacy JSON)
- [ ] Wizard create: тип → слово → варианты → (опц.) расширить
- [ ] Документ **`docs/EDITOR-UX.md`**: целевой UX, метрики (время создания demo-карточки, число полей)

**G12d — метрики и приёмка**

- [ ] Базовый select ru→en: **≤ 8 полей**, создание **< 2 мин**
- [ ] `card-form` shell + kind-forms: **< 200 строк** на файл (после G12b)
- [ ] Smoke: create / edit / preview / try для каждого kind в обоих режимах
- [ ] Регрессия: существующие demo-карточки в `select-cards.json` открываются и сохраняются без потери данных

### Прогон одной карточки (try dialog)

- [x] `SingleCardPlayStore` — state одной карточки (reuse card-answer.utils)
- [x] `CardTryDialogComponent` + `CardTryDialogService.open(cardId)`
- [x] Каталог: кнопка «Протестировать» на строке
- [x] Direction toggle, feedback, «Ещё раз» / «Закрыть»
- [x] `.card-try-dialog` responsive fullscreen
- [ ] (опц.) try из editor dialog (draft)
- [ ] (опц.) try из ScenarioCardPicker

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

