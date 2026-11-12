# План (ревизия 2): Перенос функций «Конструктора курсов» в «Проводник контента»

> Ревизия 2 — правки по результатам оценки. Оригинал: `.gigacode_vsc/plans/1794512445261-crisp-tiger.md`
> (недоступен агенту из-за `.codeassistantignore`; скопируйте содержимое этого файла туда вручную).

## Контекст

Страница `/tools/courses` (Конструктор курсов) содержит CRUD-операции над курсами:
список с пагинацией, поиск, фильтрацию (мои/опубликованные/все), создание,
редактирование, удаление, экспорт (JSON, PDF, SCORM) и сброс overlay.

Страница `/tools/content` (Проводник контента) уже содержит древовидное дерево
`Course → Program → Lesson → Scenario → Card` с детальными действиями для
каждого узла. Редактирование курсов уже работает через `CourseBuilderDialogService`.

**Цель:** перенести функции управления курсами в Проводник контента, удалить
страницу `/tools/courses`, сохранить обратную совместимость через редирект.

**Важное ограничение (ревизия 2):** feature-слайс `features/course-builder/`
НЕ удаляется — диалог `course-builder-dialog` (используется Проводником для
создания/редактирования курсов) жёстко инжектит `CourseBuilderStore` и
`CoursePdfExportService` (см. `course-builder-dialog.component.ts:51-55`).
Удаляется только `pages/course-builder/` и `reset-overlay-dialog/`.

---

## Что переносится (по исходному промпту: какие кнопки переносим, если `/tools/courses` удаляется)

| Функция | Куда | Обоснование |
|---------|------|-------------|
| Создание курса | Header страницы (кнопка «Создать курс») | Единственная точка входа; не требует выбранного узла |
| Экспорт PDF (без подсказок) | Detail-панель при выбранном курсе | Контекстно привязано |
| Экспорт PDF (с подсказками) | Detail-панель при выбранном курсе | Контекстно привязано |
| Экспорт JSON (CourseBundle) | Detail-панель при выбранном курсе | Контекстно привязано |
| Экспорт SCORM | Detail-панель при выбранном курсе | Контекстно привязано |
| Удаление курса | Detail-панель при выбранном курсе | Контекстно привязано |
| Поиск по курсам | Уже есть в дереве (`filterQuery` в `explorer-tree.component.ts`) | Фильтрация по дереву работает |

### Что НЕ переносится

| Функция | Куда | Обоснование |
|---------|------|-------------|
| Фильтрация «Мои/Опубликованные/Все» | Этап 0: проверить каталог `/courses`; если фильтра нет — оставить переключатель scope в Проводнике (store умеет `scope` через `CourseSearchService`) или принять потерю | Решение по результатам Этапа 0 |
| Пагинация списка | Этап 0: решить — поднять `ROOT_PAGE_SIZE`, добавить «показать ещё» или задокументировать лимит 100 курсов | Store Проводника грузит только 1 страницу (`page: 0, pageSize: 100`) |
| Сброс overlay | Удалить | Maintenance-действие; функция становится недостижимой во всём приложении — зафиксировать в changelog |
| Кнопка «Повторить» при ошибке | Не переносится | У Проводника своя обработка ошибок |

---

## Этапы работ

### Этап 0: Решения по «хвостатым» функциям (новый, ревизия 2)

**Действия:**

1. Проверить каталог `/courses` (`features/course-catalog/`) на наличие
   author-фильтра «Мои/Все». Зафиксировать решение:
   - добавить фильтр в каталог, ИЛИ
   - оставить scope-переключатель в Проводнике, ИЛИ
   - принять потерю функциональности.
2. Решить вопрос пагинации корней дерева (лимит `ROOT_PAGE_SIZE = 100` в
   `content-explorer.store.ts:31`): поднять лимит / «показать ещё» / документировать.
3. Зафиксировать удаление функции «Сброс overlay» в changelog.

---

### Этап 1: Добавить кнопки экспорта/удаления в detail-панель

**Файлы:**
- `src/app/features/content-explorer/components/explorer-detail/explorer-detail.component.ts`
- `src/app/features/content-explorer/components/explorer-detail/explorer-detail.component.html`
- `src/app/features/content-explorer/components/explorer-detail/explorer-detail.component.scss`
- `src/app/pages/content-explorer/content-explorer-page/content-explorer-page.component.ts`

**Действия:**

1. Добавить новые output-события в `ExplorerDetailComponent`:
   - `exportPdfRequested` — экспорт PDF без подсказок
   - `exportPdfWithHintsRequested` — экспорт PDF с подсказками
   - `exportJsonRequested` — экспорт JSON (CourseBundle)
   - `exportScormRequested` — экспорт SCORM
   - `deleteRequested` — удаление курса

   (Создание курса — в header страницы, см. Этап 2; output
   `createCourseRequested` в detail-компонент НЕ добавлять.)

