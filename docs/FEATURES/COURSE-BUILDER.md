# Конструктор курсов (Course Builder)

> **Статус:** готово. Dialog-based CRUD для курсов. Используется Проводником контента и standalone-страницей.

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [TASKS.md](../TASKS.md).

## Контекст

Курсы (`Course`) — верхний уровень иерархии: `Course → Program → Lesson → Scenario → Card`.
Конструктор предоставляет полный интерфейс для создания, редактирования и экспорта курсов.

## Маршрут

| Маршрут           | Компонент                       | Статус |
| ----------------- | ------------------------------- | ------ |
| `/tools/courses`  | CourseBuilderPageComponent      | Страница + dialog |

Диалог также открывается из Проводника контента при клике «Редактировать» на course-узле.

## Компоненты

### CourseBuilderDialogComponent

Modal dialog для создания и редактирования курсов.

| Input  | Тип                         | Назначение                                                        |
| ------ | --------------------------- | ----------------------------------------------------------------- |
| `data` | `CourseBuilderDialogData`   | `{ mode: 'create' }` или `{ mode: 'edit', courseId, forceEdit? }` |

| Сигнал     | Тип                       | Назначение                                                                |
| ---------- | ------------------------- | ------------------------------------------------------------------------- |
| `draft`    | `signal<CourseFormDraft>` | Черновик формы                                                            |
| `dirty`    | `computed<boolean>`       | Есть ли несохранённые изменения                                           |
| `title`    | `computed<string>`        | «Новый курс» / «Редактирование курса» / «Просмотр курса»                 |
| `isEditable` | `computed<boolean>`     | Доступно ли редактирование (store.isReadOnly || data.forceEdit)          |

**Методы:**

- `ngOnInit()` — инициализация: create mode → `store.startCreate()`, edit mode → `store.startEdit()`
- `updateDraft(nextDraft)` — обновление черновика
- `saveCourse()` — сохранение (create или update)
- `onExportRequested(type)` — экспорт курса (pdf-without-hints, pdf-with-hints, json, scorm)
- `cancel()` — отмена с confirm discard

**Конфигурация MatDialog:**

- `panelClass`: `course-builder-dialog`
- `width`: `48rem` (с `maxWidth: 96vw`)
- `maxHeight`: `90vh`
- `disableClose`: `true`
- `autoFocus`: `first-titled-element`

### CourseFormComponent

Многовкладочная форма курса с 4 вкладками:

| Вкладка | Содержание |
|---------|-----------|
| **Основное** | Название каталога, описание, статус авторства, published |
| **Практика** | Режим навигации (guided/open), requireLessonForScenarios, enforceLessonPrerequisites, allowDifficultyFilter |
| **Идея каталога** | Markdown-поле для описания идеи курса |
| **Экспорт** | PDF без подсказок, PDF с ответами, JSON (CourseBundle), SCORM/xAPI |

| Input    | Тип                      | Назначение     |
| -------- | ------------------------ | -------------- |
| `draft`  | `CourseFormDraft`        | Черновик формы |
| `readOnly` | `boolean`              | Режим просмотра |

| Output         | Назначение                                              |
| -------------- | ------------------------------------------------------- |
| `draftChange`  | Изменение черновика                                     |
| `exportRequested` | Запрос экспорта: `'pdf-without-hints' \| 'pdf-with-hints' \| 'json' \| 'scorm'` |

**Методы обновления черновика:**

- `updateTitle(value)`, `updateDescription(value)`, `updatePublished(value)`
- `updateAuthoringIdea(value)`, `updateAuthoringStatus(value)`
- `updatePracticeMode(value)`, `updateRequireLessonForScenarios(value)`, `updateEnforceLessonPrerequisites(value)`, `updateAllowDifficultyFilter(value)`
- `onExportPdf(withHints)` — обработка клика по кнопке экспорта PDF

### ResetOverlayDialogComponent

Диалог сброса пользовательских данных курса.

## Store: CourseBuilderStore

`@Injectable({ providedIn: 'root' })` — store конструктора курсов.

### Состояние

| Сигнал                 | Тип                   | Назначение                                     |
| ---------------------- | --------------------- | ---------------------------------------------- |
| `editorLoading`        | `boolean`             | Загрузка курса для редактирования              |
| `saving`               | `boolean`             | Сохранение                                     |
| `error`                | `string \| null`      | Ошибка                                         |
| `editingCourse`        | `CourseWithPrograms \| null` | Редактируемый курс (null в create mode)  |
| `editingCourseAuthorId`| `string \| null`      | AuthorId курса                                 |
| `isReadOnly`           | `boolean`             | Readonly режим (не автор)                      |

