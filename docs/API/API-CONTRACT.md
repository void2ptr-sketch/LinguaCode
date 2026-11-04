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

| Метод | Путь              | Описание                           |
| ----- | ----------------- | ---------------------------------- |
| GET   | `/language-pairs` | Список всех доступных языковых пар |

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
| GET    | `/cards/:id`            | Карточка по ID (404 при отсутствии)       |
| POST   | `/cards/batch/retrieve` | Пакетное получение по `{ ids: string[] }` |
| POST   | `/cards`                | Создание карточки (201)                   |
| PUT    | `/cards/:id`            | Обновление карточки                       |
| DELETE | `/cards/:id`            | Удаление карточки                         |

Критерии поиска (`CardSearchCriteria`): `query`, `knownLanguage`, `learningLanguage`, `tags`, `difficulty`, `kinds`, `page` (`page` / `pageSize`), `sort`. Параметры сериализуются через `buildCardSearchParams`.

## Сценарии (`/scenarios`)

Реализация: `ScenariosApiService` · порт `ScenarioCatalogPort` · mock `scenariosApiMockInterceptor`.

| Метод  | Путь                         | Описание                           |
| ------ | ---------------------------- | ---------------------------------- |
| GET    | `/scenarios/search`          | Поиск + пагинация                  |
| GET    | `/scenarios/:id`             | Сценарий по ID                     |
| POST   | `/scenarios`                 | Создание сценария (201)            |
| PUT    | `/scenarios/:id`             | Обновление сценария (403 на чужой) |
| DELETE | `/scenarios/:id`             | Удаление сценария                  |
| GET    | `/scenarios/by-card/:cardId` | Сценарии, использующие карточку    |

Пейлоад записи: `ScenarioWritePayload` (`title`, `description`, `cardSource` (структурированный объект), `published`, `languagePair?`).
На бэкенд отправляется: `scenarioDescription` (из `description`), `cardSource` (JSON-строка), `languagePairId`.

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

Пейлоад записи: `ProgramWritePayload` (`courseId`, `title`, `description`, `lessonIds`, `order`).
На бэкенд отправляется: `programDescription` (из `description`).

## Курсы (`/courses`)

Реализация: `CoursesApiService` · порт `CourseCatalogPort` · mock `coursesApiMockInterceptor`.

| Метод  | Путь                               | Описание                                   |
| ------ | ---------------------------------- | ------------------------------------------ |
| GET    | `/courses/search`                  | Поиск + пагинация                          |
| GET    | `/courses/:id`                     | Курс с уроками (`CourseWithLessons`)       |
| GET    | `/courses/:id/bundle`              | Экспорт-пакет (`CourseExportBundle`)       |
| GET    | `/courses/by-scenario/:scenarioId` | Курсы, использующие сценарий               |
| GET    | `/scorm/export/courses/:id`        | Экспорт в SCORM/xAPI (`ScormExportBundle`) |
| POST   | `/courses`                         | Создание курса (201)                       |
| PUT    | `/courses/:id`                     | Обновление курса (403 на чужой)            |
| DELETE | `/courses/:id`                     | Удаление курса                             |

Пейлоад записи: `CourseWritePayload` (`title`, `description`, `published`, `languagePair?`, `programs[]`, `authoring?`).
На бэкенд отправляется: `courseDescription` (из `description`), `authorId` (из UserStore).

### Экспорт-пакет (`CourseExportBundle`)

Используется инструментами автора (экспорт в CourseBundle JSON, PDF):

```typescript
type CourseExportBundle = {
  catalog: CourseCatalogState; // курсы + уроки (seed + overlay)
  scenarios: readonly Scenario[]; // все сценарии
  cards: readonly Card[]; // все карточки
  cardIndexMeta: Record<string, CardIndexMetaOverride>; // метаданные индекса
};
```

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

- Dev: `useCardsApiMock` / `useScenariosApiMock` / `useCoursesApiMock` / `useUsersApiMock` / `useLearningApiMock` / `useScormMock` = `true` — ответы отдают mock-интерсепторы (данные: content seed + user overlay в `localStorage`).
- Production: флаги `false` — запросы идут на `environment.apiUrl` реального бэкенда.
- Auth: `authEnabled` = `false` в dev (mock-бэкенд не требует токенов); `true` в production включает restore-сессии и refresh-интерсептор.
- Контракт должен совпадать: порты + conformance-тесты (`*.port.conformance.spec.ts`) проверяют, что API-сервис и mock-хендлер структурно реализуют один и тот же порт.
- Слой legacy-хранилищ (`courses-storage`, `scenarios-storage`, `CardRepository`) — внутренняя реализация mock-бэкенда; фронтенд через API-сервисы.
