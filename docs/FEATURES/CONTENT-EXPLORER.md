# Проводник контента (Content Explorer)

> **Статус:** готово. Единая страница управления контентом (`/tools/content`), объединяющая всю иерархию `Course → Program → Lesson → Scenario → Card`.
> **Миграция:** заменил standalone-страницы `course-builder`, `scenario-builder`, `program-builder` — маршруты редиректят на `/tools/content`.

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [ARCHITECTURE.content-explorer.md](../ARCHITECTURE/ARCHITECTURE.content-explorer.md) · [TASKS.md](../TASKS.md).

## Контекст

До миграции каждый уровень иерархии имел собственную standalone-страницу:

- `/tools/courses` — конструктор курсов
- `/tools/scenario-builder` — конструктор сценариев (перенаправлен на `/tools/content`)
- `/tools/programs` — конструктор программ (перенаправлен на `/tools/content`)

**Проводник контента** объединяет все операции CRUD в одном UI: дерево слева, детали справа, диалоги билдеров открываются из detail-панели.

## Маршрут и доступ

| Маршрут          | Компонент                      | Роль                                         |
| ---------------- | ------------------------------ | -------------------------------------------- |
| `/tools/content` | `ContentExplorerPageComponent` | `authorGuard` (`ROLE_AUTHOR` / `ROLE_ADMIN`) |

Пункты меню: «Проводник контента» в `sidebar-nav-config.ts` и `menu-tools.component`.

## Архитектура страницы

```
ContentExplorerPageComponent
├── ExplorerTreeComponent (левая панель)
│   ├── Поиск по контенту (signal-based filter)
│   ├── Фильтр по языковым парам (чипы)
│   └── ExplorerTreeNodeComponent (рекурсивное дерево)
└── ExplorerDetailComponent (правая панель)
    ├── Breadcrumbs
    ├── Мета-информация
    ├── Actions (edit, add, export, delete)
    └── Card usages (где используется)
```

## Компоненты

### ExplorerTreeComponent

Левая панель: поиск, фильтр по языковым парам, список курсов-корней.

| Поле                | Тип                        | Назначение                            |
| ------------------- | -------------------------- | ------------------------------------- |
| `filterQuery`       | `signal<string>`           | Текстовый поиск по заголовкам узлов   |
| `selectedPairKeys`  | `signal<Set<string>>`      | Отфильтрованные языковые пары         |
| `availablePairKeys` | `computed<Set<string>>`    | Уникальные пары из загруженных курсов |
| `visibleRoots`      | `computed<ExplorerNode[]>` | Корни после применения фильтров       |

**Методы:**

- `setFilter(query: string)` — обновление поискового запроса
- `onRefresh()` — перезагрузка корней (`store.loadRoots()`)
- `togglePair(key: string)` — переключение чипа языковой пары
- `isPairSelected(key: string)` — проверка статуса чипа

### Поиск по контенту

Поиск идёт по всем уровням иерархии `Course → Program → Lesson → Scenario` и карточкам:

1. Совпадения по названиям **уже загруженных** курсов/треков/уроков/сценариев
   фильтруются локально (`collectTitleMatches`) — без дополнительных запросов.
2. Курсы, треки и сценарии дополнительно ищутся на бэкенде:
   - `/courses/search` (`CourseSearchService.search({ query, scope: 'all' })`) —
     курсы за пределами первой страницы корней добавляются в `roots`;
   - `/programs/search` (`ProgramsApiService.search({ query })`) — трек привязывается
     к курсу по `ProgramIndexEntry.courseId`;
   - `/scenarios/search` (`ScenarioSearchService.search({ query, scope: 'all' })`) —
     `ScenarioIndexEntry.courseId` даёт курс, урок находится по `lesson.scenarioIds`
     одним запросом `getByCourse`, полные данные сценария — `getByIdBatch`.
3. Карточки ищутся одним запросом `/cards/search`. Каждый результат карточки содержит
   `courseId` / `lessonId` / `scenarioId`; по этим ID догружаются только недостающие
   узлы-предки (курс → трек → урок → сценарий), без полной индексации каталога.
4. Результат — **интерактивное дерево**, а не плоский список:
   - совпадения (`searchMatchedKeys`) сохраняют кнопку разворота и при раскрытии
     показывают **всех** детей (ленивая загрузка как в обычном дереве);
   - предки совпадений (`searchAncestorKeys`) раскрываются автоматически и показывают
     только ветку до совпадения;
   - узлы без родителя попадают в виртуальные корни «Карточки вне сценариев» и
     «Сценарии вне уроков».

