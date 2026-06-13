# LinguaCode

**LinguaCode: языки в цифровую эпоху**

Приложение для исследования и изучения языков — от естественных до искусственных. Основная единица обучения — **карточка** (вопрос с выбором ответа, запоминание, символы, звук, таймер, ввод с клавиатуры, рисование и др.). Карточки объединяются в **сценарии**; пользователь настраивает их внешний вид, результаты обучения сохраняются.

Подробнее о домене: [docs/DOMAIN.md](./docs/DOMAIN.md).

## Статус

**MVP в разработке.** Сейчас в репозитории — документация и правила разработки; Angular-приложение ещё не инициализировано.

Актуальный чеклист: [TASKS.md](./TASKS.md).

## Требования

| Инструмент | Версия |
|------------|--------|
| Node.js | 20 LTS или новее |
| npm | 10+ |
| Angular CLI | 19+ (после инициализации проекта) |
| Git | 2.x |

## Быстрый старт

```bash
git clone git@github.com:void2ptr-sketch/LinguaCode.git
cd LinguaCode
```

После инициализации Angular (см. [TASKS.md](./TASKS.md), п. 1):

```bash
npm install
npm start
```

Приложение будет доступно по адресу `http://localhost:4200`.

## Скрипты

Появятся в `package.json` после создания Angular-проекта:

| Команда | Описание |
|---------|----------|
| `npm start` | Dev-сервер с hot reload |
| `npm run build` | Production-сборка |
| `npm test` | Unit-тесты |
| `npm run lint` | ESLint (после настройки) |

## Стек

- **Angular** — standalone-компоненты, без NgModule
- **TypeScript** — строгая типизация (`type`, не `interface`)
- **Angular Material** — UI-компоненты
- **SCSS** — стили; layout на CSS Grid (`grid-template-areas`)
- **Signal API** — управление состоянием (RxJS только для HTTP/WebSocket)
- **@angular/localize** — локализация (бэклог)

## Структура проекта

Планируемая структура после инициализации:

```
src/app/
├── core/
│   └── layout/
│       ├── header/          # шапка (+ menu-card, menu-help, menu-user)
│       ├── footer/
│       ├── main-layout/     # область контента (router-outlet)
│       └── navigation/
├── shared/                  # переиспользуемые UI и утилиты
└── features/
    └── card-select/         # первая фича MVP
        ├── components/
        ├── services/
        └── types/

src/environments/            # конфигурация окружения
src/locale/                  # переводы (бэклог): messages.LANG.ts
docs/                        # документация проекта
```

## Архитектура

- **Фичи** — изолированные модули в `features/` (компонент, сервис, типы в отдельных подпапках).
- **Layout** — shell-приложение с шапкой, навигацией, контентом и подвалом.
- **Состояние** — сервисы на signals; загрузка и ошибки API — тоже через signals.
- **Роутинг** — `app.routes.ts`; фичи подключаются из меню (например, `menu-card` → `card-select`).

```
┌──────────────────────────────────────┐
│ header (menu-card / help / user)     │
├──────────┬───────────────────────────┤
│ nav      │ main-layout (router-outlet)│
├──────────┴───────────────────────────┤
│ footer                               │
└──────────────────────────────────────┘
```

Детали: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/DOMAIN.md](./docs/DOMAIN.md)

## Разработка

### Git workflow

Полные правила: [docs/.gitrules](./docs/.gitrules).

1. От актуальной `main` создать ветку `NUMBER_description` (например, `1_init-docs`).
2. Коммиты: `[NUMBER_description] краткое описание` — префикс совпадает с именем ветки.
3. После проверки сборки — merge commit в `main`; ветку не удалять.

```bash
git checkout main && git pull
git checkout -b 2_init-angular
git commit -m "[2_init-angular] bootstrap Angular project"
```

### Lint и форматирование

ESLint и Prettier — после инициализации проекта ([TASKS.md](./TASKS.md), п. 1).

### Окружение

Конфигурация — `src/environments/environment.ts`. Файлы `.env`, ключи и пароли в репозиторий не коммитить.

## Roadmap

**MVP**

1. Инициализация Angular и структура `core` / `shared` / `features`
2. Layout (header, navigation, main-layout, footer)
3. Первая фича — `features/card-select/` (карточка с выбором ответов)
4. HTTP, interceptors, обработка ошибок
5. Smoke-тесты, production-сборка, CI

**Бэклог**

- Локализация (`@angular/localize`, `src/locale/messages.*.ts`, EN/ZH)
- Остальные типы карточек (запоминание, символы, звук, таймер, ввод, рисование)

## Документация

- [Домен](./docs/DOMAIN.md) — сущности и бизнес-логика
- [Задачи](./TASKS.md) — чеклист MVP и бэклога
- [Архитектура](./docs/ARCHITECTURE.md) — технические решения
- [Git rules](./docs/.gitrules) — ветки, коммиты, merge