2. Добавить кнопки в `explorer-detail.component.html` — блок
   `@if (store.selectedNode()!.kind === 'course' && canEditOwnCourse())` с кнопками:
   - `mat-stroked-button` «Скачать PDF» с `matMenuTriggerFor` (два пункта: без подсказок / с подсказками)
   - `mat-stroked-button` «Экспорт JSON»
   - `mat-stroked-button` «Экспорт SCORM»
   - `mat-stroked-button` «Удалить» (с подтверждением через `MatDialog`)

3. **Права доступа (ревизия 2):** существующий `canEdit` в
   `explorer-detail.component.ts:64-70` возвращает `true` для всех course-узлов.
   Добавить отдельный computed `canEditOwnCourse()` с проверкой владения курсом
   (аналог `isOwnCourse(course.authorId)` из course-builder-page) — иначе кнопки
   удаления/экспорта видны на чужих курсах.

4. Добавить `MatMenuModule`, `MatButtonModule` в imports detail-компонента.

5. В `ContentExplorerPageComponent` добавить обработчики для новых событий —
   **переиспользовать `CourseBuilderStore` напрямую** (он `providedIn: 'root'`),
   НЕ копируя методы в `ContentExplorerStore`:
   - `onExportPdfRequested()` → `courseBuilderStore.exportPdf(courseId, false)`
   - `onExportPdfWithHintsRequested()` → `courseBuilderStore.exportPdf(courseId, true)`
   - `onExportJsonRequested()` → `courseBuilderStore.exportCourseBundle(courseId)`
   - `onExportScormRequested()` → `this.scormExportService.export(courseId)`
   - `onDeleteCourseRequested()` → `courseBuilderStore.deleteCourse(courseId)`
     + обновить узел дерева (перегрузить `loadRoots()` или удалить root-узел)

   (**Ревизия 2:** прежний вариант «перенести методы в ContentExplorerStore»
   отклонён — дублирование логики создаёт два источника правды; кроме того,
   `deleteCourse` в `CourseBuilderStore` ищет курс в `indexItems()`, копирование
   требует адаптации под `roots()` Проводника.)

**Зависимости:** `CourseBuilderStore` остаётся в `features/course-builder/services/`
и инжектится в `ContentExplorerPageComponent` наряду с `CourseBuilderDialogService`.

---

### Этап 2: Добавить кнопку «Создать курс» в header страницы

**Файлы:**
- `src/app/pages/content-explorer/content-explorer-page/content-explorer-page.component.html`
- `src/app/pages/content-explorer/content-explorer-page/content-explorer-page.component.ts`

**Действия:**

1. В `content-explorer-page.component.html` добавить кнопку «Создать курс» в header-секцию,
   рядом с текущим заголовком «Проводник контента».

2. Подписать обработчик `(click)="onCreateCourseRequested()"` →
   `this.courseBuilderDialog.openCreate()`.

---

### Этап 3: Удалить страницу CourseBuilder

**Файлы:**
- `src/app/pages/course-builder/` — удалить целиком (**только pages, не features!**)
- `src/app/features/course-builder/components/reset-overlay-dialog/` — удалить
- `src/app/app/app.routes.ts` — заменить route на redirect
- `src/app/widgets/sidebar-navigation-left/sidebar-nav-config.ts` — удалить пункт «Конструктор курсов»

**Действия:**

1. В `app.routes.ts` заменить route `/tools/courses` на redirect:
   ```typescript
   {
     path: 'tools/courses',
     redirectTo: 'tools/content',
     pathMatch: 'full',
     // при необходимости: preserve query-параметры из закладок
   },
   ```
   Оба маршрута под `authorGuard` — редирект безопасен.

2. Удалить `src/app/pages/course-builder/` целиком.

3. Удалить кнопку «Конструктор курсов» из `sidebar-nav-config.ts` (строки 42-46).
   Других ссылок на `/tools/courses` в коде нет (проверено поиском).

4. **НЕ удалять** `features/course-builder/services/` — `CourseBuilderStore`
   и `CoursePdfExportService` инжектятся диалогом `course-builder-dialog`,
   который продолжает использоваться Проводником.
   Также не трогать `course-form/`, `course-form-draft.utils` — используются диалогом.

5. Удалить `features/course-builder/components/reset-overlay-dialog/` —
   использовался только course-builder-page (проверено поиском).

6. Проверить barrel `features/course-builder/index.ts` — убрать экспорты
   удалённых частей, если появятся битые ссылки.

---

### Этап 4: Обновить тесты

