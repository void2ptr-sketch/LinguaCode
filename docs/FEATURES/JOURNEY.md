# Карта обучения (Journey Map)

> **Статус:** готово. Интерактивная карта контента курса: программы → уроки → сценарии с аналитикой посещений.

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [TASKS.md](../TASKS.md).

## Маршрут и доступ

| Маршрут    | Компонент              | Роль             |
| ---------- | ---------------------- | ---------------- |
| `/journey` | `JourneyPageComponent` | Все пользователи |

Пункт меню: «Путь обучения» в sidebar.

## Архитектура страницы

```
JourneyPageComponent
└── LearningJourneyMapComponent
    ├── Filters (content type, favorites, fog-of-war)
    ├── View mode (map / list)
    └── Nodes (grouped by lesson)
        └── JourneyLocationNodeComponent (clickable)
```

## Компоненты

### LearningJourneyMapComponent

Интерактивная карта контента с фильтрацией, избранным и fog-of-war.

| Input      | Тип                              | Назначение               |
| ---------- | -------------------------------- | ------------------------ |
| `courseId` | `string`                         | ID курса (для аналитики) |
| `nodes`    | `readonly JourneyLocationNode[]` | Nodes карты              |

| Output           | Назначение                                |
| ---------------- | ----------------------------------------- |
| `locationSelect` | Выбор узла → навигация на `/cards/select` |

**State signals:**

| Сигнал              | Тип                 | Назначение                                                                |
| ------------------- | ------------------- | ------------------------------------------------------------------------- |
| `filterType`        | `JourneyFilterType` | Фильтр по типу: `all` / `theory` / `practice` / `test` / `video` / `case` |
| `viewMode`          | `JourneyViewMode`   | Режим: `map` / `list`                                                     |
| `selectedNodeId`    | `string \| null`    | Выбранный узел (для трекинга длительности)                                |
| `showFavoritesOnly` | `boolean`           | Только избранные                                                          |
| `showFogOfWar`      | `boolean`           | Скрыть заблокированные                                                    |

**Computed:**

| Сигнал            | Тип                                  | Вычисление                                |
| ----------------- | ------------------------------------ | ----------------------------------------- |
| `explorerLevel`   | `ExplorerLevelResult \| null`        | Уровень из `JourneyAnalyticsService`      |
| `courseTitle`     | `string`                             | Название из первого node                  |
| `filteredNodes`   | `readonly JourneyLocationNode[]`     | Фильтрация по type, favorites, fog-of-war |
| `groupedByLesson` | `Map<string, JourneyLocationNode[]>` | Группировка по lessonId, sorted by order  |
| `contentTypes`    | `FilterOption[]`                     | Опции фильтров с иконками и тултипами     |

**Analytics tracking:**

| Событие          | Описание                                        |
| ---------------- | ----------------------------------------------- |
| `visit`          | `ngOnInit` — посещение карты                    |
| `duration`       | При смене выбранного узла — длительность сессии |
| `toggleFavorite` | Переключение избранного                         |

### JourneyLocationNodeComponent

Отдельный узел карты: программа → урок → сценарий.

| Input  | Тип                   | Назначение       |
| ------ | --------------------- | ---------------- |
| `node` | `JourneyLocationNode` | Узел для рендера |

| Output   | Назначение |
| -------- | ---------- |
| `select` | Выбор узла |

### JourneyLocationNodeComponent (sub-components)

| Компонент                      | Назначение     |
| ------------------------------ | -------------- |
| `JourneyLocationNodeComponent` | Отдельный узел |

## JourneyAnalyticsService

`@Injectable({ providedIn: 'root' })` — сервис аналитики посещений.

| Сигнал          | Тип                                   | Описание              |
| --------------- | ------------------------------------- | --------------------- |
| `explorerLevel` | `Signal<ExplorerLevelResult \| null>` | Уровень исследователя |

### Analytics Events

```typescript
type JourneyAnalyticsEvent =
  | { kind: 'visit'; scenarioId: string; lessonId: string; courseId: string; timestamp: string }
  | {
      kind: 'duration';
      scenarioId: string;
      lessonId: string;
      courseId: string;
      durationMs: number;
      timestamp: string;
    }
  | { kind: 'favorite'; nodeId: string; isFavorite: boolean; timestamp: string };
```

## JourneyLocationNode

```typescript
type JourneyLocationNode = {
  id: string;
  courseId: string;
  programId: string;
  programTitle: string;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  scenarioId: string;
  scenarioTitle: string;
  scenarioOrder: number;
  contentTypes: JourneyContentType[];
  status: 'locked' | 'available' | 'completed';
  favorite: boolean;
  cardCount: number;
  courseTitle: string;
  order: number;
};
```

## JourneyFilterType

```typescript
type JourneyFilterType = 'all' | 'theory' | 'practice' | 'test' | 'video' | 'case';
```

## JourneyViewMode

```typescript
type JourneyViewMode = 'map' | 'list';
```

## Зависимости

| Слой              | Зависимости                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| entities/learning | `JourneyLocationNode`, `JourneyContentType`, `ExplorerLevelResult`, `LearningDashboardService` |
| shared/logger     | `AppLoggerService`                                                                             |

## Связанные пути в коде

```
src/app/features/journey/
├── components/
│   ├── learning-journey-map/          # Карта обучения
│   │   └── learning-journey-map.component.ts
│   └── journey-location-node/         # Отдельный узел
│       └── journey-location-node.component.ts
├── model/
├── services/
│   └── journey-analytics.service.ts   # Analytics tracking
├── utils/
└── index.ts
```