### Методы

| Метод                               | Описание                                             |
| ----------------------------------- | ---------------------------------------------------- |
| `startCreate()`                     | Переключение в create mode                           |
| `startEdit(courseId)`               | Загрузка курса для редактирования                    |
| `createCourse(draft)`               | Создание курса → `CoursesApiService.create()`        |
| `updateCourse(courseId, draft)`     | Обновление курса → `CoursesApiService.update()`      |

### Form Draft

```typescript
type CourseFormDraft = {
  title: string;
  description: string;
  authoring: {
    status: CourseAuthoringStatus;
    idea: string;
    ideaUpdatedAt?: string;
    materializedAt?: string;
    lastError?: string;
  };
  published: boolean;
  practiceSettings?: {
    mode: CoursePracticeMode;
    requireLessonForScenarios: boolean;
    enforceLessonPrerequisites: boolean;
    allowDifficultyFilter: boolean;
  };
};
```

### Payload mapping

- `formDraftToCourseCreatePayload(draft)` → `CourseCreatePayload`
- `formDraftToCourseUpdatePayload(draft, programIds, lessonIds, scenarioIds)` → `CourseUpdatePayload`
- `validateCourseFormDraft(draft)` → `string \| null` (ошибка валидации)
- `courseToFormDraft(course)` → `CourseFormDraft`
- `emptyCourseFormDraft()` → `CourseFormDraft`
- `serializeCourseFormDraft(draft)` → `string` (для dirty state)

### Slug → Numeric ID resolution

При создании курса slug course ID (`"my-course"`) преобразуется в numeric ID через:

```typescript
const resolvedCourseId = await courseSearch.resolveCourseIdForWrite(courseId);
```

## Экспорт (`CoursePdfExportService`)

Сервис генерации PDF из курса.

| Метод           | Описание                                      |
| --------------- | --------------------------------------------- |
| `export(course, withHints)` | Генерация PDF с/без подсказок (✓) |

Поддерживаемые типы экспорта:

| Тип | Описание |
| --- | -------- |
| `pdf-without-hints` | PDF без правильных ответов |
| `pdf-with-hints` | PDF с ответами, отмеченными ✓ |
| `json` | CourseBundle JSON (placeholder) |
| `scorm` | SCORM/xAPI пакет (placeholder) |

## Зависимости

| Слой              | Зависимости                         |
| ----------------- | ----------------------------------- |
| entities/course   | `CoursesApiService`, `Course`       |
| entities/program  | `ProgramsApiService`                |
| entities/lesson   | `LessonsApiService`                 |
| entities/scenario | `ScenarioSearchService`             |
| entities/auth     | `AuthStore`                         |
| entities/user     | `isEditableContentAuthor`           |
| shared/ui/dialogs | `CardEditorDiscardDialogComponent`  |
| shared/utils      | `MarkdownFieldComponent`            |

## Связанные пути в коде

```
src/app/features/course-builder/
├── components/
│   ├── course-builder-dialog/       # Dialog shell
│   │   ├── course-builder-dialog.component.ts
│   │   ├── course-builder-dialog.component.html
│   │   ├── course-builder-dialog.component.scss
│   │   ├── course-builder-dialog.service.ts
│   │   └── course-builder-dialog.types.ts
│   ├── course-form/                 # Многовкладочная форма (4 вкладки)
│   │   ├── course-form.component.ts
│   │   ├── course-form.component.html
│   │   └── course-form.component.scss
│   └── reset-overlay-dialog/        # Сброс пользовательских данных
│       ├── reset-overlay-dialog.component.ts
│       └── reset-overlay-dialog.types.ts
├── services/
│   ├── course-builder.store.ts      # Store
│   └── course-pdf-export.service.ts # PDF экспорт
├── types/
│   └── course-builder.types.ts
├── utils/
│   ├── course-form-draft.utils.ts   # Draft mapping
│   └── course-form-validator.util.ts
└── index.ts
```

## Связанные документы

- [ARCHITECTURE.course.md](../ARCHITECTURE/ARCHITECTURE.course.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [MODAL-DIALOG.md](../PATTERNS/MODAL-DIALOG.md)
