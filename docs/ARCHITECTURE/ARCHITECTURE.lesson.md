# Архитектура: уроки (`Lesson`)

Уроки (`Lesson`) — уровень между `Program` и `Scenario`. Редактирование — модальный диалог `lessons-builder-dialog` (feature-слайс `features/lesson-builder/`), доступен из «Проводника контента» (`/tools/content`).

## Назначение

- **`Lesson`** — учебный урок внутри `Program` (трека). Содержит упорядоченные сценарии (`scenarioIds`) и пререквизиты (`prerequisiteLessonIds`).
- **`Program`** — учебный трек; содержит уроки через `lessonIds` (см. [ARCHITECTURE.program.md](ARCHITECTURE.program.md)).

## Иерархия

```text
Course → Program → Lesson → Scenario → Card
```

- `scenarioIds` **не редактируются** в диалоге уроков — привязка сценариев выполняется в конструкторах курсов/сценариев.
- `prerequisiteLessonIds` хранится в DTO как raw JSON-строка (`'["1","2"]'`); фронтенд парсит её на чтение и сериализует на запись.
- `programId` неизменяем при обновлении (`LessonUpdateRequest` не содержит `programId`).

## Структура

```text
entities/lesson/
├── model/        # (тип Lesson живёт в entities/course/model/lesson.types.ts)
├── lib/          # lesson-prerequisites.utils
├── api/          # LessonsApiService — Promise-обёртка над orval LessonsService
├── ui/           # lesson-picker
└── index.ts      # barrel export

features/lesson-builder/
├── components/
│   ├── lesson-form/            # presentational форма (title, description, order, пререквизиты)
│   └── lesson-builder-dialog/  # dialog CRUD + LessonBuilderDialogService
├── services/
│   └── lesson-builder.store.ts
├── types/        # LessonFormDraft, DialogData/Result
├── utils/        # lesson-form-draft.utils (draft ↔ payload, dirty-state сериализация)
└── index.ts      # public barrel
```

## Отображение DTO ↔ домен (backend ↔ frontend)

| Backend DTO                     | Frontend `Lesson`                 | Преобразование                  |
| ------------------------------- | --------------------------------- | ------------------------------- |
| `id: number`                    | `id: string`                      | `String(id)` / `Number(id)`     |
| `programId: number`             | `programId: string`               | `String(id)` / `Number(id)`     |
| `lessonDescription`             | `description`                     | переименование                  |
| `lessonOrder`                   | `order`                           | переименование                  |
| `prerequisiteLessonIds: string` | `prerequisiteLessonIds: string[]` | `JSON.parse` / `JSON.stringify` |
| `scenarioIds: number[]`         | `scenarioIds: string[]`           | `String` на каждый элемент      |

Числовые ID конвертируются в `LessonsApiService` (`/^\d+$/`-проверка); slug-ID (мок-бэкенд) проходят как есть — паттерн повторяет `ProgramsApiService.create`.

## Read-only доступ

Уроки не имеют собственного `authorId` — права наследуются от автора родительского курса: `lesson.programId → ProgramsApiService.getById → courseId → CourseSearchService.getById → authorId` + `isEditableContentAuthor`. При недоступности курса форма остаётся редактируемой (финальное решение за бэкендом).

## Интеграция

- «Проводник контента»: узел `lesson` → `LessonBuilderDialogService.openEdit(node.id)`; узел `program` → кнопка «+ Урок» → `openCreate(programId)`; после сохранения — `store.refreshNode(node)`.
- Диалог открывается только через сервис (защита от двойного открытия, `panelClass: 'lessons-builder-dialog'`, `width: 48rem`, Promise-результат).

## Связанные документы

- [ARCHITECTURE.program.md](ARCHITECTURE.program.md) · [ARCHITECTURE.content-explorer.md](ARCHITECTURE.content-explorer.md) · [MODAL-DIALOG.md](../PATTERNS/MODAL-DIALOG.md)
