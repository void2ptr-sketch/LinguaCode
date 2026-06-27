# LinguaCode

**LinguaCode: языки в цифровую эпоху**

Приложение для исследования и изучения языков — от естественных до искусственных. Основная единица обучения — **карточка** (выбор ответа, запоминание, символы, звук, таймер, ввод с клавиатуры, рисование и др.). Карточки объединяются в **сценарии**, сценарии — в **уроки** и **программы**. Пользователь настраивает внешний вид и языковую пару; результаты обучения сохраняются локально.

Документация: [docs/INDEX.md](./docs/INDEX.md) · бизнес-идеи: [docs/BUSINESS.md](./docs/BUSINESS.md) · домен: [docs/DOMAIN.md](./docs/DOMAIN.md).

## Статус

**MVP реализован; активный бэклог G9g–G14.** Angular 19, 10 типов карточек, каталог с поиском, конструктор сценариев, программы/уроки, CJK/IPA-контент, Hanzi Engine для draw-карточек, режим фокуса (fullscreen).

Актуальный чеклист: [TASKS.md](./TASKS.md).

## Требования

| Инструмент  | Версия                          |
| ----------- | ------------------------------- |
| Node.js     | 20 LTS или новее (см. `.nvmrc`) |
| npm         | 10+                             |
| Angular CLI | 19+                             |
| Git         | 2.x                             |

## Быстрый старт

```bash
git clone git@github.com:void2ptr-sketch/LinguaCode.git
cd LinguaCode
npm install
npm start
```

Приложение будет доступно по адресу `http://localhost:4200`.

## Скрипты

| Команда                    | Описание                                              |
| -------------------------- | ----------------------------------------------------- |
| `npm start`                | Dev-сервер с hot reload                               |
| `npm run build`            | Production-сборка                                     |
| `npm run build:prod`       | Production-сборка (alias)                             |
| `npm test`                 | Unit-тесты                                            |
| `npm run test:ci`          | Тесты в CI-режиме                                     |
| `npm run lint`             | ESLint                                                |
| `npm run format`           | Prettier                                              |
| `npm run verify`           | lint + sync:hanzi + build + test (полная проверка)    |
| `npm run sync:hanzi`       | Синхронизация stroke-data для draw-карточек           |
| `npm run export:content-seed` | Экспорт пользовательского overlay → seed JSON      |

## Стек

- **Angular 19** — standalone-компоненты, без NgModule
- **TypeScript** — строгая типизация (`type`, не `interface`)
- **Angular Material** — UI-компоненты
- **SCSS** — стили; layout на CSS Grid (`grid-template-areas`)
- **Signal API** — управление состояние (RxJS только для HTTP/WebSocket)
- **ESLint + Prettier** — линтинг и форматирование
- **@angular/localize** — локализация (бэклог)

## Структура проекта

```
src/app/
├── core/
│   ├── layout/              # shell (header, navigation, main-layout, footer)
│   ├── models/              # User, Card, Scenario, Course, Lesson, …
│   ├── state/               # UserStore, LearningResultsStore
│   ├── data/                # repositories, overlay, content seed, hanzi-engine
│   └── api/                 # HttpClient, interceptors, mock handlers
├── shared/                  # переиспользуемые UI и утилиты
│   ├── pagination/          # PageRequest, PageResponse, UiPaginationComponent
│   ├── card-catalog-search/ # фильтры каталога, ScenarioCardPickerComponent
│   └── components/          # CardHost, cards/*, pinyin-keyboard, card-focus-shell
├── features/                # card-select, card-editor, scenario-builder, home, …
├── app.component.ts
├── app.config.ts
└── app.routes.ts

public/data/                 # seed JSON + content-manifest.json
src/environments/            # конфигурация окружения
docs/                        # документация (оглавление: docs/INDEX.md)
```

## Архитектура

- **Фичи** — изолированные модули в `features/` (компонент, сервис, типы в отдельных подпапках).
- **Layout** — shell-приложение с шапкой, навигацией, контентом и подвалом.
- **Состояние** — сервисы на signals; загрузка и ошибки API — тоже через signals.
- **Контент** — системный seed (`ContentSeedRepository` + manifest) + пользовательский overlay (`UserContentOverlay` в `localStorage`).
- **Роутинг** — `app.routes.ts`; фичи подключаются из меню в **header** и боковой **navigation**.

```
┌──────────────────────────────────────────────────────┐
│ header (menu-cards / tools / help / user)            │
├──────────┬───────────────────────────────────────────┤
│ nav      │ main-layout (router-outlet)               │
│ Главная  │                                           │
│ Обучение │                                           │
│ Карточки │                                           │
│ Конструк.│                                           │
├──────────┴───────────────────────────────────────────┤
│ footer                                               │
└──────────────────────────────────────────────────────┘
```

Боковое меню: **Главная** (`/home`) · **Обучение** (`/cards/select`) · **Карточки** (`/tools/cards`) · **Конструктор сценариев** · **Справка** · **Профиль**.

Детали: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/DOMAIN.md](./docs/DOMAIN.md#модели)

## Разработка

### Git workflow

Полные правила: [docs/.gitrules](./docs/.gitrules.md).

1. От актуальной `main` создать ветку `NUMBER_description` (например, `3_init-angular`).
2. Коммиты: `[NUMBER_description] краткое описание` — префикс совпадает с именем ветки.
3. После проверки сборки — merge commit в `main`; ветку не удалять.

### Lint и форматирование

```bash
npm run lint
npm run format
```

### Окружение

Конфигурация — `src/environments/environment.ts`. Файлы `.env`, ключи и пароли в репозиторий не коммитить.

## Roadmap

**MVP** — выполнен (см. [TASKS.md](./TASKS.md) §1–7).

**Текущий фокус**

- G9g — раздельные настройки отображения «задание» / «ответы» в `LexemeDisplay`
- G14h–j — layout практики (sidebar + mobile)
- G6 — локализация UI (`@angular/localize`)

**Бэклог**

- Backend API (production вместо mock interceptors)
- ASR / оценка произношения
- Экранная IPA-клавиатура

## Документация

- [Документация](./docs/INDEX.md) — оглавление
- [Бизнес-идеи](./docs/BUSINESS.md) — продуктовое видение
- [Домен](./docs/DOMAIN.md) — сущности, модели и терминология
- [Каталог карточек](./docs/CARD-CATALOG.md) — индекс, поиск, пагинация
- [Конструктор сценариев](./docs/SCENARIO-BUILDER.md) — масштабирование сценариев
- [CJK-контент](./docs/CJK-CONTENT.md) — иероглифы, пиньинь, тоны, полифония
- [IPA](./docs/PHONETIC-CONTENT.md) — фонетическая транскрипция
- [Задачи](./TASKS.md) — чеклист MVP и бэклога
- [Архитектура](./docs/ARCHITECTURE.md) — технические решения
- [Git rules](./docs/.gitrules.md) — ветки, коммиты, merge
