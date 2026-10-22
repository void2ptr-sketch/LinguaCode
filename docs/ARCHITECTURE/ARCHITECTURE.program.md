# Архитектура: учебные треки (`Program`)

Учебные треки (`Program`) — уровень между `Course` и `Lesson`. Маршруты `/tools/courses` (вложенный редактор программ).

## Назначение

- **`Program`** — учебный трек / модуль внутри `Course`. Содержит упорядоченный список уроков (`lessonIds`).
- **`Course`** — каталог программ: `LanguagePair`, `published`, `authoring`. Не содержит уроков напрямую.

## Иерархия

```text
Course → Program → Lesson → Scenario → Card
```

```mermaid
classDiagram
  class Course {
    +id: string
    +title: string
    +languagePair: LanguagePair
    +programIds: string[]
    +published: boolean
    +authoring?: CourseAuthoring
  }
  class Program {
    +id: string
    +courseId: string
    +title: string
    +description: string
    +lessonIds: string[]
    +order: number
  }
  class Lesson {
    +id: string
    +programId: string
    +title: string
    +scenarioIds: string[]
    +prerequisiteLessonIds: string[]
    +order: number
  }
  class Scenario {
    +id: string
    +cardSource: ScenarioCardSource
  }
  Course "1" --> "*" Program : contains
  Program "1" --> "*" Lesson : references
  Lesson "1" --> "*" Scenario : references
```

## Структура

```text
entities/program/
├── model/            # типы программ (program.types.ts, program-ids.ts)
├── repository/       # ProgramCatalogPort
├── api/              # ProgramsApiService, mock handlers
├── search/           # ProgramSearchService
├── ui/               # program-picker, program-list
└── index.ts          # barrel export

features/program-builder/
├── components/
│   ├── program-form/           # форма программы
│   └── program-builder-dialog/ # dialog CRUD
├── services/
│   └── program-builder.store.ts
├── types/
└── index.ts
```

## Прогресс

- `LearningResult.programId` — агрегация в `LearningResultsStore`.
- `LearningSessionPreferences.activeProgramId?` — сохранение текущего трека.
- `LearningDashboardService` — загрузка программы, roadmap уроков, resume target.

## Отличие от Course

| Свойство       | `Course`            | `Program`                   |
| -------------- | ------------------- | --------------------------- |
| Роль           | Каталог / категория | Учебный трек / модуль       |
| `LanguagePair` | Да (scope контента) | Нет (наследуется от Course) |
| `published`    | Да                  | Нет                         |
| `authoring`    | Да (G16)            | Нет                         |
| Содержит       | `programIds`        | `lessonIds`                 |
| UI-название    | «Каталог программ»  | «Трек» / «Модуль»           |

## Связанные документы

- [DOMAIN.md](./COMMON/DOMAIN.md#иерархия-контента) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [TASKS.md](../TASKS.md)
