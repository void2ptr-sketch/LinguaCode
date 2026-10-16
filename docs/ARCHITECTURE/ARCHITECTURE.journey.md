# Архитектура: путь обучения (`journey`)

Интерактивная карта обучения (learning journey map) — визуальная навигация по курсу в виде узлов, сгруппированных по урокам. Маршрут `/journey`.

## Назначение

Отвечает на вопрос **«где я нахожусь в курсе»** — показывает прогресс по урокам и сценариям в виде карты с фильтрами, избранным и режимом «тумана войны» (скрывает заблокированные узлы).

## Структура

```text
features/journey/
├── components/
│   ├── journey-location-node/       # отдельный узел карты (статус, иконки, действия)
│   └── learning-journey-map/        # карта: группировка, фильтры, аналитика
├── services/
│   └── journey-analytics.service.ts # трекинг посещений, избранное, explorer level
├── models/                          # модели (пустой barrel)
├── utils/                           # утилиты (пустой barrel)
└── index.ts                         # barrel-экспорт
```

> **Примечание:** `journey-page` — это страница (page), а не компонент фичи. Она расположена в `pages/journey/journey-page/` и является точкой входа маршрута `/journey`. Компоненты фичи (`features/journey/components/`) импортируются страницей.

## Компоненты

| Компонент | Путь | Назначение |
|-----------|------|------------|
| `LearningJourneyMapComponent` | `features/journey/components/learning-journey-map/` | Карта: группировка узлов по урокам, фильтры по типу контента, избранные, туман войны |
| `JourneyLocationNodeComponent` | `features/journey/components/journey-location-node/` | Отдельный узел: статус, иконка типа контента, избранное, навигация |

### LearningJourneyMapComponent

**Inputs:**
- `courseId: input.required<string>()` — ID курса для аналитики
- `nodes: input.required<readonly JourneyLocationNode[]>()` — массив узлов карты

**Outputs:**
- `locationSelect: output<string>()` — клик по узлу

**Состояние (signals):**
- `filterType` — фильтр по типу контента (`'all' | JourneyContentType`)
- `viewMode` — режим отображения (`'map' | 'list'`)
- `selectedNodeId` — выбранный узел (для трекинга длительности)
- `showFavoritesOnly` — показывать только избранное
- `showFogOfWar` — скрывать заблокированные узлы

**Вычисляемые сигналы (computed):**
- `explorerLevel` — уровень исследователя из `JourneyAnalyticsService`
- `courseTitle` — заголовок курса (из первого узла)
- `filteredNodes` — узлы, отфильтрованные по типу, избранному и туману войны
- `groupedByLesson` — узлы, сгруппированные по lessonId, отсортированные по order

**Аналитика:**
- При навигации на страницу — событие `kind: 'visit'`
- При выборе узла — трекинг длительности через `effect`, событие `kind: 'duration'` при уходе
- Переключение избранного — `toggleFavorite`

### JourneyLocationNodeComponent

**Inputs:**
- `node: input.required<JourneyLocationNode>()` — данные узла
- `selected: input<boolean>(false)` — выбран ли узел

**Outputs:**
- `nodeSelect: output<string>()` — клик по узлу
- `toggleFavorite: output<string>()` — переключение избранного

**Вычисляемые свойства:**
- `statusIcon` — иконка Material для статуса (`lock`, `radio_button_unchecked`, `progress_activity`, `visibility`, `check_circle`)
- `contentTypeIcon` — иконка первого типа контента
- `isInteractive` — `true` если статус не `locked`
- `statusLabel` — человекочитаемый статус (Заблокировано / Доступно / В процессе / Посещено / Завершено)
- `cardCount` — количество карточек в сценарии

## Модель данных

### JourneyLocationNode

```typescript
type JourneyLocationNode = {
  id: string;
  title: string;
  description: string;
  cardCount: number;
  order: number;
  status: 'locked' | 'available' | 'in-progress' | 'visited' | 'completed';
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  completionPercent: number;
  visited: boolean;
  favorite: boolean;
  blockReason: string | null;
  scenarioId: string;
  contentTypes: JourneyContentType[];
};
```

### JourneyContentType

```typescript
type JourneyContentType = 'theory' | 'practice' | 'test' | 'video' | 'case';
```

Отображение card kind → content type:

| Card kind | Content type |
|-----------|-------------|
| `select`, `symbol`, `reading` | `theory` |
| `memory`, `sound`, `keyboard`, `draw`, `tone` | `practice` |
| `code-select`, `timed` | `test` |

### JourneyAnalyticsEvent

Три типа событий:
- `kind: 'visit'` — посещение узла (timestamp)
- `kind: 'duration'` — длительность сессии (durationMs)
- `kind: 'complete'` — завершение сценария (completionPercent)

## JourneyAnalyticsService

**Сигналы:**
- `visits` — массив записей о посещениях (localStorage + signal)
- `visitCountForScenario` — счётчик посещений для сценария
- `courseVisitStats` — статистика посещений по курсу (totalVisits, totalDurationMs, avgCompletionPercent)
- `stuckPoints` — проблемные узлы (>5 мин или <50% завершения)
- `explorerLevel` — уровень: `novice` → `experienced` → `expert`

**Методы:**
- `trackEvent(event)` — обработка события аналитики (visit/duration/complete)
- `updateLocationProgress(node, completedCount, totalCount)` — обновление статуса узла
- `toggleFavorite(nodeId, isFavorite)` — переключение избранного
- `isFavorite(nodeId)` — проверка избранного
- `clear()` — очистка всех данных аналитики

**Пороги explorer level:**

| Уровень | Посещения | Завершённые |
|---------|----------|-------------|
| novice | 0 | 0 |
| experienced | 5 | 2 |
| expert | 20 | 10 |

## Поток данных

```mermaid
flowchart TB
  subgraph Page [JourneyPageComponent]
    queryParams[queryParams.courseId]
    dashboardCourse[LearningDashboardService.course()]
  end

  subgraph Build [buildJourneyNodes]
    contentSeed[ContentSeedRepository]
    utils[buildJourneyNodes + buildScenarioMap]
  end

  subgraph Map [LearningJourneyMapComponent]
    filterType[filterType signal]
    filteredNodes[filteredNodes computed]
    groupedByLesson[groupedByLesson computed]
  end

  subgraph Analytics [JourneyAnalyticsService]
    visits[visits signal]
    localStorage[(localStorage)]
  end

  Page --> queryParams
  Page --> dashboardCourse
  dashboardCourse --> utils
  contentSeed --> utils
  utils --> Map
  Map --> filterType
  filterType --> filteredNodes
  filteredNodes --> groupedByLesson
  Map --> Analytics
  Analytics --> visits
  visits --> localStorage
```

## Зависимости

- `features/home/` — `LearningDashboardService` (выбор курса)
- `entities/learning/model/` — `JourneyLocationNode`, `JourneyContentType`, `LearningResultsStore`
- `entities/journey/lib/` — `buildJourneyNodes`, `buildScenarioMap`
- `entities/content-seed/` — `ContentSeedRepository` (сценарии и карточки)
- `entities/card/model/` — `CardBase` (карточки сценариев)

## Связанные документы

- [ARCHITECTURE.md](../ARCHITECTURE.md) — обзор архитектуры
- [ARCHITECTURE.home.md](./ARCHITECTURE.home.md) — dashboard
- [ARCHITECTURE.card-select.md](./ARCHITECTURE.card-select.md) — практика
- [ARCHITECTURE.learning-results.md](./ARCHITECTURE.learning-results.md) — результаты обучения