Состояние поиска: `searchVisibleKeys`, `searchMatchedKeys`, `searchAncestorKeys`,
`searchExtraChildren`, `searchResultRoots`; сброс — `clearSearch()`. Debounce 300 мс,
устаревшие ответы отбрасываются по монотонному `searchSequence`; таймер очищается
при уничтожении компонента.

### ExplorerTreeNodeComponent

Рекурсивный компонент узла дерева. Рендерит строку (иконка, заголовок, мета, бейджи) и дочерние узлы через саморекурсию.

| Input           | Тип            | Назначение                                       |
| --------------- | -------------- | ------------------------------------------------ |
| `node`          | `ExplorerNode` | Узел для рендера                                 |
| `depth`         | `number`       | Уровень вложенности (отступ)                     |
| `searchSubtree` | `boolean`      | Узел внутри раскрытого поддерева найденного узла |

**Поведение:**

- `hasChildren` — карточки и виртуальные узлы без детей — листья; в режиме поиска
  у найденного узла кнопка разворота остаётся
- `isSearchMatch` — узел совпал сам; при раскрытии показывает всех детей
- `filteredSearchMode` — поиск активен и узел является предком-контекстом (не
  совпадение и не внутри поддерева совпадения): ветка обрезается до пути совпадений,
  кнопка разворота скрыта, дети раскрыты автоматически
- Клик по строке → `store.selectNode(node)`
- Клик по expand/collapse → `store.toggleNode(node)` (lazy-loading детей)

### ExplorerDetailComponent

Правая панель: детали выбранного узла, breadcrumbs, кнопки действий. **Презентабельный компонент** — эмитит intent-события, оркестрация диалогов — в page-компоненте (FSD запрещает cross-feature импорты).

| Input               | Тип                            | Назначение                         |
| ------------------- | ------------------------------ | ---------------------------------- |
| `acting`            | `boolean`                      | Busy-состояние (диалог в процессе) |
| `cardUsages`        | `ScenarioIndexEntry[] \| null` | «Где используется» для карточек    |
| `cardUsagesLoading` | `boolean`                      | Загрузка backlinks                 |
| `cardKind`          | `string`                       | Kind карточки для create-action    |

| Output                        | Назначение                   |
| ----------------------------- | ---------------------------- |
| `editRequested`               | Редактировать узел           |
| `addProgramRequested`         | + Программа (контекст курса) |
| `addLessonRequested`          | + Урок (контекст трека)      |
| `addScenarioRequested`        | + Сценарий (контекст урока)  |
| `showUsagesRequested`         | Где используется карточка    |
| `exportPdfRequested`          | PDF без подсказок            |
| `exportPdfWithHintsRequested` | PDF с подсказками            |
| `exportJsonRequested`         | JSON (CourseBundle)          |
| `exportScormRequested`        | SCORM/xAPI-пакет             |
| `deleteRequested`             | Удалить курс                 |
| `deleteScenarioRequested`     | Удалить сценарий             |
| `deleteProgramRequested`      | Удалить программу            |
| `deleteLessonRequested`       | Удалить урок                 |
| `createCardRequested`         | Создать карточку             |
| `deleteCardRequested`         | Удалить карточку             |

**Computed свойства:**

- `kindIcon` / `kindLabel` — иконка и метка типа узла
- `breadcrumbs` — путь от корня до узла
- `canEdit` — можно ли редактировать (не virtual, для scenario — только own)
- `canManageCourse` — можно ли управлять курсом (ownership)
- `canEditOwnScenario` — можно ли удалить сценарий (ownership)

## Store: ContentExplorerStore

`@Injectable({ providedIn: 'root' })` — единый store проводника.

### Состояние

| Сигнал         | Тип                       | Назначение            |
| -------------- | ------------------------- | --------------------- |
| `roots`        | `readonly ExplorerNode[]` | Корневые узлы (курсы) |
| `loading`      | `boolean`                 | Загрузка корней       |
| `error`        | `string \| null`          | Ошибка загрузки       |
| `selectedId`   | `string \| null`          | ID выбранного узла    |
| `selectedNode` | `ExplorerNode \| null`    | Выбранный узел        |

### ExplorerNode

Класс-обёртка над узлом дерева. Каждый узел — независимый signal-объект.

