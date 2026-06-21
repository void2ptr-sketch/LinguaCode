# Документация LinguaCode

Оглавление документов репозитория.

## Обзор проекта

| Документ | Описание |
|----------|----------|
| [README.md](../README.md) | Обзор, стек, запуск, структура папок |
| [TASKS.md](../TASKS.md) | Чеклист MVP и бэклога (G0–G14…) |

## Продукт и домен

| Документ | Описание |
|----------|----------|
| [BUSINESS.md](./BUSINESS.md) | Бизнес-идеи, миссия, ценность для пользователя |
| [DOMAIN.md](./DOMAIN.md) | Доменная модель: сущности, типы, иерархия контента |
| [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md) | Пара языков known → learning, G7–G8, Learning Home |

## Техническая документация

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Обзор: слои, layout, роутинг, signals |
| [ARCHITECTURE.core.md](./ARCHITECTURE.core.md) | Ядро: layout, state, api, theme |
| [ARCHITECTURE.shared.md](./ARCHITECTURE.shared.md) | CardHost, pickers, lexeme, pagination |
| [ARCHITECTURE.card-select.md](./ARCHITECTURE.card-select.md) | Практика `/cards/select` |
| [ARCHITECTURE.home.md](./ARCHITECTURE.home.md) | Dashboard `/home` |
| [ARCHITECTURE.card-editor.md](./ARCHITECTURE.card-editor.md) | Редактор `/tools/cards` |
| [ARCHITECTURE.scenario-builder.md](./ARCHITECTURE.scenario-builder.md) | Конструктор сценариев |
| [ARCHITECTURE.course.md](./ARCHITECTURE.course.md) | Программы и каталог |
| [ARCHITECTURE.learning-results.md](./ARCHITECTURE.learning-results.md) | Прогресс и `LearningResult` |
| [CARD-CATALOG.md](./CARD-CATALOG.md) | Индекс карточек, поиск, пагинация, API |
| [SCENARIO-BUILDER.md](./SCENARIO-BUILDER.md) | Конструктор сценариев, `ScenarioCardSource` |
| [EDITOR-UX.md](./EDITOR-UX.md) | UX редактора карточек (G12) |

## Контент и локализация

| Документ | Описание |
|----------|----------|
| [CJK-CONTENT.md](./CJK-CONTENT.md) | Иероглифы, пиньинь, жуинь, Палладия, тоны (G9) |
| [PHONETIC-CONTENT.md](./PHONETIC-CONTENT.md) | IPA и фонетическая транскрипция (G10) |

## Процесс разработки

| Документ | Описание |
|----------|----------|
| [.gitrules.md](./.gitrules.md) | Ветки, коммиты, merge |

## Формат

- Кодировка: **UTF-8** (без BOM).
- Язык: **русский** (идентификаторы кода — как в исходниках).

## Быстрая навигация по темам

- **Объект изучения vs карточка (компоненты, затенение известного)** — [BUSINESS.md § Объект и карточка](./BUSINESS.md#объект-изучения-и-карточка)
- **Иерархия Card → Scenario → Lesson → Course** — [DOMAIN.md § Иерархия](./DOMAIN.md#иерархия-контента) · [BUSINESS.md § Иерархия](./BUSINESS.md#иерархия-учебного-контента)
- **«Курс» vs программа (`Course`)** — [DOMAIN.md § Термины](./DOMAIN.md#термины-не-путать-курс-и-languagepair) · [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md)
- **Dashboard `/home` и практика `/cards/select`** — [DOMAIN.md § Learning Home](./DOMAIN.md#learning-home-g13)
- **Модели TypeScript** — [DOMAIN.md § Модели](./DOMAIN.md#модели)
- **Структура `src/app`** — [ARCHITECTURE.md § Структура](./ARCHITECTURE.md)
