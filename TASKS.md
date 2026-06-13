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

- Домен описан — см. [docs/DOMAIN.md](./docs/DOMAIN.md)
- Настроить маршрутизацию (`app.routes.ts`, lazy `loadComponent`)
- Добавить layout (шапка, подвал, навигация, контент, menu-*)
  - шапка — `/src/app/core/layout/header`
    - menu-cards — `/src/app/core/layout/menu-cards` (встроено в шапку)
    - menu-tools — `/src/app/core/layout/menu-tools` (встроено в шапку)
    - menu-help — `/src/app/core/layout/menu-help` (встроено в шапку)
    - menu-user — `/src/app/core/layout/menu-user` (встроено в шапку)
  - подвал — `/src/app/core/layout/footer`
  - контент — `/src/app/core/layout/main-layout`
  - навигация — `/src/app/core/layout/navigation`
- Создать `core/models/` — типы из DOMAIN (`User`, `Card`, `Scenario`, `LearningResult`)
- Вынести конфигурацию окружения (`environment.ts`)

## 3. Управление состоянием

- Определить глобальное состояние (сервисы + signals в `core/state/`)
- Избегать лишнего RxJS — только там, где нужны потоки (HTTP, WebSocket)
- Типизировать модели данных (`type`, не `interface`) в `core/models/`

## 4. Первая фича

- Создать папку `features/card-select/` (компонент, сервис, типы — в отдельных подпапках)
- Карточка с выбором ответа (`CardKind: select`)
- Маршрут `/cards/select`
- Подключить фичу в роутинг через `menu-cards`

## 5. API и данные

### MVP

- Mock-сервис и JSON fixtures в `assets/data/`
- Обработать состояния загрузки и ошибок (signals)

### После MVP

- Настроить `HttpClient` и interceptors (auth, ошибки) в `core/api/`
- Описать типы ответов API

## 6. Безопасность

- Не хранить секреты в репозитории (`.env` в `.gitignore`)
- Санитизация пользовательского ввода
- Проверить зависимости на уязвимости (`npm audit`)

## 7. Качество и релиз

- Написать smoke-тесты для критичных сценариев
- Проверить сборку production (`ng build`)
- [x] Обновить `README.md` (описание, запуск, стек, структура)
- [x] Заполнить / обновить `docs/ARCHITECTURE.md`
- [x] Синхронизировать `README.md` с layout (`menu-cards`, `menu-tools`)
- Настроить CI (сборка + тесты на push)

---

## Бэклог (после MVP)

### Конструктор сценариев

- Фича `features/scenario-builder/`
- Маршрут `/tools/scenario-builder`
- Точка входа — `menu-tools` в header
- CRUD сценариев (`Scenario`: title, description, cardIds)

### Типы карточек

- `memory` — запоминание
- `symbol` — символы
- `sound` — звук
- `timed` — временное ограничение
- `keyboard` — ввод с клавиатуры
- `draw` — рисование
- Общий `CardHostComponent` для рендера по `kind`

### Результаты обучения

- Сохранение `LearningResult` (локально / API)
- Отображение прогресса пользователя

### Локализация

- Инструмент переключения языка на `@angular/localize`
- Настройка каждого языка в отдельном файле
- Поддержка английского языка
- Поддержка китайского языка
- Фича `features/locale/`
- Файлы переводов в `/src/locale`, формат: `messages.LANG.ts`
- Подключить локализацию в роутинг — в навигации
- Автоматическое переключение языка

