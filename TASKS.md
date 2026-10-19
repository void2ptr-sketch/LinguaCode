# `LinguaCode` — приложение для исследования и изучения языков

Чеклист MVP и бэклога. Оглавление: [docs/INDEX.md](./docs/INDEX.md) · бизнес: [docs/BUSINESS.md](./docs/BUSINESS.md) · домен: [docs/SYSTEM/DOMAIN.md](./docs/SYSTEM/DOMAIN.md) · архитектура: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## 1. Инициализация проекта

- [x] Создать Angular-приложение (standalone, без NgModule)
- [x] Подключить Angular Material
- [x] Настроить структуру папок: `core`, `shared`, `features`
- [x] Подключить линтер и форматирование (ESLint, Prettier)
- [x] Добавить базовые скрипты в `package.json` (`start`, `build`, `test`)
- [x] Добавить `.gitignore`, `.editorconfig`, `.nvmrc`

## 2. Базовая архитектура

- [x] Домен описан — см. [docs/SYSTEM/DOMAIN.md](./docs/SYSTEM/DOMAIN.md)
- [x] Настроить маршрутизацию (`app/app/app.routes.ts`, lazy `loadComponent`)
- [x] Добавить layout (шапка, подвал, навигация, контент, menu-\*)
  - шапка — `/src/app/widgets/header`
    - menu-cards — `/src/app/widgets/menu-cards` (встроено в шапку)
    - menu-tools — `/src/app/widgets/menu-tools` (встроено в шапку)
    - menu-help — `/src/app/widgets/menu-help` (встроено в шапку)
    - menu-user — `/src/app/widgets/menu-user` (встроено в шапку)
  - подвал — `/src/app/widgets/footer`
  - контент — `/src/app/widgets/main-layout`
  - навигация — `/src/app/widgets/navigation`
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

- [ ] Реальный бэкенд (Java Spring Boot)
- [ ] WebSocket для real-time синхронизации
- [ ] Offline-first архитектура с IndexedDB

## 6. Контент — C++ карточки

**G6a — Добавление lessonId к существующим картам**

- [x] Скрипт для добавления `lessonId` ко всем картам на основе `scenarioId`
- [x] Обновлено 3861 карт в 203 файлах сценариев (99.5% покрытие)
- [x] Все карты теперь имеют корректный `lessonId`

**G6b — Создание сценариев для уроков с <5 сценариями**

- [x] Создано 13 новых файлов сценариев для ключевых уроков:
  - `cpp.pointers-references.02.cards.json` (10 карт)
  - `cpp.strings-streams.02.cards.json` (10 карт)
  - `cpp.classes-objects.02.cards.json` (10 карт)
  - `cpp.templates-intro.02.cards.json` (10 карт)
  - `cpp.exceptions-errors.02.cards.json` (10 карт)
  - `cpp.file-io.04.cards.json` (10 карт)
  - `cpp.streams-files.02.cards.json` (10 карт)
  - `cpp.algorithms.05.cards.json` (10 карт)
  - `cpp.modern-cpp.05.cards.json` (10 карт)
  - `cpp.multithreading-async.02.cards.json` (10 карт)
  - `cpp.network-programming.02.cards.json` (10 карт)
  - `cpp.system-programming.02.cards.json` (10 карт)
  - `cpp.io-files.02.cards.json` (10 карт)

**G6c — Заполнение пустых сценариев картами**

- [ ] Создать карты для пустых файлов сценариев:
  - `cpp.basics.pointers-references.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.pointers-references.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.strings-streams.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.classes-objects.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.templates-intro.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.templates-stl.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.templates-stl.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.stl.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.exceptions-errors.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.exceptions-errors.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.file-io.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.io-files.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.classes.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.streams-files.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.algorithms.01.cards.json` (0 карт → создать 20)
  - `cpp.basics.modern-cpp.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.multithreading-async.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.network-programming.02.cards.json` (0 карт → создать 20)
  - `cpp.basics.system-programming.02.cards.json` (0 карт → создать 20)

**G6d — Итоговая статистика C++ контента**

- [x] Всего файлов сценариев: 234
- [x] Всего карт: 3881
- [x] Уникальных уроков: 152
- [ ] Уроков с >=5 сценариями: целевое значение — 100+
- [ ] Уроков с <3 сценариями: целевое значение — <50

## 7. Тестирование и CI/CD

- [x] Настроить Vitest для unit-тестов
- [x] Добавить CI пайплайн в `.github/workflows/ci.yml`
- [ ] Покрытие тестами: statements 80%, branches 80%, functions 80%, lines 80%
- [ ] E2E тесты с Cypress

## 8. Производительность

- [x] OnPush для всех компонентов
- [x] Lazy loading для страниц
- [ ] Bundle size budget: < 500KB gzipped
- [ ] Performance monitoring с Angular DevTools

## 9. Безопасность

