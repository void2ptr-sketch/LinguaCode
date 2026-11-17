# Конструктор программ (Program Builder)

> **Статус:** готово. Dialog-based CRUD для программ (треков) внутри курсов. Используется Проводником контента.

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [TASKS.md](../TASKS.md).

## Контекст

Программы (`Program`) — учебные треки внутри курсов: `Course → Program → Lesson → Scenario → Card`.
Ранее имел standalone-страницу, теперь — только dialog, открываемый из Проводника контента.

## Маршрут

| Маршрут           | Компонент                       | Статус                               |
| ----------------- | ------------------------------- | ------------------------------------ |
| `/tools/programs` | ~~ProgramBuilderPageComponent~~ | Удалён, редирект на `/tools/content` |

Диалог открывается из Проводника контента при клике «+ Программа» на course-узле или «Редактировать» на program-узле.

## Компоненты

### ProgramBuilderDialogComponent

Modal dialog для создания и редактирования программ.

| Input  | Тип                        | Назначение                                                        |
| ------ | -------------------------- | ----------------------------------------------------------------- |
| `data` | `ProgramBuilderDialogData` | `{ mode: 'create', courseId? }` или `{ mode: 'edit', programId }` |

| Сигнал  | Тип                        | Назначение                                                            |
| ------- | -------------------------- | --------------------------------------------------------------------- |
| `draft` | `signal<ProgramFormDraft>` | Черновик формы                                                        |
| `dirty` | `computed<boolean>`        | Есть ли несохранённые изменения                                       |
| `title` | `computed<string>`         | «Новая программа» / «Редактирование программы» / «Просмотр программы» |

**Методы:**

- `ngOnInit()` — инициализация: create mode → `store.startCreate()`, edit mode → `store.startEdit()`
- `updateDraft(nextDraft)` — обновление черновика
- `saveProgram()` — сохранение (create или update)
- `cancel()` — отмена с confirm discard

**Конфигурация MatDialog:**

- `panelClass`: `program-builder-dialog`
- `width`: `1100px` (с `maxWidth: 96vw`)
- `maxHeight`: `90vh`
- `disableClose`: `true`
- `autoFocus`: `first-titled-element`

### ProgramFormComponent

Форма программы: название, порядок, courseId.

| Input   | Тип                | Назначение     |
| ------- | ------------------ | -------------- |
| `draft` | `ProgramFormDraft` | Черновик формы |

| Output        | Назначение          |
| ------------- | ------------------- |
| `draftChange` | Изменение черновика |

## Store: ProgramBuilderStore

`@Injectable({ providedIn: 'root' })` — store конструктора программ.

### Состояние

| Сигнал                   | Тип               | Назначение                                   |
| ------------------------ | ----------------- | -------------------------------------------- |
| `editorLoading`          | `boolean`         | Загрузка программы для редактирования        |
| `saving`                 | `boolean`         | Сохранение                                   |
| `error`                  | `string \| null`  | Ошибка                                       |
| `editingProgram`         | `Program \| null` | Редактируемая программа (null в create mode) |
| `editingProgramAuthorId` | `string \| null`  | AuthorId родительского курса                 |

### Derived

| Сигнал       | Тип       | Вычисление                                          |
| ------------ | --------- | --------------------------------------------------- |
| `isReadOnly` | `boolean` | `!isEditableContentAuthor(authorId, userId, roles)` |

### Методы

| Метод                             | Описание                                             |
| --------------------------------- | ---------------------------------------------------- |
| `startCreate(courseId?)`          | Переключение в create mode                           |
| `startEdit(programId)`            | Загрузка программы для редактирования + автор курса  |
| `createProgram(draft)`            | Создание программы → `ProgramsApiService.create()`   |
| `updateProgram(programId, draft)` | Обновление программы → `ProgramsApiService.update()` |

### Form Draft

```typescript
type ProgramFormDraft = {
  title: string;
  order: number;
  courseId: string;
};
```

### Payload mapping

- `formDraftToProgramCreatePayload(draft)` → `ProgramCreatePayload`
- `formDraftToProgramUpdatePayload(draft, lessonIds)` → `ProgramUpdatePayload`
- `validateProgramFormDraft(draft)` → `string \| null` (ошибка валидации)
- `programToFormDraft(program)` → `ProgramFormDraft`
- `emptyProgramFormDraft(courseId?)` → `ProgramFormDraft`
- `serializeProgramFormDraft(draft)` → `string` (для dirty state)

### Slug → Numeric ID resolution

При создании программы slug course ID (`"my-course"`) преобразуется в numeric ID через:

```typescript
const resolvedCourseId = await courseSearch.resolveCourseIdForWrite(courseId);
```

## Зависимости

| Слой              | Зависимости                        |
| ----------------- | ---------------------------------- |
| entities/program  | `ProgramsApiService`, `Program`    |
| entities/course   | `CourseSearchService`              |
| entities/auth     | `AuthStore`                        |
| entities/user     | `isEditableContentAuthor`          |
| shared/ui/dialogs | `CardEditorDiscardDialogComponent` |

## Связанные пути в коде

```
src/app/features/program-builder/
├── components/
│   ├── program-builder-dialog/      # Dialog shell
│   │   ├── program-builder-dialog.component.ts
│   │   └── program-builder-dialog.types.ts
│   └── program-form/                # Форма программы
│       └── program-form.component.ts
├── services/
│   └── program-builder.store.ts     # Store
├── types/
│   └── program-builder.types.ts
├── utils/
│   ├── program-form-draft.utils.ts  # Draft mapping
│   └── program-form-validator.util.ts
└── index.ts
```
