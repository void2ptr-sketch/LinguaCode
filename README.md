# LinguaCode

**LinguaCode: языки в цифровую эпоху**

Приложение для исследования и изучения языков — от естественных до искусственных. Основная единица обучения — **карточка** (вопрос с выбором ответа, запоминание, символы, звук, таймер, ввод с клавиатуры, рисование и др.). Карточки объединяются в **сценарии**; пользователь настраивает их внешний вид, результаты обучения сохраняются.

Подробнее о домене: [docs/DOMAIN.md](./docs/DOMAIN.md).

## Статус

**MVP в разработке.** Angular 19 инициализирован; следующий шаг — layout и первая фича.

Актуальный чеклист: [TASKS.md](./TASKS.md).

## Требования

| Инструмент | Версия |
|------------|--------|
| Node.js | 20 LTS или новее (см. `.nvmrc`) |
| npm | 10+ |
| Angular CLI | 19+ |
| Git | 2.x |

## Быстрый старт

```bash
git clone git@github.com:void2ptr-sketch/LinguaCode.git
cd LinguaCode
npm install
npm start
```

Приложение будет доступно по адресу `http://localhost:4200`.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm start` | Dev-сервер с hot reload |
| `npm run build` | Production-сборка |
| `npm test` | Unit-тесты |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Стек

- **Angular 19** — standalone-компоненты, без NgModule
- **TypeScript** — строгая типизация (`type`, не `interface`)
- **Angular Material** — UI-компоненты
- **SCSS** — стили; layout на CSS Grid (`grid-template-areas`)
- **Signal API** — управление состоянием (RxJS только для HTTP/WebSocket)
- **ESLint + Prettier** — линтинг и форматирование
- **@angular/localize** — локализация (бэклог)

## Структура проекта

```
src/app/
├── core/
│   ├── layout/              # shell (header, navigation, main-layout, footer)
│   ├── models/              # User, Card, Scenario, CardIndexEntry, …
│   ├── state/               # глобальные signal-сервисы
│   └── api/                 # HttpClient, interceptors
├── shared/                  # переиспользуемые UI и утилиты
│   ├── pagination/          # PageRequest, PageResponse, UiPaginationComponent
│   └── card-catalog-search/ # фильтры каталога, ScenarioCardPickerComponent
├── features/                # фичи (card-select, scenario-builder, card-editor, …)
├── app.component.ts
├── app.config.ts
└── app.routes.ts

src/environments/            # конфигурация окружения
src/locale/                  # переводы (бэклог): messages.LANG.ts
docs/                        # документация проекта
```

## Архитектура

- **Фичи** — изолированные модули в `features/` (компонент, сервис, типы в отдельных подпапках).
- **Layout** — shell-приложение с шапкой, навигацией, контентом и подвалом.
- **Состояние** — сервисы на signals; загрузка и ошибки API — тоже через signals.
- **Роутинг** — `app.routes.ts`; фичи подключаются из меню в **header** (`menu-cards`, `menu-tools`) и дублируются в боковой **navigation**.

```
┌──────────────────────────────────────────────────────┐
│ header (menu-cards / tools / help / user)            │
├──────────┬───────────────────────────────────────────┤
│ nav      │ main-layout (router-outlet)               │
│ Обучение │                                           │
│ Карточки │                                           │
│ Конструк.│                                           │
├──────────┴───────────────────────────────────────────┤
│ footer                                               │
└──────────────────────────────────────────────────────┘
```

Боковое меню: **Главная** · **Обучение** (`/cards/select`) · **Карточки** (`/tools/cards`) · **Конструктор сценариев** · **Справка** · **Профиль**. Шапка сохраняет прежние пункты «Карточки» и «Инструменты».

Детали: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/DOMAIN.md](./docs/DOMAIN.md#модели)

## Разработка

### Git workflow

Полные правила: [docs/.gitrules](./docs/.gitrules).

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

**MVP**

1. ~~Инициализация Angular и структура `core` / `shared` / `features`~~
2. Layout (header, navigation, main-layout, footer)
3. Первая фича — `features/card-select/` (карточка с выбором ответов)
4. HTTP, interceptors, обработка ошибок
5. Smoke-тесты, production-сборка, CI

**Бэклог**

- Локализация (`@angular/localize`, `src/locale/messages.*.ts`, EN/ZH)
- Остальные типы карточек (запоминание, символы, звук, таймер, ввод, рисование)

## Документация

- [Домен](./docs/DOMAIN.md) — сущности, модели и бизнес-логика
- [Каталог карточек](./docs/CARD-CATALOG.md) — индекс, поиск, пагинация
- [Конструктор сценариев](./docs/SCENARIO-BUILDER.md) — масштабирование сценариев и card-select
- [Задачи](./TASKS.md) — чеклист MVP и бэклога
- [Архитектура](./docs/ARCHITECTURE.md) — технические решения
- [Git rules](./docs/.gitrules) — ветки, коммиты, merge
