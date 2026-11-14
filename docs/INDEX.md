# Документация LinguaCode

Оглавление документов репозитория.

## Обзор проекта

| Документ                  | Описание                             |
| ------------------------- | ------------------------------------ |
| [README.md](../README.md) | Обзор, стек, запуск, структура папок |
| [TASKS.md](../TASKS.md)   | Чеклист MVP и бэклога (G0–G16…)      |

## Продукт и домен

| Документ                                        | Описание                                                |
| ----------------------------------------------- | ------------------------------------------------------- |
| [BUSINESS.md](./PRODUCT/BUSINESS.md)            | Бизнес-идеи, миссия, ценность для пользователя          |
| [DOMAIN.md](./PRODUCT/DOMAIN.md)                | Доменная модель: сущности, типы, иерархия контента      |
| [LANGUAGE-PAIR.md](./FEATURES/LANGUAGE-PAIR.md) | Пара языков known → learning, G7–G8, Learning Home      |
| [COURSE-CPP.md](./DATA/COURSE-CPP.md)           | Курс C++ Complete Course: структура, сценарии, карточки |
| [FILE-FORMATS.md](./DATA/FILE-FORMATS.md)       | Форматы seed-файлов: courses, scenarios, cards          |

## Техническая документация

| Документ                                                                            | Описание                                                                 |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [ARCHITECTURE.md](./PRODUCT/ARCHITECTURE.md)                                        | Обзор: слои, layout, роутинг, signals, офлайн-кэширование                |
| [ARCHITECTURE.core.md](./ARCHITECTURE/ARCHITECTURE.core.md)                         | Бывший `core`: карта переноса в entities/shared/widgets                  |
| [ARCHITECTURE.shared.md](./ARCHITECTURE/ARCHITECTURE.shared.md)                     | CardHost, pickers, lexeme, pagination                                    |
| [ARCHITECTURE.card-select.md](./ARCHITECTURE/ARCHITECTURE.card-select.md)           | Практика `/cards/select`                                                 |
| [ARCHITECTURE.home.md](./ARCHITECTURE/ARCHITECTURE.home.md)                         | Dashboard `/home`                                                        |
| [ARCHITECTURE.content-explorer.md](./ARCHITECTURE/ARCHITECTURE.content-explorer.md) | Проводник контента `/tools/content` (дерево иерархии)                    |
| [ARCHITECTURE.card-editor.md](./ARCHITECTURE/ARCHITECTURE.card-editor.md)           | Редактор `/tools/cards`                                                  |
| [ARCHITECTURE.scenario-builder.md](./ARCHITECTURE/ARCHITECTURE.scenario-builder.md) | Сценарии: диалог и store в Проводнике контента                           |
| [ARCHITECTURE.course.md](./ARCHITECTURE/ARCHITECTURE.course.md)                     | Программы и каталог                                                      |
| [ARCHITECTURE.program.md](./ARCHITECTURE/ARCHITECTURE.program.md)                   | Учебные треки (`Program`)                                                |
| [ARCHITECTURE.journey.md](./ARCHITECTURE/ARCHITECTURE.journey.md)                   | Путь обучения (`journey map`)                                            |
| [ARCHITECTURE.learning-results.md](./ARCHITECTURE/ARCHITECTURE.learning-results.md) | Прогресс и `LearningResult`                                              |
| [ARCHITECTURE.user.md](./ARCHITECTURE/ARCHITECTURE.user.md)                         | Профиль пользователя и настройки                                         |
| [ARCHITECTURE.roles-zones.md](./ARCHITECTURE/ARCHITECTURE.roles-zones.md)           | Роли и зоны доступа: ROLE_USER, ROLE_AUTHOR, ROLE_ADMIN                  |
| [ARCHITECTURE.roles-ui.md](./ARCHITECTURE/ARCHITECTURE.roles-ui.md)                 | UI по ролям: меню, виджеты, guards, шаблоны                              |
| [ARCHITECTURE.subscription.md](./ARCHITECTURE/ARCHITECTURE.subscription.md)         | Подписки, тарифы, уровни доступа, монетизация                            |
| [CARD-CATALOG.md](./COMMON/CARD-CATALOG.md)                                         | Индекс карточек, поиск, пагинация, API                                   |
| [API-CONTRACT.md](./API-CONTRACT.md)                                                | HTTP API: эндпоинты, обёртки, ошибки                                     |
| [SCENARIO-BUILDER.md](./FEATURES/SCENARIO-BUILDER.md)                               | Сценарии: `ScenarioCardSource`, диалог, Проводник контента               |
| [EDITOR-UX.md](./FEATURES/EDITOR-UX.md)                                             | UX редактора карточек (G12)                                              |
| [CONTENT-EXPLORER.md](./FEATURES/CONTENT-EXPLORER.md)                               | Проводник контента `/tools/content`: дерево иерархии, CRUD, экспорт      |
| [CARD-SELECT.md](./FEATURES/CARD-SELECT.md)                                         | Выбор карточек и тренировка `/cards/select`: session flow, learning zone |
| [COURSE-CATALOG.md](./FEATURES/COURSE-CATALOG.md)                                   | Каталог курсов `/courses`: обзор, прогресс, пагинация, вкладки           |
| [COURSE-BUILDER.md](./FEATURES/COURSE-BUILDER.md)                                   | Конструктор курсов: dialog CRUD, 4 вкладки формы, экспорт                |
| [HOME.md](./FEATURES/HOME.md)                                                       | Главная `/home`: Learning Dashboard, roadmap, прогресс                   |
| [JOURNEY.md](./FEATURES/JOURNEY.md)                                                 | Карта обучения `/journey`: интерактивная карта контента, аналитика       |
| [LESSON-BUILDER.md](./FEATURES/LESSON-BUILDER.md)                                   | Конструктор уроков: dialog CRUD для уроков внутри программ               |
| [PROGRAM-BUILDER.md](./FEATURES/PROGRAM-BUILDER.md)                                 | Конструктор программ: dialog CRUD для треков внутри курсов               |