- [x] Sanitization для пользовательского ввода
- [ ] XSS protection через Angular's built-in mechanisms
- [ ] CSRF tokens для API endpoints
- [ ] Rate limiting на бэкенде

## 10. Доступность (a11y)

- [ ] ARIA labels для всех интерактивных элементов
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Color contrast compliance (WCAG 2.1 AA)

## 11. Документация

- [x] Основная документация в `docs/`
- [x] API contract в `docs/API-CONTRACT.md`
- [ ] User guide для конечных пользователей
- [ ] Developer guide для новых участников команды

## 12. Редактор карточек (G12)

**G12a — Базовый редактор**

- [x] `CardEditorPageComponent` с lazy loading
- [x] `card-form` component с input/output bindings
- [x] Preview mode для предпросмотра карточки
- [x] Validation для всех полей карточки

**G12b — Refactoring card-form**

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

- [x] Объединить kind'ы в UI создания: **Выбор** / **Ввод** / **Пары** / **Медиа** (4 пункта вместо 10)
- [x] `reading` → select + тег / meta; `tone` → select с автогенерацией вариантов из `syllableBase`
- [x] **Lexeme-first:** вариант = только `PhoneticLexeme`; `optionsLearning[i]` — derived при save (migration legacy JSON)
- [x] Wizard create: тип → слово → варианты → (опц.) расширить
- [x] Документ **`docs/FEATURES/EDITOR-UX.md`**: целевой UX, метрики (время создания demo-карточки, число полей)

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

## D. Документация

- [x] Все файлы должны быть связаны через линки (для удобного перехода по документации).

### D1. Документация - основная

- [x] `TASKS.md` - BACKLOG: задачи проекта
- [x] Файлы `README.md` сгенерированные `Angular` не менять
- [x] `Read.project.md` - сводка инструкций по проекту
- [x] `Readme.short.md` - краткая инструкция по проекту

### D2. Документация - архитектурная

- [x] Документация расположена в папке `/docs`
- [x] Подсистемы проекта документированы: `/docs/ARCHITECTURE.<имя подсистемы>.md` (см. [INDEX.md](./docs/INDEX.md))
  - Структурный дизайн каждой подсистемы
  - Сводная информация об особенностях
  - UML-диаграммы (Mermaid) в каждом файле
- [x] Файл `/docs/BUSINESS.md` содержит бизнес-идеи и use case проекта
- [x] Файл `/docs/SYSTEM/DOMAIN.md` содержит модели проекта (таблица сущностей + схемы типов)
- [x] Документацию вести на русском языке
- [x] Формат документации UTF-8 (см. [INDEX.md § Формат](./docs/INDEX.md))

### L. Локализация (UiLocale)

- [ ] Настройка каждого языка в отдельном файле
- [ ] Поддержка английского языка
- [ ] Поддержка китайского языка
- [ ] Фича `features/locale/`
- [ ] Файлы переводов в `/src/locale`, формат: `messages.LANG.ts`
- [ ] Подключить локализацию в роутинг — в навигации
- [ ] Автоматическое переключение языка

## M. Миграция метаданных карточек

- [ ] **M1** — Перенести метаданные (`knownLanguage`, `learningLanguage`, `difficulty`, `tags`) из централизованного `/public/data/cards/card-index-meta.json` в каждый соответствующий файл `public/data/cards/{curseId}.json`, **сохраняя 100% обратную совместимость и не ломая интерфейс**.
  - ⚠️ **Важно**: пользователь не должен заметить никаких изменений в UI/UX до и после миграции.
  - Связи между карточками: "/public/data/cards/card-index-meta.json"."cards"."id" == "/public/data/cards/{curseId}.json"."metaById"."select-1"
  - [x] **M1a** — Этап 0: Подготовка — бэкап, тесты, анализ структуры файлов
  - [x] **M1b** — Этап 1: Анализ и сопоставление — извлечение метаданных, сканирование, выявление неполных карточек
  - [x] **M1c** — Этап 2: Миграция — добавление недостающих полей в карточки через скрипт merge
  - [x] **M1d** — Этап 3: Обновление фронтенда — fallback-логика чтения метаданных
  - [ ] **M1e** — Этап 4: Релиз и валидация — staging, мониторинг, информирование
  - [x] **M1f** — Этап 5: Финализация — удаление `card-index-meta.json` (опционально), обновление CI/CD и документации

## 16. Валидация и санитизация

- **Информация** - настройка проверки должна ввестись на строне ввода (в форме), каждое поле может иметь несколько типов проверок.
- **Информация** - по возможности проводить проверки на основании встроенных в Angular механизмов.

- [ ] Настроить валидацию на основании:
  - [ ] типов введенных значений ( number / int / long / string / map / ... )
  - [ ] языковых кодировок ( Russian / Latin )
  - [ ] размеров ( SIZE )
  - [ ] EMAIL [ '.psbank.ru', '... ']
  - [ ] списка значений
  - [ ] диапазон значений
