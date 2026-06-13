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


### Локализация

- Инструмент переключения языка на `@angular/localize`
- Настройка каждого языка в отдельном файле
- Поддержка английского языка
- Поддержка китайского языка
- Фича `features/locale/`
- Файлы переводов в `/src/locale`, формат: `messages.LANG.ts`
- Подключить локализацию в роутинг — в навигации
- Автоматическое переключение языка

