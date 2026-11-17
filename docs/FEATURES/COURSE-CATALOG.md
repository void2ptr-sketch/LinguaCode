# Каталог курсов (Course Catalog)

> **Статус:** готово. Страница обзора опубликованных курсов с прогрессом, пагинацией и вкладками.

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [TASKS.md](../TASKS.md).

## Маршрут и доступ

| Маршрут    | Компонент                    | Роль             |
| ---------- | ---------------------------- | ---------------- |
| `/courses` | `CourseCatalogPageComponent` | Все пользователи |

Пункт меню: «Каталог курсов» в sidebar.

## Архитектура страницы

```
CourseCatalogPageComponent
└── MatTabGroup
    ├── Courses (course-list)
    │   ├── Пагинация
    │   ├── Прогресс по курсам
    │   └── Кнопка «Начать» → /journey
    ├── Programs (program-list)
    └── Settings (course-settings)
        ├── Управление языковыми парами
        └── Preferences
```

## Компоненты

### CourseListComponent

Список курсов с прогрессом и пагинацией.

| Input                | Тип                      | Назначение                |
| -------------------- | ------------------------ | ------------------------- |
| `items`              | `CourseIndexEntry[]`     | Элементы текущей страницы |
| `totalItems`         | `number`                 | Общее количество          |
| `pageIndex`          | `number`                 | Текущая страница          |
| `pageSize`           | `number`                 | Размер страницы           |
| `progressByCourseId` | `Record<string, number>` | Прогресс по курсам        |
| `completedCourseIds` | `ReadonlySet<string>`    | Завершённые курсы         |
| `loading`            | `boolean`                | Загрузка                  |
| `error`              | `string \| null`         | Ошибка                    |

| Output          | Назначение                             |
| --------------- | -------------------------------------- |
| `pageChange`    | Смена страницы                         |
| `courseStarted` | Запуск курса → навигация на `/journey` |

### ProgramListComponent

Список программ (треков) с фильтрацией по активным курсам.

### CourseSettingsComponent

Настройки курса: управление языковыми парами, preferences.

## Store: CourseCatalogStore

`@Injectable({ providedIn: 'root' })` — store каталога курсов.

### Состояние

| Сигнал               | Тип                                | Назначение                                |
| -------------------- | ---------------------------------- | ----------------------------------------- |
| `items`              | `readonly CourseIndexEntry[]`      | Элементы текущей страницы                 |
| `totalItems`         | `number`                           | Общее количество                          |
| `pageIndex`          | `number`                           | Текущая страница (0-based)                |
| `pageSize`           | `number`                           | Размер страницы                           |
| `loading`            | `boolean`                          | Загрузка                                  |
| `error`              | `string \| null`                   | Ошибка                                    |
| `progressByCourseId` | `Readonly<Record<string, number>>` | Прогресс 0–100                            |
| `completedCourseIds` | `ReadonlySet<string>`              | Завершённые курсы                         |
| `selectedTabIndex`   | `number`                           | Индекс выбранной вкладки                  |
| `activeCourseIds`    | `ReadonlySet<string>`              | Фильтр активных курсов (вкладка программ) |

### Персистентность

| Ключ                       | Данные                                   |
| -------------------------- | ---------------------------------------- |
| `selectedTabIndex`         | Последняя выбранная вкладка              |
| `activeCourseIds:{pairId}` | Фильтр активных курсов per language pair |

### Методы

| Метод                              | Описание                           |
| ---------------------------------- | ---------------------------------- |
| `setItems(items)`                  | Обновить элементы                  |
| `setTotalItems(total)`             | Обновить общее количество          |
| `setPageIndex(page)`               | Сменить страницу                   |
| `setPageSize(size)`                | Сменить размер страницы            |
| `setLoading(loading)`              | Состояние загрузки                 |
| `setError(error)`                  | Ошибка                             |
| `setProgressByCourseId(progress)`  | Прогресс по курсам                 |
| `setCompletedCourseIds(completed)` | Завершённые курсы                  |
| `setSelectedTabIndex(index)`       | Сменить вкладку (persist)          |
| `toggleActiveCourseId(id)`         | Переключить фильтр курса (persist) |
| `clearActiveCourseIds()`           | Сбросить фильтр                    |
| `onPageChange(event)`              | Обработка paginator event          |
| `restoreActiveCourseIds()`         | Восстановить из localStorage       |

## Зависимости

| Слой              | Зависимости                               |
| ----------------- | ----------------------------------------- |
| entities/course   | `CourseIndexEntry`, `CourseSearchService` |
| entities/learning | `LearningResultsStore` (progress)         |
| entities/user     | `UserStore` (activeLanguagePairId)        |
| shared/utils      | `UiPaginationComponent`                   |

## Связанные пути в коде

```
src/app/features/course-catalog/
├── components/
│   ├── course-list/               # Список курсов с прогрессом
│   ├── course-settings/           # Настройки курса
│   ├── program-list/              # Список программ
│   └── scorm-export-button/       # Кнопка SCORM экспорта
├── services/
│   ├── course-catalog.store.ts    # Store каталога
│   ├── drafts-store.ts            # Drafts store
│   ├── course-catalog-language-pair-manager.service.ts
│   └── course-catalog-preferences.service.ts
├── types/
│   └── course-catalog-store.ts    # CourseCatalogState, initialState
├── utils/
└── index.ts
```