| Поле              | Тип                              | Назначение                                                                                 |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `kind`            | `ExplorerNodeKind`               | `'course' \| 'program' \| 'lesson' \| 'scenario' \| 'card'`                                |
| `id`              | `string`                         | ID сущности                                                                                |
| `key`             | `string`                         | Уникальный ключ: `${kind}:${id}` (избегает коллизий ID)                                    |
| `parentId`        | `string \| null`                 | Ключ родителя                                                                              |
| `title`           | `signal<string>`                 | Заголовок                                                                                  |
| `meta`            | `signal<string>`                 | Вторичная строка (счётчики, пара, статус)                                                  |
| `children`        | `signal<ExplorerNode[] \| null>` | Дети: `null` = не загружены, `[]` = лист                                                   |
| `expanded`        | `signal<boolean>`                | Раскрыт ли узел                                                                            |
| `loadingChildren` | `signal<boolean>`                | Загрузка детей                                                                             |
| `childError`      | `signal<string \| null>`         | Ошибка загрузки детей                                                                      |
| `editable`        | `boolean`                        | Можно ли редактировать                                                                     |
| `shared`          | `boolean`                        | Карточка используется в нескольких сценариях                                               |
| `virtual`         | `boolean`                        | Виртуальный узел (не сущность)                                                             |
| `data`            | `unknown`                        | Сущность: `CourseIndexEntry`, `ProgramWithLessons`, `Lesson`, `Scenario`, `CardIndexEntry` |

### Методы Store

| Метод                  | Описание                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `loadRoots()`          | Загрузка курса через `CourseSearchService.search({ scope: 'all' })`                        |
| `selectNode(node)`     | Выбор узла для detail-панели                                                               |
| `clearSelection()`     | Сброс выделения                                                                            |
| `toggleNode(node)`     | Раскрытие/сворачивание (lazy-loading)                                                      |
| `loadChildren(node)`   | Загрузка детей по kind: course→programs, program→lessons, lesson→scenarios, scenario→cards |
| `refreshNode(node)`    | Перезагрузка узла после редактирования                                                     |
| `reveal(target)`       | Deep-link: авто-раскрытие цепочки `courseId→programId→lessonId→scenarioId→cardId`          |
| `getByKey(key)`        | Поиск узла по уникальному ключу                                                            |
| `pathOf(node)`         | Путь от корня до узла (breadcrumbs)                                                        |
| `parentCourseOf(node)` | Ближайший родитель-курс                                                                    |

### Lazy-loading детей

| Родитель | Источник детей                               | Метод                    |
| -------- | -------------------------------------------- | ------------------------ |
| course   | `CourseSearchService.getById()` → `programs` | `loadProgramChildren()`  |
| program  | `ProgramsApiService.getByCourse()` (batch)   | `loadLessonChildren()`   |
| lesson   | `ScenarioSearchService.getByIdBatch()`       | `loadScenarioChildren()` |
| scenario | Card index + fallback lookups                | `loadCardChildren()`     |

**Оптимизации:**

- `attachLessons()` — батч-запрос `getByCourse()` вместо N запросов `GET /programs/:id`
- Card index кэшируется через `CardSearchService.ensureIndexLoaded()`
- Fallback: `MAX_CARD_FALLBACK_LOOKUPS = 20` per-card lookups при miss индекса

## Оркестрация (ContentExplorerPageComponent)

Page-компонент — orchestrator: открывает диалоги билдеров, обновляет дерево после изменений.

### CRUD-операции

| Действие      | Узел     | Сервис                                                                 | Обновление                               |
| ------------- | -------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| Редактировать | course   | `CourseBuilderDialogService.openEdit()`                                | `store.refreshNode()`                    |
| Редактировать | program  | `ProgramBuilderDialogService.openEdit()`                               | `store.refreshNode()`                    |
| Редактировать | lesson   | `LessonBuilderDialogService.openEdit()`                                | `store.refreshNode()`                    |
| Редактировать | scenario | `ScenarioBuilderDialogService.openEdit()`                              | `store.refreshNode()`                    |
| Редактировать | card     | `CardEditorDialogService.openEdit()`                                   | `store.refreshNode(parentScenario)`      |
| Создать       | program  | `ProgramBuilderDialogService.openCreate(courseId)`                     | `store.refreshNode(courseNode)`          |
| Создать       | lesson   | `LessonBuilderDialogService.openCreate(programId)`                     | `store.refreshNode(programNode)`         |
| Создать       | scenario | `ScenarioBuilderDialogService.openCreate()` + `bindScenarioToLesson()` | `store.refreshNode(lessonNode)` + select |
| Создать       | card     | `CardEditorDialogService.openCreate(kind)`                             | `store.refreshNode(parentScenario)`      |

### Привязка сценария к уроку

