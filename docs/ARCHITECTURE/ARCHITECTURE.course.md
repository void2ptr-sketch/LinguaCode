# Архитектура: курсы (`course-builder`, `course-catalog`)

Курсы (`Course`) и уроки (`Lesson`). Маршруты `/tools/courses`, `/courses`.

## Назначение

- **course-builder** — CRUD курсов для авторов: создание, редактирование, просмотр, экспорт.
- **course-catalog** — каталог опубликованных курсов для выбора в практике.

## Структура

```text
features/course-builder/     # /tools/courses
├── components/
│   ├── course-builder-dialog/    # dialog создания/редактирования программы
│   ├── course-form/              # форма программы
│   └── reset-overlay-dialog/     # диалог сброса оверлея
├── services/
├── types/
├── utils/
├── models/
└── index.ts

features/course-catalog/     # /courses (published)
├── components/
│   ├── course-card-list/       # список карточек программ
│   ├── course-settings/        # настройки программы
│   └── program-list/           # список программ
├── services/
├── utils/
├── models/
└── index.ts

entities/course/search/          # поиск по курсам
entities/course/model/           # типы курсов и уроков
```

> **Примечание:** `course-builder-page` и `course-catalog-page` — это страницы (pages), а не компоненты фичй. Они расположены в `pages/course-builder/` и `pages/course-catalog/` соответственно и являются точками входа маршрутов `/tools/courses` и `/courses`.

## Иерархия

```mermaid
classDiagram
  class Course {
    +id: string
    +title: string
    +languagePair: LanguagePair
    +published: boolean
  }
  class Lesson {
    +id: string
    +courseId: string
    +scenarioIds: string[]
    +prerequisiteLessonIds: string[]
    +order: number
  }
  class Scenario {
    +id: string
    +cardSource: ScenarioCardSource
  }
  Course "1" --> "*" Lesson : contains
  Lesson "1" --> "*" Scenario : references
```

## Форма курса (`CourseFormComponent`)

Диалог «Редактирование курса» использует `mat-tab-group` с **4 вкладками**:

| Вкладка | Содержание |
|---------|-----------|
| **Основное** | Название каталога, описание, статус авторства, published |
| **Практика** | Режим навигации, requireLessonForScenarios, enforceLessonPrerequisites, allowDifficultyFilter |
| **Идея каталога** | Markdown-поле для описания идеи (authoring.idea) |
| **Экспорт** | PDF (без подсказок / с ответами), JSON (CourseBundle), SCORM/xAPI |

Экспорт вынесен на отдельную вкладку — это операции, а не редактирование данных, поэтому они не влияют на dirty-state формы.

Кнопки экспорта используют горизонтальное расположение: иконка слева, текст справа (`flex-direction: row`).

## Прогресс

- `LearningResult.courseId`, `lessonId` — агрегация в `LearningResultsStore`.
- Prerequisites уроков — `lesson-prerequisites.utils`.

## Связанные документы

- [DOMAIN.md](../PRODUCT/DOMAIN.md#иерархия-контента) · [ARCHITECTURE.home.md](./ARCHITECTURE.home.md)
