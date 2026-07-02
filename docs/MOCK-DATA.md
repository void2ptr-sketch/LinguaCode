# Mock-данные из файлов на диске

Когда Бэкенд недоступен, приложение может работать полностью автономно — все данные (карточки, сценарии, курсы) загружаются из JSON-файлов в `public/data/` и сохраняются в `localStorage`.

## Включение

В `src/environments/environment.ts` установите флажки:

```typescript
export const environment: Environment = {
  production: false,
  apiUrl: '/api',
  fixturesUrl: '/data',
  appName: 'LinguaCode',
  useCardsApiMock: true,
  useScenariosApiMock: true,
  useCoursesApiMock: true,
};
```

| Флаг | Что мокает | Интерсептор |
|---|---|---|
| `useCardsApiMock: true` | `/api/cards/search`, `/api/cards/:id`, `/api/cards/batch` | `cardsApiMockInterceptor` |
| `useScenariosApiMock: true` | `/api/scenarios/search`, `/api/scenarios/:id`, CRUD | `scenariosApiMockInterceptor` |
| `useCoursesApiMock: true` | `/api/courses/search`, `/api/courses/:id`, CRUD | `coursesApiMockInterceptor` |

Все три интерсептора подключаются через `provideApiHttp()` в `app.config.ts` и перехватывают только запросы к `environment.apiUrl` (`/api`). Запросы к `environment.fixturesUrl` (`/data`) идут напрямую через `HttpClient`.

## Структура данных

```
public/data/
├── content-manifest.json          ← индекс всех fixture-файлов
├── cards/
│   ├── demo-cards.json
│   ├── radicals-course-cards.json
│   ├── perl-interview-cards.json
│   └── perl-db-cards.json
├── scenarios/
│   ├── demo-scenarios.json
│   ├── radicals-scenarios.json
│   ├── perl-interview-scenarios.json
│   └── perl-db-scenarios.json
├── courses/
│   ├── demo-courses.json
│   ├── radicals-214-course.json
│   ├── perl-interview-course.json
│   └── perl-db-course.json
└── export/                        ← PDF-файлы (генерируются скриптом)
```

### content-manifest.json

```json
{
  "version": 1,
  "cardFiles": [
    "/cards/demo-cards.json",
    "/cards/perl-interview-cards.json"
  ],
  "scenarioFiles": [
    "/scenarios/demo-scenarios.json",
    "/scenarios/perl-interview-scenarios.json"
  ],
  "courseFiles": [
    "/courses/demo-courses.json",
    "/courses/perl-interview-course.json"
  ]
}
```

Манифест — единственный источник правды о том, какие fixture-файлы нужно загрузить при старте.

### Формат fixture-файлов