## Паттерны и архитектура

| Документ                                                    | Описание                                              |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| [PATTERN-DIRTY-STATE.md](./PATTERNS/PATTERN-DIRTY-STATE.md) | Паттерн отслеживания несохранённых изменений в формах |
| [MODAL-DIALOG.md](./PATTERNS/MODAL-DIALOG.md)               | Архитектура модальных диалогов                        |

## Контент и локализация

| Документ                                             | Описание                                       |
| ---------------------------------------------------- | ---------------------------------------------- |
| [CJK-CONTENT.md](./CONTENT/CJK-CONTENT.md)           | Иероглифы, пиньинь, жуинь, Палладия, тоны (G9) |
| [PHONETIC-CONTENT.md](./CONTENT/PHONETIC-CONTENT.md) | IPA и фонетическая транскрипция (G10)          |

## Процесс разработки

| Документ                               | Описание              |
| -------------------------------------- | --------------------- |
| [GIT-RULES.md](./PROCESS/GIT-RULES.md) | Ветки, коммиты, merge |

## Формат

- Кодировка: **UTF-8** (без BOM).
- Язык: **русский** (идентификаторы кода — как в исходниках).

## Быстрая навигация по темам

- **Объект изучения vs карточка (компоненты, затенение известного)** — [BUSINESS.md § Объект и карточка](./PRODUCT/BUSINESS.md#объект-изучения-и-карточка)
- **Иерархия Card → Scenario → Lesson → Program → Course** — [DOMAIN.md § Иерархия](./PRODUCT/DOMAIN.md#иерархия-контента) · [BUSINESS.md § Иерархия](./PRODUCT/BUSINESS.md#иерархия-учебного-контента)
- **«Курс» vs программа (`Course`) vs трек (`Program`)** — [DOMAIN.md § Термины](./PRODUCT/DOMAIN.md#термины-не-путать-курс-и-languagepair) · [LANGUAGE-PAIR.md](./FEATURES/LANGUAGE-PAIR.md)
- **Dashboard `/home` и практика `/cards/select`** — [DOMAIN.md § Learning Home](./PRODUCT/DOMAIN.md#learning-home-g13)
- **Модели TypeScript** — [DOMAIN.md § Модели](./PRODUCT/DOMAIN.md#модели)
- **Уровень подготовки в профиле** — [DOMAIN.md § UserPreferences](./PRODUCT/DOMAIN.md#сущности) · `learning-proficiency.types.ts`
- **Цвета тонов (Dummit 2008)** — [CONTENT/CJK-CONTENT.md § Цветовая маркировка](./CONTENT/CJK-CONTENT.md#цветовая-маркировка-тонов)
- **Структура `src/app`** — [ARCHITECTURE.md § Структура](./PRODUCT/ARCHITECTURE.md)
