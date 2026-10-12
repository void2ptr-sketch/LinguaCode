# LinguaCode

**LinguaCode: языки в цифровую эпоху**

Приложение для исследования и изучения языков — от естественных до искусственных. Основная единица обучения — **карточка** (выбор ответа, запоминание, символы, звук, таймер, ввод с клавиатуры, рисование и др.). Карточки объединяются в **сценарии**, сценарии — в **уроки** и **программы**. Пользователь настраивает внешний вид и языковую пару; результаты обучения сохраняются локально.

Документация: [docs/INDEX.md](./docs/INDEX.md) · бизнес-идеи: [docs/BUSINESS.md](./docs/BUSINESS.md) · домен: [docs/SYSTEM/DOMAIN.md](./docs/SYSTEM/DOMAIN.md).

## Статус

**MVP реализован; активный бэклог G9g–G14.** Angular 22, 10 типов карточек, каталог с поиском и фильтрами по иерархии, конструктор сценариев, программы/уроки (CourseBundle), CJK/IPA-контент, Hanzi Engine для draw-карточек, режим фокуса (fullscreen).

Актуальный чеклист: [TASKS.md](./TASKS.md).

## Требования

| Инструмент  | Версия                          |
| ----------- | ------------------------------- |
| Node.js     | 24 LTS (см. `.nvmrc`)           |
| npm         | 10+                             |
| Angular CLI | 22+                             |
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

| Команда                         | Описание                                           |
| ------------------------------- | -------------------------------------------------- |
| `npm start`                     | Dev-сервер с hot reload                            |
| `npm run build`                 | Production-сборка                                  |
| `npm run build:prod`            | Production-сборка (alias)                          |
| `npm test`                      | Unit-тесты                                         |
| `npm run test:ci`               | Тесты в CI-режиме                                  |
| `npm run lint`                  | ESLint                                             |
| `npm run format`                | Prettier                                           |
| `npm run verify`                | lint + sync:hanzi + build + test (полная проверка) |
| `npm run sync:hanzi`            | Синхронизация stroke-data для draw-карточек        |
| `npm run export:content-seed`   | Экспорт пользовательского overlay → seed JSON      |
| `npm run import:perl-idea`      | Импорт идеи Perl-интервью из Markdown              |
| `npm run import:course-bundle`  | Импорт CourseBundle JSON в seed                    |
| `npm run generate:radicals-course` | Генерация курса радикалов + экспорт seed        |
| `npm run export:course-pdf`     | Экспорт курса в PDF                                |

## Стек

- **Angular 22** — standalone-компоненты, без NgModule
- **TypeScript** — строгая типизация (`type`, не `interface`)
- **Angular Material** — UI-компоненты
- **SCSS** — стили; layout на CSS Grid (`grid-template-areas`)
- **Signal API** — управление состоянием (RxJS только для HTTP/WebSocket)
- **ESLint + Prettier** — линтинг и форматирование
- **jspdf + pdfkit** — экспорт курсов в PDF (`export:course-pdf`)
- **@angular/localize** — локализация (бэклог)

## Структура проекта (FSD)

```
src/app/
├── app/        # композиция: app/app.config, app/app.routes, provide-api, interceptors, theme
├── pages/      # страницы-маршруты (*-page)
├── widgets/    # переиспользуемые UI: card-host, cards/*, pickers, layout (header/nav/main-layout/footer)
├── features/   # изолированные фичи (card-select, card-editor, scenario-builder, home, …)
├── entities/   # доменные слайсы: card, course, lesson, scenario, user, learning, …
└── shared/     # доменно-агностичный код: utils, security, api-инфраструктура, theme-типы

public/data/                 # seed JSON + content-manifest.json
src/environments/            # конфигурация окружения
docs/                        # документация (оглавление: docs/INDEX.md)
```

## Архитектура

- **FSD (Feature-Sliced Design)** — 6 слоёв; импорты строго вниз (app → pages → widgets → features → entities → shared). Проверка: `node scripts/audit-fsd.mjs`.
- **Фичи** — изолированные модули в `features/`; фичи не импортируют друг друга; публичный API через `index.ts`.
- **Layout** — shell-приложение в `widgets/` (header, navigation, main-layout, footer).
- **Состояние** — сервисы на signals; загрузка и ошибки API — тоже через signals.
- **Контент** — системный seed (`ContentSeedRepository` + manifest) + пользовательский overlay (`UserContentOverlay` в `localStorage`).
- **Роутинг** — `app/app/app.routes.ts`; страницы в `pages/`, подключаются из меню в **header** и боковой **navigation**.

```
┌──────────────────────────────────────────────────────┐
│ header (menu-cards / tools / help / user)            │
├──────────┬───────────────────────────────────────────┤
│ nav      │ main-layout (router-outlet)               │
│ Главная  │                                           │
│ Обучение │                                           │
│ Карточки │                                           │
│ Сценарии │                                           │
├──────────┴───────────────────────────────────────────┤
│ footer                                               │
└──────────────────────────────────────────────────────┘
```

Боковое меню: **Главная** (`/home`) · **Обучение** (`/cards/select`) · **Карточки** (`/tools/cards`) · **Конструктор сценариев** · **Справка** · **Профиль**.

Детали: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/SYSTEM/DOMAIN.md](./docs/SYSTEM/DOMAIN.md#модели)

## Разработка

### Git workflow

Полные правила: [docs/SYSTEM/GIT-RULES.md](./docs/SYSTEM/GIT-RULES.md).

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
- [Домен](./docs/SYSTEM/DOMAIN.md) — сущности, модели и терминология
- [Каталог карточек](./docs/SYSTEM/CARD-CATALOG.md) — индекс, поиск, пагинация
- [Поля карточек](./docs/SYSTEM/CARD-FIELD-GUIDE.md) — руководство по полям `Card`
- [Конструктор сценариев](./docs/FEATURES/SCENARIO-BUILDER.md) — масштабирование сценариев
- [Программы/уроки](./docs/FEATURES/COURSE-BUNDLE.md) — формат CourseBundle и импорт
- [Модальные диалоги](./docs/PATTERNS/MODAL-DIALOG.md) — архитектура диалогов редактора
- [Mock-данные](./docs/SYSTEM/MOCK-DATA.md) — seed + overlay (localStorage)
- [CJK-контент](./docs/CONTENT/CJK-CONTENT.md) — иероглифы, пиньинь, тоны, полифония
- [IPA](./docs/CONTENT/PHONETIC-CONTENT.md) — фонетическая транскрипция
- [Задачи](./TASKS.md) — чеклист MVP и бэклога
- [Архитектура](./docs/ARCHITECTURE.md) — технические решения
- [Git rules](./docs/SYSTEM/GIT-RULES.md) — ветки, коммиты, merge