**cards/*.json** — массив карточек:

```json
{
  "cards": [
    {
      "id": "card-001",
      "title": "Выбор перевода",
      "kind": "select",
      "promptKnown": "Как будет «стол»?",
      "optionsLearning": ["mesa", "silla", "suelo", "techo"],
      "correctIndex": 0
    }
  ]
}
```

**scenarios/*.json** — массив сценариев:

```json
{
  "scenarios": [
    {
      "id": "scenario-001",
      "title": "Базовые существительные",
      "description": "Учим первые слова",
      "authorId": "system",
      "cardSource": {
        "mode": "fixed",
        "cardIds": ["card-001", "card-002"]
      },
      "published": true,
      "languagePair": {
        "source": "ru",
        "target": "es"
      }
    }
  ]
}
```

**courses/*.json** — курсы и уроки:

```json
{
  "courses": [
    {
      "id": "course-001",
      "title": "Мой курс",
      "description": "Описание курса",
      "authorId": "system",
      "languagePair": { "source": "ru", "target": "es" },
      "lessonIds": ["lesson-001"],
      "published": true,
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "lessons": [
    {
      "id": "lesson-001",
      "courseId": "course-001",
      "title": "Урок 1",
      "description": "Первый урок",
      "scenarioIds": ["scenario-001"],
      "prerequisiteLessonIds": [],
      "order": 0,
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## Процесс загрузки

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Приложение запускается                                       │
│     environment.ts → useXxxApiMock = true                       │
│     provideApiHttp() → регистрирует 3 mock-интерсептора         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ContentSeedRepository.preload()                              │
│     • GET /data/content-manifest.json                           │
│     • Параллельно:                                             │
│       - GET /data/cards/*.json → setCardSeedCache()             │
│       - GET /data/scenarios/*.json → setScenarioSeedCache()     │
│       - GET /data/courses/*.json → setCourseSeedCache()         │
│     • Данные кешируются в памяти (content-seed.cache.ts)        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Mock-обработчики (Catalog Handlers)                          │
│                                                                    │
│  CardsCatalogMockHandler                                         │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ ensureData():                                        │        │
│  │   1. CardRepository.ensureLoaded() → merge seed     │        │
│  │      + user-content overlay (localStorage)           │        │
│  │   2. GET /data/scenarios/card-index-meta.json        │        │
│  │   3. buildCardIndex() → индекс для поиска            │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                    │
│  ScenariosCatalogMockHandler                                       │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ ensureData():                                        │        │
│  │   1. ContentSeedRepository.preload()                  │        │
│  │   2. loadScenariosFromStorage() → слияние seed       │        │
│  │      + overlay (localStorage)                        │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                    │
│  CoursesCatalogMockHandler                                         │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ ensureData():                                        │        │
│  │   1. ContentSeedRepository.preload()                  │        │
│  │   2. loadCourseCatalogFromStorage() → слияние seed    │        │
│  │      + overlay (localStorage)                        │        │
│  └──────────────────────────────────────────────────────┘        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Mock-интерсепторы                                            │
│                                                                    │
│  cardsApiMockInterceptor:                                        │
│  • GET /api/cards/search → handler.search(criteria)             │
│  • GET /api/cards/:id → handler.getById(id)                     │
│  • POST /api/cards/batch → handler.getByIds(ids)                │
│                                                                    │
│  scenariosApiMockInterceptor:                                    │
│  • GET /api/scenarios/search → handler.search(criteria)         │
│  • GET /api/scenarios/:id → handler.getById(id)                 │
│  • GET /api/scenarios/by-card/:id → handler.findUsingCard(id)   │
│  • POST /api/scenarios → handler.create(payload)                │
│  • PUT /api/scenarios/:id → handler.update(id, payload)         │
│  • DELETE /api/scenarios/:id → handler.delete(id)               │
│                                                                    │
│  coursesApiMockInterceptor:                                      │
│  • GET /api/courses/search → handler.search(criteria)           │
│  • GET /api/courses/:id → handler.getById(id)                   │
│  • GET /api/courses/by-scenario/:id → handler.findUsingScenario │
│  • POST /api/courses → handler.create(payload)                  │
│  • PUT /api/courses/:id → handler.update(id, payload)           │
│  • DELETE /api/courses/:id → handler.delete(id)                 │
└─────────────────────────────────────────────────────────────────┘
```

## Слияние seed + пользовательские данные

Каждый mock-обработчик объединяет два источника:

```
Seed (файлы на диске)  +  Overlay (localStorage)  =  Итоговый каталог
```

### Overlay в localStorage

Ключ: `lingua-code.user-content-overlay`

```json
{
  "version": 1,
  "scenarios": {
    "scenario-user-001": { ... },
    "scenario-001": { "title": "Обновлённый заголовок" }
  },
  "courses": {
    "course-user-001": { ... }
  },
  "cards": {
    "card-001": { "optionsLearning": ["обновлённый вариант"] }
  },
  "deletedSystemIds": {
    "scenarios": ["scenario-удалённый"],
    "courses": ["course-удалённый"],
    "cards": ["card-удалённый"]
  }
}
```

### Правила слияния

| Источник | Поведение |
|---|---|
| **Seed (файлы)** | Базовая версия данных. Не изменяется при работе приложения. |
| **Overlay (localStorage)** | Переопределяет seed. Содержит полные объекты для новых данных или patch-объекты для изменений. |
| **deletedSystemIds** | ID системных объектов, удалённых пользователем. Эти объекты не появляются из seed. |

### Алгоритм для каждой сущности

1. **Объект из seed без изменений** → возвращается как есть.
2. **Объект из seed с patch в overlay** → patch применяется к seed-версии.
3. **Объект из seed с полным объектом в overlay** → overlay полностью заменяет seed.
4. **Новый объект (только в overlay)** → добавляется в каталог.
5. **Удалённый объект (ID в deletedSystemIds)** → исключается из каталога.

## Сохранение изменений

Когда пользователь создаёт, обновляет или удаляет сущность через моки:

```
User Action (CRUD)
    │
    ▼
Mock Handler (create/update/delete)
    │
    ▼
Получение seed из ContentSeedRepository
    │
    ▼
Слияние: seed + overlay → resolved
    │
    ▼
computeXxxOverlay(resolved, seed, previous)
    │  → вычисляет diff
    │  → определяет deletedSystemIds
    │
    ▼
writeUserContentOverlay(overlay)
    │  → localStorage.setItem()
    │
    ▼
Перезапрос данных (UI обновляется)
```

### Функции вычисления overlay

| Сущность | Функция | Расположение |
|---|---|---|
| Карточки | `computeCardsOverlay()` | `user-content-overlay.resolver.ts` |
| Сценарии | `computeScenariosOverlay()` | `user-content-overlay.resolver.ts` |
| Курсы | `computeCourseCatalogOverlay()` | `user-content-overlay.resolver.ts` |

Каждая функция сравнивает resolved-данные с seed и генерирует минимальный diff.

## Перезагрузка данных

Если нужно перезагрузить данные из файлов (например, после изменения fixture-файлов):

### В коде

```typescript
// Сброс кеша в mock-обработчиках
inject(CardsCatalogMockHandler).resetCache();
inject(ScenariosMockHandler).resetCache();
inject(CoursesMockHandler).resetCache();

// Сброс кеша seed-данных
import { resetContentSeedCache } from 'app/core/data/content-seed.cache';
resetContentSeedCache();
```

Последующий запрос к API вызовет повторную загрузку из файлов.

### В браузере

1. Очистить localStorage: `localStorage.removeItem('lingua-code.user-content-overlay')`
2. Перезагрузить страницу — seed загрузится из файлов заново.

## Добавление новых данных

### Шаг 1: Добавить fixture-файл

Создайте файл в соответствующей поддиректории `public/data/`:

```
public/data/cards/my-cards.json
public/data/scenarios/my-scenarios.json
public/data/courses/my-courses.json
```

### Шаг 2: Обновить content-manifest.json

```json
{
  "cardFiles": [
    "/cards/my-cards.json",
    // ... остальные
  ],
  "scenarioFiles": [
    "/scenarios/my-scenarios.json",
    // ... остальные
  ],
  "courseFiles": [
    "/courses/my-courses.json",
    // ... остальные
  ]
}
```

### Шаг 3: Перезагрузить приложение

При следующей загрузке `ContentSeedRepository` автоматически загрузит новые файлы.

## Production vs Development

| Окружение | useCardsApiMock | useScenariosApiMock | useCoursesApiMock |
|---|---|---|---|
| **Development** (`environment.ts`) | `true` | `true` | `true` |
| **Production** (`environment.production.ts`) | `false` | `true` | `true` |

В production моки сценариев и курсов остаются включёнными (данные хранятся в localStorage и не требуют бэкенда), а моки карточек отключены — они загружаются с сервера.

## Архитектурные компоненты

| Компонент | Расположение | Роль |
|---|---|---|
| `ContentSeedRepository` | `core/data/content-seed.repository.ts` | Загрузка fixture-файлов из `/data/` |
| `content-seed.cache.ts` | `core/data/content-seed.cache.ts` | Глобальный кеш seed-данных |
| `CardsCatalogMockHandler` | `core/api/cards-catalog.mock.handler.ts` | Обработка запросов карточек |
| `ScenariosCatalogMockHandler` | `core/api/scenarios-catalog.mock.handler.ts` | Обработка запросов сценариев |
| `CoursesCatalogMockHandler` | `core/api/courses-catalog.mock.handler.ts` | Обработка запросов курсов |
| `cardsApiMockInterceptor` | `core/api/cards-api.mock.interceptor.ts` | HTTP-интерсептор карточек |
| `scenariosApiMockInterceptor` | `core/api/scenarios-api.mock.interceptor.ts` | HTTP-интерсептор сценариев |
| `coursesApiMockInterceptor` | `core/api/courses-api.mock.interceptor.ts` | HTTP-интерсептор курсов |
| `user-content-overlay.*` | `core/data/user-content-overlay.*` | Слияние seed + overlay |
| `provide-api.http.ts` | `core/api/provide-api.http.ts` | Регистрация интерсепторов |
