# Документация LinguaCode

Оглавление документов репозитория.

## Обзор проекта

| Документ                  | Описание                             |
| ------------------------- | ------------------------------------ |
| [README.md](../README.md) | Обзор, стек, запуск, структура папок |
| [TASKS.md](../TASKS.md)   | Чеклист MVP и бэклога (G0–G16…)      |

## Продукт и домен

| Документ                               | Описание                                           |
| -------------------------------------- | -------------------------------------------------- |
| [BUSINESS.md](./BUSINESS.md)           | Бизнес-идеи, миссия, ценность для пользователя     |
| [DOMAIN.md](./SYSTEM/DOMAIN.md)               | Доменная модель: сущности, типы, иерархия контента |
| [LANGUAGE-PAIR.md](./FEATURES/LANGUAGE-PAIR.md) | Пара языков known → learning, G7–G8, Learning Home |

## Техническая документация

| Документ                                                               | Описание                                    |
| ---------------------------------------------------------------------- | ------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                                   | Обзор: слои, layout, роутинг, signals       |
| [ARCHITECTURE.core.md](./ARCHITECTURE/ARCHITECTURE.core.md)                         | Бывший `core`: карта переноса в entities/shared/widgets |
| [ARCHITECTURE.shared.md](./ARCHITECTURE/ARCHITECTURE.shared.md)                     | CardHost, pickers, lexeme, pagination       |
| [ARCHITECTURE.card-select.md](./ARCHITECTURE/ARCHITECTURE.card-select.md)           | Практика `/cards/select`                    |
| [ARCHITECTURE.home.md](./ARCHITECTURE/ARCHITECTURE.home.md)                         | Dashboard `/home`                           |
| [ARCHITECTURE.card-editor.md](./ARCHITECTURE/ARCHITECTURE.card-editor.md)           | Редактор `/tools/cards`                     |
| [ARCHITECTURE.scenario-builder.md](./ARCHITECTURE/ARCHITECTURE.scenario-builder.md) | Конструктор сценариев                       |
| [ARCHITECTURE.course.md](./ARCHITECTURE/ARCHITECTURE.course.md)                     | Программы и каталог                         |
| [ARCHITECTURE.learning-results.md](./ARCHITECTURE/ARCHITECTURE.learning-results.md) | Прогресс и `LearningResult`                 |
| [CARD-CATALOG.md](./SYSTEM/CARD-CATALOG.md)                                   | Индекс карточек, поиск, пагинация, API      |
| [SCENARIO-BUILDER.md](./FEATURES/SCENARIO-BUILDER.md)                           | Конструктор сценариев, `ScenarioCardSource` |
| [EDITOR-UX.md](./FEATURES/EDITOR-UX.md)                                         | UX редактора карточек (G12)                 |

## Паттерны и архитектура

| Документ                                           | Описание                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| [PATTERN-DIRTY-STATE.md](./PATTERNS/PATTERN-DIRTY-STATE.md) | Паттерн отслеживания несохранённых изменений в формах |
| [MODAL-DIALOG.md](./PATTERNS/MODAL-DIALOG.md)               | Архитектура модальных диалогов                        |

## Контент и локализация

| Документ                                     | Описание                                       |
| -------------------------------------------- | ---------------------------------------------- |
| [CJK-CONTENT.md](./CONTENT/CJK-CONTENT.md)           | Иероглифы, пиньинь, жуинь, Палладия, тоны (G9) |
| [PHONETIC-CONTENT.md](./CONTENT/PHONETIC-CONTENT.md) | IPA и фонетическая транскрипция (G10)          |

## Процесс разработки

| Документ                       | Описание              |
| ------------------------------ | --------------------- |
| [GIT-RULES.md](./SYSTEM/GIT-RULES.md) | Ветки, коммиты, merge |

## Формат

- Кодировка: **UTF-8** (без BOM).
- Язык: **русский** (идентификаторы кода — как в исходниках).

## Быстрая навигация по темам

- **Объект изучения vs карточка (компоненты, затенение известного)** — [BUSINESS.md § Объект и карточка](./BUSINESS.md#объект-изучения-и-карточка)
- **Иерархия Card → Scenario → Lesson → Course** — [DOMAIN.md § Иерархия](./SYSTEM/DOMAIN.md#иерархия-контента) · [BUSINESS.md § Иерархия](./BUSINESS.md#иерархия-учебного-контента)
- **«Курс» vs программа (`Course`)** — [DOMAIN.md § Термины](./SYSTEM/DOMAIN.md#термины-не-путать-курс-и-languagepair) · [LANGUAGE-PAIR.md](./FEATURES/LANGUAGE-PAIR.md)
- **Dashboard `/home` и практика `/cards/select`** — [DOMAIN.md § Learning Home](./SYSTEM/DOMAIN.md#learning-home-g13)
- **Модели TypeScript** — [DOMAIN.md § Модели](./SYSTEM/DOMAIN.md#модели)
- **Уровень подготовки в профиле** — [DOMAIN.md § UserPreferences](./SYSTEM/DOMAIN.md#сущности) · `learning-proficiency.types.ts`
- **Цвета тонов (Dummit 2008)** — [CONTENT/CJK-CONTENT.md § Цветовая маркировка](./CONTENT/CJK-CONTENT.md#цветовая-маркировка-тонов)
- **Структура `src/app`** — [ARCHITECTURE.md § Структура](./ARCHITECTURE.md)
