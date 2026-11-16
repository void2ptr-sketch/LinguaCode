# Конструктор уроков (Lesson Builder)

> **Статус:** готово. Dialog-based CRUD для уроков внутри программ. Используется Проводником контента.

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [TASKS.md](../TASKS.md).

## Контекст

Уроки (`Lesson`) — часть иерархии `Course → Program → Lesson → Scenario → Card`.
Ранее имел standalone-страницу, теперь — только dialog, открываемый из Проводника контента.

## Маршрут

| Маршрут          | Компонент                      | Статус                               |
| ---------------- | ------------------------------ | ------------------------------------ |
| `/tools/lessons` | ~~LessonBuilderPageComponent~~ | Удалён, редирект на `/tools/content` |

Диалог открывается из Проводника контента при клике «+ Урок» на program-узле или «Редактировать» на lesson-узле.

## Компоненты

### LessonBuilderDialogComponent

Modal dialog для создания и редактирования уроков.

| Input  | Тип                       | Назначение                                                        |
| ------ | ------------------------- | ----------------------------------------------------------------- |
| `data` | `LessonBuilderDialogData` | `{ mode: 'create', programId? }` или `{ mode: 'edit', lessonId }` |

| Сигнал  | Тип                       | Назначение                                               |
| ------- | ------------------------- | -------------------------------------------------------- |
| `draft` | `signal<LessonFormDraft>` | Черновик формы                                           |
| `dirty` | `computed<boolean>`       | Есть ли несохранённые изменения                          |
| `title` | `computed<string>`        | «Новый урок» / «Редактирование урока» / «Просмотр урока» |

**Методы:**

- `ngOnInit()` — инициализация: create mode → `store.startCreate()`, edit mode → `store.startEdit()`
- `updateDraft(nextDraft)` — обновление черновика
- `saveLesson()` — сохранение (create или update)
- `cancel()` — отмена с confirm discard

**Списки селекторов «Размещение»:**

- «Курс» — все курсы (`CourseSearchService.search({ scope: 'all' })`) без фильтра
  по активной языковой паре.
- «Программа» — все программы выбранного курса
  (`ProgramsApiService.getByCourse(courseId)`), а не только редактируемая.
  Если бэкенд не вернул текущую программу, она добавляется в список принудительно.

**Конфигурация MatDialog:**

- `panelClass`: `lesson-builder-dialog`
- `width`: `1100px` (с `maxWidth: 96vw`)
- `maxHeight`: `90vh`
- `disableClose`: `true`
- `autoFocus`: `first-titled-element`

### LessonFormComponent

Форма урока: поля названия, порядка, prerequisite lessons.

| Input   | Тип               | Назначение     |
| ------- | ----------------- | -------------- |
| `draft` | `LessonFormDraft` | Черновик формы |

| Output        | Назначение          |
| ------------- | ------------------- |
| `draftChange` | Изменение черновика |

## Store: LessonBuilderStore

`@Injectable({ providedIn: 'root' })` — store конструктора уроков.

### Состояние

| Сигнал                  | Тип                 | Назначение                              |
| ----------------------- | ------------------- | --------------------------------------- |
| `editorLoading`         | `boolean`           | Загрузка урока для редактирования       |
| `saving`                | `boolean`           | Сохранение                              |
| `error`                 | `string \| null`    | Ошибка                                  |
| `editingLesson`         | `Lesson \| null`    | Редактируемый урок (null в create mode) |
| `editingLessonAuthorId` | `string \| null`    | AuthorId родительского курса            |
| `candidateLessons`      | `readonly Lesson[]` | Кандидаты в prerequisite                |

### Derived

| Сигнал       | Тип       | Вычисление                                          |
| ------------ | --------- | --------------------------------------------------- |
| `isReadOnly` | `boolean` | `!isEditableContentAuthor(authorId, userId, roles)` |

### Методы

| Метод                                               | Описание                                        |
| --------------------------------------------------- | ----------------------------------------------- |
| `startCreate(programId?)`                           | Переключение в create mode                      |
| `startEdit(lessonId)`                               | Загрузка урока для редактирования + автор курса |
| `createLesson(draft)`                               | Создание урока → `LessonsApiService.create()`   |
| `updateLesson(lessonId, draft)`                     | Обновление урока → `LessonsApiService.update()` |
| `loadCandidateLessons(programId, excludeLessonId?)` | Загрузка кандидатов в prerequisite              |

### Form Draft

```typescript
type LessonFormDraft = {
  title: string;
  order: number;
  programId: string;
  prerequisiteLessonIds?: string[];
};
```

### Payload mapping

- `formDraftToLessonCreatePayload(draft)` → `LessonCreatePayload`
- `formDraftToLessonUpdatePayload(draft)` → `LessonUpdatePayload`
- `validateLessonFormDraft(draft)` → `string \| null` (ошибка валидации)
- `lessonToFormDraft(lesson)` → `LessonFormDraft`
- `emptyLessonFormDraft(programId?)` → `LessonFormDraft`
- `serializeLessonFormDraft(draft)` → `string` (для dirty state)

## Зависимости

| Слой              | Зависимости                        |
| ----------------- | ---------------------------------- |
| entities/lesson   | `LessonsApiService`, `Lesson`      |
| entities/program  | `ProgramsApiService`               |
| entities/course   | `CourseSearchService`              |
| entities/auth     | `AuthStore`                        |
| entities/user     | `isEditableContentAuthor`          |
| shared/ui/dialogs | `CardEditorDiscardDialogComponent` |

## Связанные пути в коде

```
src/app/features/lesson-builder/
├── components/
│   ├── lesson-builder-dialog/       # Dialog shell
│   │   ├── lesson-builder-dialog.component.ts
│   │   └── lesson-builder-dialog.types.ts
│   └── lesson-form/                 # Форма урока
│       └── lesson-form.component.ts
├── services/
│   └── lesson-builder.store.ts      # Store
├── types/
│   └── lesson-builder.types.ts
├── utils/
│   ├── lesson-form-draft.utils.ts   # Draft mapping
│   └── lesson-form-validator.util.ts
└── index.ts
```
