# API-контракт LinguaCode

Описание HTTP API приложения. Реализация на стороне фронтенда — API-сервисы (`entities/*/api/`), «серверная» часть в dev-режиме — mock-интерсепторы (`entities/*/api/mock/`). Контракт портов: `entities/*/repository/*.port.ts`.

## Соглашения

| Пункт            | Значение                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Базовый URL      | `buildApiUrl(path)` → `${environment.apiUrl}/${environment.apiVersion}${path}` (`/api/v1/...` в dev) |
| Формат           | JSON                                                                                                 |
| Обёртка ответа   | `ApiResponse<T>` → `{ "data": T }`                                                                   |
| Списочные ответы | `ApiListResponse<T>` → `{ "data": T[], "total": number }` (внутри `data`)                            |
| Ошибки           | HTTP status + тело `{ "message": string, "code"?: string, "details"?: unknown }`                     |
| Аутентификация   | `Authorization: Bearer <accessToken>` (см. `authInterceptor` + `AuthTokenStorage`)                   |

Типы обёрток: [`shared/api/api.types.ts`](../src/app/shared/api/api.types.ts). URL-хелпер: [`shared/api/api-url.ts`](../src/app/shared/api/api-url.ts). Версия API задаётся в `environment.apiVersion`.

## Языковые пары (`/language-pairs`)

Реализация: `LanguagePairsApiService` · mock: нет (данные с бэкенда).

| Метод  | Путь                  | Описание                           |
| ------ | --------------------- | ---------------------------------- |
| GET    | `/language-pairs`     | Список всех доступных языковых пар |
| POST   | `/language-pairs`     | Создание пары (201)                |
| PATCH  | `/language-pairs/:id` | Частичное обновление пары          |
| DELETE | `/language-pairs/:id` | Удаление пары                      |

Ответ: `ApiListResponse<LanguagePairDto>`

```typescript
type LanguagePairDto = {
  id: number;
  knownCode: string;
  learningCode: string;
};
```

> **⚠️ Важно: `language_pairs` — справочник, НЕ настройки пользователя.**
>
> Таблица `language_pairs` (эндпоинт `/api/v1/language-pairs`) служит **только источником информации** для фронтенда — карточки "Зеркальная пара" и вложенные карточки "Языковые пары" получают из неё список **всех доступных** языковых пар.
>
> **Пользовательские настройки** (выбранные пары, активная пара) хранятся **исключительно** в таблице `users` (поле `preferences`):
>
> - `activeLanguagePairId` — ID активной пары
> - `learningPairs` — массив `{ known, learning }` выбранных пар
>
> Фронтенд работает с настройками пользователя через `PATCH /api/v1/users/me/preferences` (`UserApiService.patchUserPreferences()`). **Никакие операции записи (POST/PUT/PATCH/DELETE) на `/api/v1/language-pairs` не выполняются.**
>
> Ошибка: попытка обновлять/удалять пары через `language-pairs` API. Это справочник, а не пользовательские данные.

## Карточки (`/cards`)

Реализация: `CardsApiService` · порт `CardCatalogPort` · mock `cardsApiMockInterceptor`.

| Метод  | Путь                    | Описание                                  |
| ------ | ----------------------- | ----------------------------------------- |
| GET    | `/cards/search`         | Поиск по критериям + пагинация + facets   |
| GET    | `/cards/:id`            | Карточка по ID/Slug (404 при отсутствии)  |
| POST   | `/cards/batch/retrieve` | Пакетное получение по `{ ids: string[] }` |
| POST   | `/cards`                | Создание карточки (201)                   |
| PUT    | `/cards/:id`            | Обновление карточки                       |
| DELETE | `/cards/:id`            | Удаление карточки                         |

> **Важно:** эндпоинт `GET /cards/:id` принимает **строковый ID** (numeric или slug). Бэкенд сначала пытается распарсить как число (`Long`), при ошибке ищет по slug (`findBySlug`). Это позволяет фронтенду использовать контентные идентификаторы типа `draw-radical-001`.

