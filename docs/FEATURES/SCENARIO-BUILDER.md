# Конструктор сценариев (масштабирование)

> **Статус:** миграция в «Проводник контента» выполнена (см. [crisp-tiger-plan-scenario.md](../../crisp-tiger-plan-scenario.md), этапы 1–7). Отдельная страница `/tools/scenario-builder` удалена, маршрут редиректит на `/tools/content`; feature-слайс `features/scenario-builder/` сохранён (общий диалог, store и form-утилиты используются Проводником). Управление сценариями — в Проводнике контента: дерево (`/tools/content`) + «Каталог сценариев» (см. [ARCHITECTURE.content-explorer.md](../ARCHITECTURE/ARCHITECTURE.content-explorer.md)).

Переход от legacy `localStorage`-ключей к каталогу сценариев (seed + overlay) и точечной загрузке карточек при прохождении. Редактор — общий диалог (`features/scenario-builder/`), использующийся Проводником контента.

Связанные документы: [INDEX.md](../INDEX.md) · [BUSINESS.md](../PRODUCT/BUSINESS.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [ARCHITECTURE.program.md](../ARCHITECTURE/ARCHITECTURE.program.md) · [CARD-CATALOG.md](../COMMON/CARD-CATALOG.md) · [ARCHITECTURE.content-explorer.md](../ARCHITECTURE/ARCHITECTURE.content-explorer.md).

## Контекст иерархии

Сценарии (`Scenario`) — часть цепочки `Card → Scenario → Lesson → Program → Course`. При выборе сценариев для урока учитывается:

- **`Course`** — каталог программ (scope: `LanguagePair`, `published`)
- **`Program`** — учебный трек внутри `Course` (содержит `lessonIds`)
- **`Lesson`** — урок внутри трека (содержит `scenarioIds`)
- **`Scenario`** — сценарий внутри урока (содержит `cardSource`)

Picker сценариев в конструкторе уроков (`ScenarioPickerComponent`) фильтрует по активной `LanguagePair` (G8 scope). Сценарий может входить в несколько уроков и программ.

## Решение: индекс сценария + полный Scenario

| Слой      | Тип                                      | Назначение                                                             |
| --------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| Каталог   | `ScenarioIndexEntry`                     | id, title, authorId, cardSourceSummary, courseId, published, updatedAt |
| Детали    | `Scenario`                               | title, description, `cardSource`, `published`, `updatedAt`             |
| Поиск     | `ScenarioSearchCriteria` + `PageRequest` | query, scope, courseId + пагинация                                     |
| Ответ API | `PageResponse<ScenarioIndexEntry>`       | items + totalItems + totalPages                                        |

Полный `Scenario` запрашивается по `id` только при открытии диалога редактора или прохождении.

## ScenarioCardSource

```typescript
type ScenarioCardSort = 'updatedAt' | 'difficulty' | 'random';

type ScenarioCardSource =
  | { mode: 'fixed'; cardIds: readonly string[] }
  | {
      mode: 'criteria';
      criteria: Omit<CardSearchCriteria, 'page'>;
      limit?: number;
      sort?: ScenarioCardSort;
      seed?: string;
    }
  | {
      mode: 'snapshot';
      cardIds: readonly string[];
      criteria: Omit<CardSearchCriteria, 'page'>;
      limit?: number;
      frozenAt: string;
    };
```

- **criteria** — live-набор (пересчитывается при прохождении).
- **snapshot** — зафиксированный набор (`frozenAt`); в store есть метод `ScenarioBuilderStore.buildSnapshotFromCriteria`, но кнопка «Зафиксировать snapshot» в UI редактора сейчас отсутствует.

## HTTP API

| Метод  | Путь                             | Назначение                                   |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/api/scenarios/search?...`      | index + фильтры + пагинация                  |
| GET    | `/api/scenarios/:id`             | полный `Scenario`                            |
| POST   | `/api/scenarios`                 | создание                                     |
| PUT    | `/api/scenarios/:id`             | обновление                                   |
| DELETE | `/api/scenarios/:id`             | удаление                                     |
| GET    | `/api/scenarios/by-card/:cardId` | сценарии, использующие карточку              |
| POST   | `/api/cards/batch`               | `{ ids: string[] }` → `Card[]` (прохождение) |

Mock в dev: `useScenariosApiMock: true`, `scenariosApiMockInterceptor` + `ScenariosCatalogMockHandler` (overlay + seed через `UserContentOverlay`, миграция из legacy ключей).

## Multi-user (mock)

| Возможность | Реализация                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Scope       | `mine` · `published` · `all` в `ScenarioSearchCriteria`                                              |
| Публикация  | поле `Scenario.published`; toggle в UI редактора отсутствует (см. [Черновик формы](#черновик-формы)) |
| Read-only   | чужой сценарий — просмотр без save/delete                                                            |
| Валидация   | `validateScenarioCardSource` в mock handler                                                          |
| 403         | PUT/DELETE чужого сценария                                                                           |

## UI — управление сценариями

### Проводник контента — `/tools/content`

Управление сценариями происходит в **Проводнике контента** (маршрут под `authorGuard`):

- **Дерево** (`Course → Program → Lesson → Scenario → Card`):
  - «+ Сценарий» на узле урока — создание через общий диалог; после сохранения сценарий привязывается к уроку (точечный PUT курса через `courseWithProgramsToWritePayload` + `appendScenarioToLessonPayload`) и сразу появляется дочерним узлом в дереве; ошибка привязки некритична (сценарий сохранён);
  - «Редактировать» / «Добавить карточку» на scenario-узле — общий диалог;
  - «Удалить» на scenario-узле — только для своих сценариев, **с confirm-диалогом**; после удаления — защитный каскад (id убирается из `lesson.scenarioIds` через PUT курса) и обновление дерева;
  - бейдж «Опубликован» / «Черновик» в detail-панели scenario-узла;
  - сценарии урока грузятся по `lesson.scenarioIds` без пагинации (осознанное ограничение).
- **«Каталог сценариев»** (inline-панель в header): scope-тумблер **«Мои / Опубликованные / Все»** (`mine` / `published` / `all`, по умолчанию `mine`), пагинация (`UiPaginationComponent`), кнопка **«Создать сценарий»** (`openCreate` без привязки) и **«Редактировать»** (`openEdit`) через общий диалог. Список перезагружается при открытии панели. Поиска и фильтра-чипов по курсам нет (осознанное упрощение; поиск покрыт фильтром дерева).

Доступ: маршрут под `authorGuard` (`app.routes.ts`), пункты сайдбара и `menu-tools` — «Проводник контента», роли `ROLE_AUTHOR` / `ROLE_ADMIN` (`sidebar-nav-config.ts`). Старый маршрут `/tools/scenario-builder` редиректит на `/tools/content`.

### Обучение — `/cards/select`

- `ScenarioPickerComponent` — search + paginator;
- загрузка карточек через `POST /cards/batch`;
- подпись источника в заголовке сессии.

## Dialog редактора

Create / edit / view в modal (аналог [CARD-CATALOG.md — Dialog](../COMMON/CARD-CATALOG.md#dialog-редактора)); открывается из Проводника контента.

| Элемент         | Путь                                                            |
| --------------- | --------------------------------------------------------------- |
| Shell dialog    | `features/scenario-builder/components/scenario-builder-dialog/` |
| Открытие        | `ScenarioBuilderDialogService.openCreate` / `openEdit`          |
| Форма           | `ScenarioEditorFormComponent`                                   |
| Discard confirm | `CardEditorDiscardDialogComponent` (reuse)                      |

### Решение

| Слой        | Компонент                                                  | Назначение                                                      |
| ----------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Оркестрация | страница Проводника (`content-explorer-page.component.ts`) | вызов диалога из дерева и «Каталога сценариев», привязка/каскад |
| Dialog      | `ScenarioBuilderDialogComponent`                           | shell: title, loading, errors, actions                          |
| Форма       | `ScenarioEditorFormComponent`                              | поля «Название», «Описание», «Известный язык», «Новый язык»     |
| Сервис      | `ScenarioBuilderDialogService`                             | `openCreate`, `openEdit`                                        |
| Store       | `ScenarioBuilderStore`                                     | CRUD-логика, валидация, каталог (scope + пагинация)             |

```typescript
type ScenarioBuilderDialogData = { mode: 'create' } | { mode: 'edit'; scenarioId: string };

type ScenarioBuilderDialogResult = {
  saved: boolean;
  /** ID созданного/обновлённого сценария (только при saved: true). */
  scenarioId?: string;
};
```

`ScenarioBuilderStore.createScenario(draft)` возвращает созданный `Scenario | null`
(не `boolean`) — id нужен странице Проводника для привязки сценария к уроку.
`ScenarioBuilderStore.deleteScenario(scenarioId, entry?)` принимает опциональный
`ScenarioIndexEntry` из данных узла дерева: владение проверяется по нему, иначе
по текущей странице списка, иначе — `getById` fallback (fail-safe).

### Форма редактора

Текущая форма (`ScenarioEditorFormComponent`) содержит ровно **4 поля**:

| Поле             | Тип                   | Поведение                       |
| ---------------- | --------------------- | ------------------------------- |
| «Название»       | `input`               | пишет в `draft().title`         |
| «Описание»       | `textarea` (3 строки) | пишет в `draft().description`   |
| «Известный язык» | `mat-select`          | `draft().languagePair.known`    |
| «Новый язык»     | `mat-select`          | `draft().languagePair.learning` |

- валидация: «Языки должны отличаться» (`languagePairInvalid()` — `known === learning`);
- в read-only все поля disabled + подпись «Чужой сценарий — только просмотр.»;
- поля `published`, `sourceMode`, `fixedCardIds` и др. в форме **не представлены** — см. [Черновик формы](#черновик-формы).

### Режимы dialog

| Режим        | Заголовок           | Save | Discard confirm |
| ------------ | ------------------- | ---- | --------------- |
| create       | «Новый сценарий»    | да   | при dirty draft |
| edit (свой)  | «Редактирование»    | да   | при dirty draft |
| view (чужой) | «Просмотр сценария» | нет  | не требуется    |

Read-only определяется через `ScenarioBuilderStore.isReadOnly()`. Кнопки footer: **«Сохранить»** (disabled при `editorLoading`) и **«Отмена»** (в read-only — «Закрыть»). Отмена при dirty draft открывает confirm через `CardEditorDiscardDialogComponent`.

### Конфигурация MatDialog

| Параметр       | Значение                      |
| -------------- | ----------------------------- |
| `panelClass`   | `scenario-builder-dialog`     |
| `width`        | `1100px` (с `maxWidth: 96vw`) |
| `maxHeight`    | `90vh`                        |
| `disableClose` | `true`                        |
| `autoFocus`    | `first-titled-element`        |

### Зависимости внутри dialog

- `CardCatalogSearchStore` — в `providers` dialog-компонента (зарезервировано для picker/criteria editor; текущая форма их не использует);
- discard confirm — переиспользование `CardEditorDiscardDialogComponent` (`shared/ui/dialogs`);
- guard от двойного открытия — в `ScenarioBuilderDialogService` (`activeRef`).

## Черновик формы

`ScenarioFormDraft` (`scenario-form-draft.utils.ts`) — промежуточная модель диалога. Часть полей **не выводится в UI** и остаётся зарезервированной (осознанный docs drift, зафиксирован планом миграции):

| Поле                                                                                                          | Статус в UI                                                                             |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `title`, `description`, `languagePair`                                                                        | редактируются в форме                                                                   |
| `published`                                                                                                   | зарезервировано; в форме toggle отсутствует (create → `false`, edit → как в `Scenario`) |
| `sourceMode`, `fixedCardIds`, `criteria`, `criteriaLimit`, `criteriaSort`, `criteriaSeed`, `snapshotFrozenAt` | зарезервировано; редактора источника карточек в UI нет                                  |

Поведение: `scenarioToFormDraft` переносит поля `cardSource` сценария в поля черновика, `formDraftToScenarioDraft` собирает `ScenarioDraft` обратно. Для нового сценария `sourceMode = 'fixed'` с пустым `fixedCardIds` (создаётся `mode: 'fixed', cardIds: []`); при редактировании существующий источник карточек сохраняется без изменений (round-trip через черновик).

## Связанные пути в коде

```
src/app/entities/scenario/model/scenario.types.ts
src/app/entities/scenario/model/scenario-card-source.types.ts
src/app/entities/scenario/model/scenario-index.types.ts
src/app/entities/scenario/api/scenarios-api.service.ts
src/app/entities/scenario/search/scenario-search.service.ts
src/app/entities/scenario/utils/scenario-card-source.utils.ts
src/app/entities/scenario/api/mock-catalog.mock.handler.ts
src/app/entities/scenario/api/mock-api.mock.interceptor.ts
src/app/pages/content-explorer/content-explorer-page/    # оркестрация сценариев в Проводнике
src/app/features/scenario-builder/                        # диалог + store + form (pages-слой удалён)
src/app/features/scenario-builder/components/scenario-builder-dialog/
src/app/features/scenario-builder/components/scenario-editor-form/
src/app/features/scenario-builder/utils/scenario-form-draft.utils.ts
src/app/entities/course/utils/course-write-payload.utils.ts  # привязка/каскад (PUT курса)
src/app/entities/scenario/ui/scenario-picker/
src/app/features/card-select/
src/app/features/card-editor/components/card-editor-dialog/             # образец
```

## Зависимости

- `entities/card/`: `CardCatalogSearchStore` (providers dialog), `CardSearchService`, типы `ScenarioCardSource`
- `entities/course/`: `CourseSearchService` (кэш курсов в store; привязка сценария к уроку — на page-слое Проводника через `courseWithProgramsToWritePayload`)
- `entities/scenario/`: `ScenarioSearchService`, `ScenariosApiService`
- `entities/language-pair/`: `LanguageService` (списки языков в select-ах формы)
- `entities/user/`: `isEditableContentAuthor` (владение: `ROLE_AUTHOR` / `ROLE_ADMIN`)
- `shared/ui/dialogs/`: `CardEditorDiscardDialogComponent`