```typescript
// bindScenarioToLesson() — точечный PUT курса
const course = await courseSearchService.getById(courseNodeId);
const payload = appendScenarioToLessonPayload(
  courseWithProgramsToWritePayload(course),
  lessonNodeId,
  scenarioId,
);
await courseSearchService.update(courseNodeId, payload);
```

### Удаление

Каждое удаление с подтверждением через `MatDialog` confirm-dialog:

| Узел     | Confirm Dialog                | API                                                                    | Каскад                                   |
| -------- | ----------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| course   | `CourseDeleteConfirmDialog`   | `courseBuilderStore.deleteCourse()`                                    | Перезагрузка корней                      |
| program  | `ProgramDeleteConfirmDialog`  | `ProgramsApiService.delete()`                                          | `store.refreshNode(parentCourse)`        |
| lesson   | `LessonDeleteConfirmDialog`   | `LessonsApiService.delete()`                                           | `store.refreshNode(programNode)`         |
| scenario | `ScenarioDeleteConfirmDialog` | `scenarioBuilderStore.deleteScenario()` + `unbindScenarioFromLesson()` | Каскад: удаление из `lesson.scenarioIds` |
| card     | `CardDeleteConfirmDialog`     | `cardEditorStore.deleteCard()`                                         | `store.refreshNode(parentScenario)`      |

### Экспорт курсов

| Экспорт             | Метод                                       | Результат                 |
| ------------------- | ------------------------------------------- | ------------------------- |
| PDF без подсказок   | `courseBuilderStore.exportPdf(id, false)`   | Скачивание PDF            |
| PDF с подсказками   | `courseBuilderStore.exportPdf(id, true)`    | Скачивание PDF            |
| JSON (CourseBundle) | `courseBuilderStore.exportCourseBundle(id)` | `.linguacode-course.json` |
| SCORM/xAPI          | `scormExportService.export(id)`             | `*.scorm.json`            |

### Каталог сценариев

Inline-панель в header-зоне страницы:

- **Scope-тумблер**: «Мои / Опубликованные / Все» (`mine` / `published` / `all`)
- **Пагинация**: `UiPaginationComponent`
- **Создать**: `scenarioBuilderDialog.openCreate()` (без привязки к уроку)
- **Редактировать**: `scenarioBuilderDialog.openEdit(scenarioId)`
- Список перезагружается при открытии панели

### Deep links

```text
/tools/content?courseId=…&programId=…&lessonId=…&scenarioId=…&cardId=…
```

Парсы `queryParamMap` → `store.reveal({ courseId, programId, lessonId, scenarioId, cardId })` — авто-раскрытие цепочки и выбор узла.

## Зависимости

| Слой              | Зависимости                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| entities/course   | `CourseSearchService`, `CourseWritePayload` utils, `CourseBuilderStore`, `ScormExportService`         |
| entities/program  | `ProgramsApiService`, `ProgramWithLessons`                                                            |
| entities/lesson   | `LessonsApiService`, `Lesson`                                                                         |
| entities/scenario | `ScenarioSearchService`, `ScenarioBuilderStore`, `ScenarioBuilderDialogService`, `ScenarioIndexEntry` |
| entities/card     | `CardSearchService`, `CardEditorStore`, `CardEditorDialogService`                                     |
| entities/auth     | `AuthStore` (ownership check)                                                                         |
| entities/user     | `isEditableContentAuthor`                                                                             |
| shared/logger     | `AppLoggerService`                                                                                    |
| shared/utils      | `UiPaginationComponent`                                                                               |

## Связанные пути в коде

```
src/app/features/content-explorer/
├── components/
│   ├── explorer-tree/              # Левая панель: поиск + дерево
│   │   ├── explorer-tree.component.ts
│   │   └── explorer-tree.component.html
│   ├── explorer-tree-node/         # Рекурсивный узел дерева
│   │   └── explorer-tree-node.component.ts
│   └── explorer-detail/            # Правая панель: детали + действия
│       └── explorer-detail.component.ts
├── services/
│   └── content-explorer.store.ts   # Store + ExplorerNode
├── types/
│   └── content-explorer.types.ts   # ExplorerNodeKind, ExplorerRevealTarget
└── index.ts

src/app/pages/content-explorer/content-explorer-page/
├── content-explorer-page.component.ts      # Orchestrator
├── content-explorer-page.component.html
├── course-delete-confirm-dialog.component.ts
├── scenario-delete-confirm-dialog.component.ts
├── program-delete-confirm-dialog.component.ts
├── lesson-delete-confirm-dialog.component.ts
└── card-delete-confirm-dialog.component.ts
```