> **Порядок карточки (`card_order`).** В API `Card.order` / `CardCreateRequest.order` /
> `CardUpdateRequest.order` зарезервированы под позицию карточки внутри сценария.
> Порядок принадлежит связи «сценарий → карточка» (карточка может использоваться
> в нескольких сценариях), поэтому в БД его следует хранить в
> `scenario_cards.card_order`, а не в `cards`. До появления поля фронтенд берёт
> порядок из `cardSource.cardIds` / `Scenario.resolvedCardIds`. См.
> [ARCHITECTURE.content-explorer.md](../ARCHITECTURE/ARCHITECTURE.content-explorer.md#сортировка-узлов-дерева).

Критерии поиска (`CardSearchCriteria`): `query`, `knownLanguage`, `learningLanguage`,
`languagePairId`, `programId`, `lessonId`, `scenarioId`, `courseId`, `tags`, `difficulty`,
`kinds`, `published`, `scope`, `page` (`page` / `pageSize`), `sort`. Параметры
сериализуются через `buildCardSearchParams`; `scope: 'all'` включает черновики.

| Параметр                                             | Тип                                        | Описание                        |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| `query`                                              | string                                     | Поиск по `title`                |
| `knownLanguage` / `learningLanguage`                 | string                                     | ISO-коды языков                 |
| `languagePairId`                                     | number                                     | ID языковой пары                |
| `courseId` / `programId` / `lessonId` / `scenarioId` | number                                     | Фильтр по иерархии              |
| `difficulty`                                         | `beginner\|intermediate\|advanced\|expert` | Сложность (в query — uppercase) |
| `kinds`                                              | string[]                                   | Типы карточек                   |
| `tags`                                               | string[]                                   | Теги                            |
| `published`                                          | boolean                                    | Явный фильтр публикации         |
| `scope`                                              | `mine\|all\|published`                     | Авторский режим                 |
| `page` / `pageSize`                                  | number                                     | Пагинация                       |

### Запись карточки (`CardCreateRequest` / `CardUpdateRequest`)

Реализация: `CardBackendAdapter.toCreatePayload()` / `toUpdatePayload()`.

| Поле                                                 | Create   | Update   | Описание                                                     |
| ---------------------------------------------------- | -------- | -------- | ------------------------------------------------------------ |
| `title`                                              | required | optional | 1–200 символов                                               |
| `kind`                                               | required | optional | Uppercase enum типа карточки                                 |
| `dataJson`                                           | optional | optional | JSON-строка контента                                         |
| `tags`                                               | optional | optional | JSON-строка массива тегов                                    |
| `difficulty`                                         | optional | optional | `BEGINNER/INTERMEDIATE/ADVANCED/EXPERT`                      |
| `requiredTier`                                       | required | optional | `FREE/STARTER/GROWTH/PREMIUM`; на update сохраняется текущий |
| `languagePairId`                                     | optional | optional | ID языковой пары                                             |
| `courseId` / `programId` / `lessonId` / `scenarioId` | optional | optional | Иерархия обучения                                            |
| `order`                                              | optional | optional | Позиция в сценарии (≥ 1)                                     |
| `published`                                          | optional | optional | Публикация                                                   |
| `slug`                                               | optional | optional | Пустой/blank не отправляется — бэкенд генерирует             |

> `id`, `authorId`, `createdAt`, `updatedAt` фронтенд не отправляет.

### Справочник тегов карточек (`/cards/tags`)

Реализация: `TagsService`.

| Метод | Путь                       | Описание                           |
| ----- | -------------------------- | ---------------------------------- |
| GET   | `/cards/tags`              | Все уникальные теги                |
| GET   | `/cards/tags/course/:id`   | Теги карточек конкретного курса    |
| GET   | `/cards/tags/program/:id`  | Теги карточек конкретной программы |
| GET   | `/cards/tags/lesson/:id`   | Теги карточек конкретного урока    |
| GET   | `/cards/tags/scenario/:id` | Теги карточек конкретного сценария |

Ответ: `ApiListResponse<ReferenceOptionDto>` — `{ "code": string, "label": string }`.

### Справочник типов карточек (`/cards/kinds`)

Реализация: `CatalogService` (через `CardKindsService`).

| Метод | Путь           | Описание              |
| ----- | -------------- | --------------------- |
| GET   | `/cards/kinds` | Список типов карточек |

Ответ: `ApiListResponse<ReferenceOptionDto>` — только типы карточек (`select`, `memory`, …).

### Справочник сложностей карточек (`/cards/difficulties`)

Реализация: `CatalogService` (через `CardDifficultiesService`).

| Метод | Путь                  | Описание                                                |
| ----- | --------------------- | ------------------------------------------------------- |
| GET   | `/cards/difficulties` | Уровни сложности из таблицы `content_difficulty_levels` |

Ответ: `ApiListResponse<ReferenceOptionDto>` — `{ "code": "beginner", "label": "Начальный уровень" }`.

> **Принцип:** production-значения справочников (типы, сложности, языки, теги) приходят с бэкенда. Frontend-константы для справочников допустимы только в mock-слое (`entities/*/api/mock/`) и используются исключительно при включённых `useXxxApiMock`; production-код не подставляет локальные списки вместо ответа API.

## Сценарии (`/scenarios`)

Реализация: `ScenariosApiService` · порт `ScenarioCatalogPort` · mock `scenariosApiMockInterceptor`.

| Метод  | Путь                           | Описание                           |
| ------ | ------------------------------ | ---------------------------------- |
| GET    | `/scenarios/search`            | Поиск + пагинация                  |
| GET    | `/scenarios/:id`               | Сценарий по ID                     |
| POST   | `/scenarios`                   | Создание сценария (201)            |
| PUT    | `/scenarios/:id`               | Обновление сценария (403 на чужой) |
| DELETE | `/scenarios/:id`               | Удаление сценария                  |
| GET    | `/scenarios/by-card/:cardId`   | Сценарии, использующие карточку    |
| POST   | `/scenarios/:id/cards`         | Добавить карточку в `cardSource`   |
| DELETE | `/scenarios/:id/cards/:cardId` | Удалить карточку из `cardSource`   |
| PATCH  | `/scenarios/:id/cards/:cardId` | Переставить карточку (`{ order }`) |

Привязка карточек реализована через сгенерированный `ScenarioCardsService`
(`scenariosAddCard` / `scenariosRemoveCard` / `scenariosMoveCard`) и обёрнута в
`ScenariosApiService.addCard()` / `removeCard()` / `moveCard()`. Операции атомарные:
бэкенд синхронизирует `scenario.cardSource.cardIds`, `card.scenarioId` и иерархию
(`courseId` / `programId` / `lessonId`), а также нормализует `order` (1-based).
Для сценариев с `cardSource.mode = 'criteria'` операции возвращают `409 Conflict`.

Пейлоад записи: `ScenarioWritePayload` (`title`, `description`, `cardSource`, `published`, `languagePairId?`, `courseId?`, `programId?`, `lessonId?`, `requiredTier?`).

> **`languagePairId`** — опционально. Numeric ID из `language_pairs.id`. Фронтенд передаёт `languagePairId`; поле `languagePair` (code pair) устарело и не передаётся. Бэкенд разрешает `languagePairId` → `languagePair` через кэш `LanguagePairsApiService`.

### Поля `ScenarioWritePayload`

| Поле                  | Create   | Update   | Описание                                  |
| --------------------- | -------- | -------- | ----------------------------------------- |
| `title`               | required | optional | Название (1–200 символов)                 |
| `scenarioDescription` | optional | optional | Описание (из `description`)               |
| `cardSource`          | required | optional | JSON-строка                               |
| `published`           | optional | optional | Опубликовать                              |
| `courseId`            | optional | optional | ID курса (Long)                           |
| `programId`           | optional | optional | ID программы (Long)                       |
| `lessonId`            | optional | optional | ID урока (Long)                           |
| `languagePairId`      | optional | optional | ID языковой пары (Long)                   |
| `requiredTier`        | required | optional | `FREE` / `STARTER` / `GROWTH` / `PREMIUM` |
| `order`               | optional | optional | Порядок в уроке (≥ 1)                     |

> **`requiredTier`** — обязательное поле при создании (по умолчанию `FREE`). На update — опционально, по умолчанию сохраняется текущее значение.
> **`courseId`**, **`programId`**, **`lessonId`** — опциональные ссылки на иерархию обучения. Бэкенд может игнорировать `courseId` в mapper'е (обрабатывается в service layer).

### Параметры поиска сценариев (`GET /scenarios/search`)

| Параметр           | Тип    | Обязательный | Описание                                          |
| ------------------ | ------ | ------------ | ------------------------------------------------- |
| `query`            | string | Нет          | Текстовый поиск по названию                       |
| `authorId`         | string | Нет          | Фильтр по автору                                  |
| `scope`            | string | Нет          | `mine` / `all` / `published`                      |
| `cardSourceMode`   | string | Нет          | `fixed` / `snapshot` / `criteria`                 |
| `knownLanguage`    | string | Нет          | Язык-источник (ISO-код)                           |
| `learningLanguage` | string | Нет          | Язык-цель (ISO-код)                               |
| `courseId`         | string | Нет          | Фильтр по курсу                                   |
| `lessonId`         | string | Нет          | Фильтр по уроку (backend `search` его игнорирует) |
| `page`             | number | Да           | Номер страницы (0-based)                          |
| `size`             | number | Да           | Размер страницы (Spring-параметр)                 |
| `pageSize`         | number | Нет          | Дублируется для mock-интерсептора                 |

> **Автоинкремент `order`.** Отдельного endpoint'а `max(order)` нет. `ScenariosApiService.getNextOrder()`
> постранично читает `/scenarios/search` (`page` / `size`), берёт максимум `order`
> (`scenario_order` как fallback) и возвращает `max + 1`. Эндпоинт `/scenarios`
> для этого не подходит: он игнорирует `lessonId` и применяет tier-фильтрацию,
> поэтому возвращает только доступные сценарии (часто с `order = 0`).

## Программы (`/programs`)

Реализация: `ProgramsApiService` · порт `ProgramCatalogPort` · mock `programsApiMockInterceptor`.

| Метод  | Путь                            | Описание                               |
| ------ | ------------------------------- | -------------------------------------- |
| GET    | `/programs/search`              | Поиск + пагинация                      |
| GET    | `/programs/:id`                 | Программа по ID (`ProgramWithLessons`) |
| GET    | `/programs/by-course/:courseId` | Программы курса                        |
| POST   | `/programs`                     | Создание программы (201)               |
| PUT    | `/programs/:id`                 | Обновление программы (403 на чужой)    |
| DELETE | `/programs/:id`                 | Удаление программы                     |

Пейлоад записи: `ProgramWritePayload` (`courseId`, `title`, `description`, `lessonIds`, `order`, `requiredTier`, `languagePairId?`, `published?`).

### Поля `ProgramWritePayload`

| Поле                 | Create   | Update   | Описание                                  |
| -------------------- | -------- | -------- | ----------------------------------------- |
| `title`              | required | optional | Название (1–200 символов)                 |
| `programDescription` | optional | optional | Описание для каталога (из `description`)  |
| `courseId`           | required | —        | ID родительского курса (BIGINT)           |
| `requiredTier`       | required | required | `FREE` / `STARTER` / `GROWTH` / `PREMIUM` |
| `order`              | optional | optional | Порядок в курсе (по умолчанию 0)          |
| `languagePairId`     | optional | optional | Пара языков (извлекается из курса)        |
| `published`          | —        | optional | Опубликовать (только update)              |

> **`requiredTier`** — обязательное поле. Без него бэкенд возвращает 400 Bad Request.
> **`languagePairId`** — опционально. Фронтенд извлекает из `Course` при создании.
> **`lessonIds`** — не передаётся в payload (управляется через lesson-builder). При create бэкенд создаёт пустой массив.
> **`authorId`** — не передаётся, бэкенд подставляет из токена.
> **`ownerId`** — не передаётся, бэкенд подставляет из токена (аналогично `authorId`).

## Уроки (`/lessons`)

Реализация: `LessonsApiService` · порт `LessonsCatalogPort` · mock `lessonsApiMockInterceptor`.

| Метод  | Путь                             | Описание                                   |
| ------ | -------------------------------- | ------------------------------------------ |
| GET    | `/lessons/:id`                   | Урок по ID                                 |
| GET    | `/lessons/by-program/:programId` | Уроки программы (сортировка по `order`)    |
| GET    | `/lessons/by-course/:courseId`   | Уроки курса (сортировка по `order`)        |
| POST   | `/lessons`                       | Создание урока (201)                       |
| PUT    | `/lessons/:id`                   | Обновление урока                           |
| DELETE | `/lessons/:id`                   | Удаление урока (каскад на cards/scenarios) |

Пейлоад создания: `LessonCreatePayload` (`programId`, `title`, `description`, `order`, `prerequisiteLessonIds`, `languagePairId?`, `courseId?`).
Пейлоад обновления: `LessonUpdatePayload` (`title`, `description`, `order`, `prerequisiteLessonIds`, `languagePairId?`, `courseId?`).

### Поля `LessonCreatePayload`

| Поле                    | Тип      | Описание                                    |
| ----------------------- | -------- | ------------------------------------------- |
| `programId`             | string   | ID программы (обязательное)                 |
| `title`                 | string   | Название (1–200 символов)                   |
| `description`           | string   | Описание урока                              |
| `order`                 | number   | Порядок в программе (> 0)                   |
| `prerequisiteLessonIds` | string[] | JSON-массив ID пререквизитов (опционально)  |
| `languagePairId`        | number   | ID языковой пары (извлекается из программы) |
| `courseId`              | string   | ID курса (извлекается из программы)         |

### Поля `LessonUpdatePayload`

| Поле                    | Тип      | Описание                                   |
| ----------------------- | -------- | ------------------------------------------ |
| `title`                 | string   | Название (1–200 символов)                  |
| `description`           | string   | Описание урока                             |
| `order`                 | number   | Порядок в программе (> 0)                  |
| `prerequisiteLessonIds` | string[] | JSON-массив ID пререквизитов (опционально) |
| `languagePairId`        | number   | ID языковой пары (опционально)             |
| `courseId`              | string   | ID курса (опционально)                     |

> **`prerequisiteLessonIds`** — строка (JSON), а не массив. Фронтенд сериализует/десериализует через `stringifyPrerequisiteLessonIds` / `parsePrerequisiteLessonIds`.
> **`programId`** — immutable, не передаётся в update-пейлоаде.
> **`scenarioIds`** — не передаётся в payload (управляется через scenario-builder).
> **`languagePairId`** и **`courseId`** — наследуются из родительской программы при создании; на update — опционально, по умолчанию сохраняется текущее значение.

## Курсы (`/courses`)

Реализация: `CoursesApiService` · порт `CourseCatalogPort` · mock `coursesApiMockInterceptor`.

| Метод | Путь              | Описание                             |
| ----- | ----------------- | ------------------------------------ |
| GET   | `/courses/search` | Поиск + пагинация                    |
| GET   | `/courses/:id`    | Курс с уроками (`CourseWithLessons`) |

### Параметры поиска (`GET /courses/search`)

| Параметр           | Тип    | Описание                                         |
| ------------------ | ------ | ------------------------------------------------ |
| `page`             | number | Номер страницы (0-based)                         |
| `pageSize`         | number | Размер страницы                                  |
| `query`            | string | Свободный текстовый запрос                       |
| `authorId`         | string | Фильтр по ID автора                              |
| `scope`            | string | Область: `mine` / `all` / `published`            |
| `knownLanguage`    | string | Фильтр по известному языку (ContentLanguage код) |
| `learningLanguage` | string | Фильтр по изучаемому языку (ContentLanguage код) |
| `languagePairIds`  | number | Массив ID языковых пар (множественный)           |

> **`knownLanguage`** / **`learningLanguage`** — коды языков из `ContentLanguage` (например, `ru`, `en`, `zh`). Фронтенд передаёт эти параметры через `activeLanguagePairCriteria()` для фильтрации курсов по языковой паре пользователя. Бэкенд должен поддерживать фильтрацию по этим параметрам.
> | GET | `/courses/:id/journey` | Курс с программами и уроками для карты |
> | GET | `/courses/:id/bundle` | Экспорт-пакет (`CourseExportBundle`) |
> | GET | `/courses/by-scenario/:scenarioId` | Курсы, использующие сценарий |
> | GET | `/courses/scorm/export/courses/:id` | Экспорт в SCORM/xAPI (`ScormExportBundle`) |
> | POST | `/courses` | Создание курса (201) |
> | PUT | `/courses/:id` | Обновление курса (403 на чужой) |
> | DELETE | `/courses/:id` | Удаление курса |

Пейлоад записи: `CourseWritePayload` (`title`, `description`, `published`, `languagePairId?`, `languagePair?`, `programs[]`, `authoring?`, `practiceSettings?`, `requiredTier?`, `slug?`).
На бэкенд отправляется: `courseDescription` (из `description`), `authorId` (из UserStore).
`requiredTier` отправляется как есть; `slug` отправляется только если не пустая строка (бэкенд автогенерирует из `title`).

> **`languagePairId`** — опционально. Numeric ID из `language_pairs.id`. Фронтенд передаёт `languagePairId` и (для обратной совместимости) `languagePair` (code pair). Бэкенд предпочитает `languagePairId`.

### Настройки практики (`practiceSettings`)

```typescript
type CoursePracticeSettings = {
  mode: 'guided' | 'open';
  requireLessonForScenarios?: boolean;
  enforceLessonPrerequisites?: boolean;
  allowDifficultyFilter?: boolean;
};
```

- `mode` — режим навигации: `guided` (линейный) или `open` (свободный выбор сценариев)
- `requireLessonForScenarios` — обязательный выбор урока для доступа к сценариям
- `enforceLessonPrerequisites` — принудительные предусловия уроков
- `allowDifficultyFilter` — фильтр по сложности (beginner/intermediate/advanced)
- Хранится как JSONB в бэкенде
- Фронтенд автоматически парсит JSONB-строку в объект при получении от API

### Экспорт-пакет (`CourseExportBundle`)

Используется инструментами автора (экспорт в CourseBundle JSON, PDF):

```typescript
type CourseExportBundle = {
  courses: readonly Course[]; // курсы (seed + overlay)
  programs: readonly Program[]; // программы (seed + overlay)
  lessons: readonly Lesson[]; // уроки (seed + overlay)
  scenarios: readonly Scenario[]; // все сценарии
  cards: readonly Card[]; // все карточки
  cardIndexMeta?: Record<string, CardIndexMetaOverride>; // метаданные индекса (опционально)
};
```

> **Примечание:** `cardIndexMeta` может быть пустым или отсутствовать в ответе бэкенда — фронтенд обрабатывает это как `{}`. Утилитарный слой (`collectCourseBundle`) преобразует flat-массивы во вложенную структуру v2 для экспорта.

### Экспорт в SCORM/xAPI (`ScormExportBundle`)

Используется для интеграции с корпоративными системами обучения (LMS: Moodle, SCORM Cloud). Полная иерархия `Course → Program → Lesson → Scenario → Card`.

Реализация: `ScormExportService` (backend) · mock `scormExportMockInterceptor` · типы `scorm-export.types.ts`.

| Параметр | Значение              | Описание                                                    |
| -------- | --------------------- | ----------------------------------------------------------- |
| `format` | `json` (по умолчанию) | `json` — JSON-объект, `zip` — ZIP-архив с `imsmanifest.xml` |

Ответ: `ScormExportBundle`:

```typescript
type ScormExportBundle = {
  format: 'linguacode-scorm-export';
  version: number;
  exportedAt: string;
  manifest: ScormManifest; // SCORM organization hierarchy
  courses: readonly Course[];
  programs: readonly Program[];
  lessons: readonly Lesson[];
  scenarios: readonly Scenario[];
  cards: readonly Card[];
  xapiStatements: readonly XapiStatement[];
};
```

`ScormManifest` описывает иерархию SCORM 2004:

```typescript
type ScormManifest = {
  identifier: string;
  title: string;
  description: string;
  organizations: readonly ScormOrganization[];
};

type ScormOrganization = {
  identifier: string;
  title: string;
  description: string;
  default: boolean;
  order: number;
  items: readonly ScormLessonItem[];
};

type ScormLessonItem = {
  identifier: string;
  title: string;
  description: string;
  order: number;
  resources: readonly ScormResource[];
};

type ScormResource = {
  identifier: string;
  type: 'card' | 'scenario' | 'lesson';
  href: string;
  title: string;
};
```

xAPI statements для аналитики:

```typescript
type XapiStatement = {
  id: string;
  actor: XapiActor;
  verb: XapiVerb;
  object: XapiObject;
  timestamp: string;
  context: XapiContext;
};
```

> **Важно:** mock-данные хранятся в `public/data/export/<courseId>-scorm.json`; флаг `useScormMock` в `environment` включает/отключает mock-интерсептор.

## Пользователь (`/users`)

Реализация: `UserApiService` · порт `UserPort` · mock `userApiMockInterceptor`.

| Метод | Путь        | Описание                                 |
| ----- | ----------- | ---------------------------------------- |
| GET   | `/users/me` | Профиль пользователя (query: `userId`)   |
| PUT   | `/users/me` | Обновление профиля (`UpdateUserPayload`) |

> **Важно:** оба эндпоинта извлекают `userId` из JWT-токена (через `Authentication`Spring Security). `userId` не передаётся в query-параметрах или теле запроса. Авторизация на этих эндпоинтах проверяет ownership через JWT. Пейлоад обновления: `UpdateUserPayload` (`displayName?`, `preferences?`).

## Языки (`/languages`)

Реализация: `LanguageApiService`.

| Метод  | Путь                 | Описание                               |
| ------ | -------------------- | -------------------------------------- |
| GET    | `/languages`         | Список всех языков (activeFlag фильтр) |
| GET    | `/languages/:id`     | Язык по ID                             |
| GET    | `/languages/by-code` | Язык по ISO-коду (`?code=ru`)          |
| POST   | `/languages`         | Создание языка (201)                   |
| PATCH  | `/languages/:id`     | Частичное обновление языка             |
| DELETE | `/languages/:id`     | Удаление языка (204)                   |

Пейлоад создания: `LanguageCreatePayload` (`code`, `displayName`, `nativeName`, `writingDir`, `supportsTones`, `supportsPinyin`, `fontFamily`, `activeFlag`).

> **Примечание:** эндпоинт `GET /languages` возвращает только активные языки (activeFlag=true). Для полного списка используйте `GET /languages` без фильтрации на фронтенде.

## Справочники (`/reference`)

Реализация: `CatalogService` (через generated API-клиенты).

| Метод | Путь                 | Описание       |
| ----- | -------------------- | -------------- |
| GET   | `/content-languages` | Языки контента |
| GET   | `/font-sizes`        | Размеры шрифта |
| GET   | `/learning/statuses` | Статусы уроков |

Ответ: `ApiListResponse<ReferenceOptionDto>` — `{ "code": string, "label": string }`.

## Reference Settings (`/reference/settings`)

Реализация: `AppSettingsService` (обёртка над `ReferenceSettingsService` из `shared/api/generated/`).
Все эндпоинты требуют `@PreAuthorize("isAuthenticated()")`. В dev-режиме при `authEnabled: false`
запросы идут напрямую на бэкенд без токена — mock-интерсептор должен быть включён.

| Метод | Путь                             | Описание                |
| ----- | -------------------------------- | ----------------------- |
| GET   | `/reference/settings/validation` | Правила валидации       |
| GET   | `/reference/settings/pagination` | Настройки пагинации     |
| GET   | `/reference/settings/sync`       | Настройки синхронизации |
| GET   | `/reference/settings/chinese`    | Настройки китайского    |

Ответ: `ApiOneResponse<T>` — обёртка `{ "data": T }`.

### ValidationRulesResponse

| Поле                   | Тип     | Описание                      |
| ---------------------- | ------- | ----------------------------- |
| `maxTitleLength`       | number  | Максимальная длина заголовка  |
| `maxDescriptionLength` | number  | Максимальная длина описания   |
| `maxTagsPerEntity`     | number  | Максимальное количество тегов |
| `requireTags`          | boolean | Обязательны ли теги           |

### PaginationSettingsResponse

| Поле              | Тип    | Описание                     |
| ----------------- | ------ | ---------------------------- |
| `defaultPageSize` | number | Размер страницы по умолчанию |
| `maxPageSize`     | number | Максимальный размер страницы |

### SyncSettingsResponse

| Поле                 | Type   | Описание                    |
| -------------------- | ------ | --------------------------- |
| `maxBatchSize`       | number | Максимальный размер батча   |
| `syncTimeoutSeconds` | number | Таймаут синхронизации (сек) |

### ChineseSettingsResponse

| Поле             | Тип     | Описание                                     |
| ---------------- | ------- | -------------------------------------------- |
| `showPinyin`     | boolean | Показывать Пиньинь                           |
| `showTones`      | boolean | Показывать тоны                              |
| `showHanzi`      | boolean | Показывать Ханьзи                            |
| `pinyinPosition` | string  | Позиция Пиньиня: `above` / `below` / `right` |

> **Fallback:** при ошибке или отсутствии данных в БД фронтенд использует дефолтные значения:
> `maxTitleLength: 200`, `maxDescriptionLength: 2000`, `maxTagsPerEntity: 10`, `requireTags: false`,
> `defaultPageSize: 50`, `maxPageSize: 200`, `maxBatchSize: 500`, `syncTimeoutSeconds: 300`,
> `showPinyin: true`, `showTones: true`, `showHanzi: true`, `pinyinPosition: 'above'`.

## Восстановление пароля (`/auth`)

Реализация: `PasswordRecoveryService` (backend only).

| Метод | Путь                    | Описание                        |
| ----- | ----------------------- | ------------------------------- |
| POST  | `/auth/forgot-password` | Запрос 6-значного кода на email |
| POST  | `/auth/verify-code`     | Проверка кода                   |
| POST  | `/auth/reset-password`  | Сброс пароля по токену          |

Пейлоад `PasswordForgotRequest`: `{ "email": string }`.
Пейлоад `PasswordVerifyCodeRequest`: `{ "email": string, "code": string }`.
Пейлоад `PasswordResetRequest`: `{ "resetToken": string, "newPassword": string }`.

> **Примечание:** в dev-режиме код возвращается в ответе; в production — отправка email без раскрытия факта регистрации.

## Поведение обучения (`/learning`)

Реализация: `BehaviorAnalysisService` (backend only).

| Метод | Путь                            | Описание                              |
| ----- | ------------------------------- | ------------------------------------- |
| GET   | `/learning/behavior/snapshot`   | Полный снапшот поведения пользователя |
| GET   | `/learning/behavior/weak-cards` | Список слабых карточек                |
| GET   | `/learning/behavior/pace`       | Аналитика темпа обучения              |
| GET   | `/learning/behavior/difficulty` | Кривая сложности по типам карточек    |

Параметр `accuracyThreshold` (default: `0.5`) — порог точности для слабых карточек.

Ответы:

- `/snapshot` → `ApiOneResponse<UserBehaviorDto>`
- `/weak-cards` → `ApiListResponse<LearningWeakCardProfileDto>`
- `/pace` → `ApiOneResponse<LearningPaceDto>`
- `/difficulty` → `ApiOneResponse<LearningDifficultyCurveDto>`

> **Примечание:** все эндпоинты извлекают `userId` из JWT-токена — поле `userId` не передаётся в запросе.

## Подписка (`/subscription`)

Реализация: `SubscriptionService` (backend only).

| Метод | Путь                     | Описание                             |
| ----- | ------------------------ | ------------------------------------ |
| GET   | `/subscription/status`   | Текущий статус подписки пользователя |
| POST  | `/subscription/activate` | Активация подписи (webhook, admin)   |

Ответ `/status` → `ApiOneResponse<SubscriptionStatusDto>`.

## Обратная связь (`/feedback`)

Реализация: `FeedbackService` (backend only).

| Метод | Путь            | Описание                  |
| ----- | --------------- | ------------------------- |
| POST  | `/feedback`     | Создать обращение (201)   |
| GET   | `/feedback/:id` | Детали обращения          |
| GET   | `/feedback/my`  | Мои обращения (paginated) |

Пейлоад создания: `FeedbackCreateRequest` (`entityType`, `entityId`, `feedbackType`, `message`).

Справочники обратной связи:

| Метод | Путь                   | Описание               |
| ----- | ---------------------- | ---------------------- |
| GET   | `/feedback/types`      | Типы обратной связи    |
| GET   | `/feedback/statuses`   | Статусы обратной связи |
| GET   | `/feedback/severities` | Уровни серьёзности     |

Ответ: `ApiListResponse<ReferenceOptionDto>`.

## SCORM (`/scorm`)

Реализация: `ScormImportService` (backend only).

| Метод | Путь            | Описание                        |
| ----- | --------------- | ------------------------------- |
| POST  | `/scorm/import` | Импорт курса из SCORM ZIP (201) |

Параметры: `file` (MultipartFile, required), `authorId` (Long, required), `title` (String, optional).

Ответ: `ApiOneResponse<ScormImportResult>` — содержит counts созданных сущностей.

## Справочники подписок (`/subscription`)

Реализация: `SubscriptionService` (backend only).

| Метод | Путь                          | Описание              |
| ----- | ----------------------------- | --------------------- |
| GET   | `/subscription/payment-tiers` | Список тарифов оплаты |

Ответ: `ApiListResponse<ReferenceOptionDto>`.

## Админ (`/admin`)

Реализация: `AdminTierService` (backend only).

| Метод | Путь             | Описание                  |
| ----- | ---------------- | ------------------------- |
| GET   | `/admin/content` | Админ-тарифы для контента |

Ответ: `ApiListResponse<ReferenceOptionDto>`.

## Аутентификация (`/auth`)

Реализация: `AuthApiService` · порт `AuthPort` · стор `AuthStore` · хранилище `AuthTokenStorage` (sessionStorage).

| Метод | Путь            | Описание                                                |
| ----- | --------------- | ------------------------------------------------------- |
| POST  | `/auth/login`   | Вход по `{ email, password }` → `AuthSession`           |
| POST  | `/auth/refresh` | Обновление токенов по `{ refreshToken }` → `AuthTokens` |
| POST  | `/auth/logout`  | Выход (best-effort)                                     |

Типы: `AuthSession` (`userId`, `accessToken`, `refreshToken` — соответствует backend `AuthResponse`), `AuthTokens` (`accessToken`, `refreshToken`).

Поток:

- `AuthStore.restoreSession()` — при старте приложения (только при `environment.authEnabled`): валидный access-токен → сессия; истёкший → refresh.
- `authRefreshInterceptor` — при ответе 401 (кроме `/auth/*`) выполняет single-flight refresh и повторяет запрос с новым токеном.
- Токены хранятся в `sessionStorage` (не переживают закрытие вкладки).

## Обучение (`/learning`)

Реализация: `LearningApiService` · порт `LearningCatalogPort` · mock `learningApiMockInterceptor`.

| Метод | Путь                                 | Описание                                  |
| ----- | ------------------------------------ | ----------------------------------------- |
| POST  | `/learning/results`                  | Запись результата (`LearningResult`)      |
| GET   | `/learning/results/:userId`          | Результаты пользователя (пагинация)       |
| GET   | `/learning/accuracy/:userId/:cardId` | Точность по карточке (`CardAccuracyData`) |

> **Важно:** эндпоинт `POST /learning/results` извлекает `userId` из JWT-токена — поле `userId` не должно передаваться в теле запроса. Эндпоинты `GET /learning/results/{userId}` и `GET /learning/accuracy/{userId}/{cardId}` принимают `userId` в URL; бэкенд проверяет ownership через `@PreAuthorize` (только владелец может читать свои результаты). Тип точности: `CardAccuracyData` (`cardId`, `totalAttempts`, `correctAttempts`, `accuracy`).

## Mock vs реальный бэкенд

- Dev: `useCardsApiMock` / `useScenariosApiMock` / `useCoursesApiMock` / `useProgramsApiMock` / `useLessonsApiMock` / `useUsersApiMock` / `useLearningApiMock` / `useScormMock` = `true` — ответы отдают mock-интерсепторы (данные: content seed + user overlay в `localStorage`).
- Production: флаги `false` — запросы идут на `environment.apiUrl` реального бэкенда.
- Auth: `authEnabled` = `false` в dev (mock-бэкенд не требует токенов); `true` в production включает restore-сессии и refresh-интерсептор.
- Контракт должен совпадать: порты + conformance-тесты (`*.port.conformance.spec.ts`) проверяют, что API-сервис и mock-хендлер структурно реализуют один и тот же порт.
- Слой legacy-хранилищ (`courses-storage`, `scenarios-storage`, `CardRepository`) — внутренняя реализация mock-бэкенда; фронтенд через API-сервисы.

## Не реализовано на фронтенде

Следующие эндпоинты реализованы на бэкенде, но ещё не имеют фронтенд-сервисов:

| Домен               | Эндпоинты                                                                           | Приоритет |
| ------------------- | ----------------------------------------------------------------------------------- | --------- |
| Password Recovery   | `POST /auth/forgot-password`, `POST /auth/verify-code`, `POST /auth/reset-password` | Medium    |
| Learning Behavior   | `GET /learning/behavior/*` (4 эндпоинта)                                            | Low       |
| Subscription        | `GET /subscription/status`, `POST /subscription/activate`                           | Low       |
| SCORM Import        | `POST /scorm/import`                                                                | Low       |
| Feedback            | `POST /feedback`, `GET /feedback/:id`, `GET /feedback/my`                           | Medium    |
| Feedback References | `GET /feedback/types`, `/statuses`, `/severities`                                   | Low       |
| Font Sizes          | `GET /font-sizes`                                                                   | Low       |
| Learning Statuses   | `GET /learning/statuses`                                                            | Low       |
| Payment Tiers       | `GET /subscription/payment-tiers`                                                   | Low       |
| Admin Tiers         | `GET /admin/content`                                                                | Low       |