**Файлы:**
- `src/app/pages/course-builder/course-builder-page/course-builder-page.component.spec.ts` — удалить
- `src/app/features/course-builder/services/course-builder.store.spec.ts` — оставить (store живёт)
- `src/app/features/content-explorer/components/explorer-detail/explorer-detail.component.spec.ts` — **создать** (ревизия 2: файла не существует; есть только `explorer-tree.component.spec.ts` и `content-explorer.store.spec.ts`)
- `src/app/features/content-explorer/services/content-explorer.store.spec.ts` — дополнить

**Действия:**

1. Удалить spec удалённой страницы `course-builder-page.component.spec.ts`.
   (`course-builder.smoke.spec.ts` не существует — пункта нет.)

2. Создать spec `explorer-detail.component.spec.ts` — проверки новых кнопок
   и гейтинга `canEditOwnCourse()`.

3. Дополнить `content-explorer.store.spec.ts` и/или добавить тесты обработчиков
   страницы: экспорт/удаление делегируются `CourseBuilderStore` (mock).

---

### Этап 5: Проверка и валидация

**Действия:**

1. `npm run verify` — полный пайплайн
2. Убедиться, что `/tools/courses` редиректит на `/tools/content`
3. Убедиться, что экспорт/удаление работают из detail-панели и скрыты на чужих курсах
4. Убедиться, что создание курса из header открывает диалог и после сохранения дерево обновляется
5. Убедиться, что каталог курсов (`/courses`) не сломан

---

## Риски и смягчения

| Риск | Смягчение |
|------|-----------|
| `CourseBuilderStore` кажется «ненужным» после удаления страницы | **Он нужен**: диалог `course-builder-dialog` его инжектит. Feature-слайс сохраняется; page Проводника переиспользует store напрямую |
| Дублирование export/delete-логики в двух store | Отклонено: переиспользуем `CourseBuilderStore`, не копируем методы |
| Экспорт PDF/JSON/SCORM не работает в новом контексте | Те же сервисы: `CourseBuilderStore` (PDF/JSON), `ScormExportService` (SCORM, `providedIn: 'root'`) |
| Права доступа: кнопки видны на чужих курсах | Новый computed `canEditOwnCourse()` с проверкой владения (аналог `isOwnCourse`) |
| Scope-фильтр «Мои/Все» теряется | Этап 0: решение — каталог / оставить в Проводнике / принять потерю |
| >100 курсов недоступны в дереве | Этап 0: решение по пагинации корней |
| «Сброс overlay» становится недостижимым | Осознанная потеря; зафиксировать в changelog |
| Redirect теряет query-параметры из закладок | Рассмотреть `queryParamsHandling: 'preserve'` |

---

## Порядок выполнения

0. **Этап 0** — решения по scope-фильтру, пагинации и changelog
1. **Этап 1** — кнопки экспорта/удаления в detail-панель + права владения
2. **Этап 2** — кнопка «Создать курс» в header
3. **Этап 3** — удалить страницу CourseBuilder (только pages) и редирект
4. **Этап 4** — обновить/создать тесты
5. **Этап 5** — проверка `npm run verify`

---

## Файлы для изменения

### Новые/изменённые:
1. `src/app/features/content-explorer/components/explorer-detail/explorer-detail.component.ts` — outputs + `canEditOwnCourse()`
2. `src/app/features/content-explorer/components/explorer-detail/explorer-detail.component.html` — кнопки
3. `src/app/features/content-explorer/components/explorer-detail/explorer-detail.component.scss` — стили кнопок
4. `src/app/pages/content-explorer/content-explorer-page/content-explorer-page.component.ts` — обработчики (делегирование в `CourseBuilderStore`)
5. `src/app/pages/content-explorer/content-explorer-page/content-explorer-page.component.html` — кнопка «Создать курс» в header
6. `src/app/app/app.routes.ts` — redirect `/tools/courses` → `/tools/content`
7. `src/app/widgets/sidebar-navigation-left/sidebar-nav-config.ts` — удалить «Конструктор курсов»
8. `src/app/features/course-builder/index.ts` — почистить barrel при необходимости

### Удаляемые:
1. `src/app/pages/course-builder/` — весь каталог (только pages-слой)
2. `src/app/features/course-builder/components/reset-overlay-dialog/` — весь каталог
3. `src/app/pages/course-builder/course-builder-page/course-builder-page.component.spec.ts` — вместе со страницей

### НЕ трогаем:
- `src/app/features/course-builder/services/` — `CourseBuilderStore`, `CoursePdfExportService` нужны диалогу
- `src/app/features/course-builder/components/course-builder-dialog/` — используется Проводником
- `src/app/features/course-builder/components/course-form/` — используется диалогом
