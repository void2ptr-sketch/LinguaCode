# API-контракт LinguaCode

Описание HTTP API приложения. Реализация на стороне фронтенда — API-сервисы (`entities/*/api/`), «серверная» часть в dev-режиме — mock-интерсепторы (`entities/*/api/mock/`). Контракт портов: `entities/*/repository/*.port.ts`.

## Соглашения

| Пункт            | Значение                                                          |
| ---------------- | ----------------------------------------------------------------- |
| Базовый URL      | `buildApiUrl(path)` → `${environment.apiUrl}/${environment.apiVersion}${path}` (`/api/v1/...` в dev) |
| Формат           | JSON                                                              |
| Обёртка ответа   | `ApiResponse<T>` → `{ "data": T }`                                |
| Списочные ответы | `ApiListResponse<T>` → `{ "data": T[], "total": number }` (внутри `data`) |
| Ошибки           | HTTP status + тело `{ "message": string, "code"?: string, "details"?: unknown }` |
| Аутентификация   | `Authorization: Bearer <accessToken>` (см. `authInterceptor` + `AuthTokenStorage`) |

Типы обёрток: [`shared/api/api.types.ts`](../src/app/shared/api/api.types.ts). URL-хелпер: [`shared/api/api-url.ts`](../src/app/shared/api/api-url.ts). Версия API задаётся в `environment.apiVersion`.

## Карточки (`/cards`)

Реализация: `CardsApiService` · порт `CardCatalogPort` · mock `cardsApiMockInterceptor`.

| Метод   | Путь               | Описание                                        |
| ------- | ------------------ | ----------------------------------------------- |
| GET     | `/cards/search`    | Поиск по критериям + пагинация + facets         |
| GET     | `/cards/:id`       | Карточка по ID (404 при отсутствии)             |
| POST    | `/cards/batch`     | Пакетное получение по `{ ids: string[] }`       |
| POST    | `/cards`           | Создание карточки (201)                         |
| PUT     | `/cards/:id`       | Обновление карточки                             |
| DELETE  | `/cards/:id`       | Удаление карточки                               |

Критерии поиска (`CardSearchCriteria`): `query`, `knownLanguage`, `learningLanguage`, `tags`, `difficulty`, `kinds`, `page` (`page` / `pageSize`), `sort`. Параметры сериализуются через `buildCardSearchParams`.

## Сценарии (`/scenarios`)

Реализация: `ScenariosApiService` · порт `ScenarioCatalogPort` · mock `scenariosApiMockInterceptor`.

| Метод   | Путь                  | Описание                                    |
| ------- | --------------------- | ------------------------------------------- |
| GET     | `/scenarios/search`   | Поиск + пагинация                           |
| GET     | `/scenarios/:id`      | Сценарий по ID                              |
| POST    | `/scenarios`          | Создание сценария (201)                     |
| PUT     | `/scenarios/:id`      | Обновление сценария (403 на чужой)          |
| DELETE  | `/scenarios/:id`      | Удаление сценария                           |
| GET     | `/scenarios/by-card/:cardId` | Сценарии, использующие карточку        |

Пейлоад записи: `ScenarioWritePayload` (`title`, `description`, `cardSource`, `published`, `languagePair?`).

## Курсы (`/courses`)

Реализация: `CoursesApiService` · порт `CourseCatalogPort` · mock `coursesApiMockInterceptor`.

| Метод   | Путь                        | Описание                                  |
| ------- | --------------------------- | ----------------------------------------- |
| GET     | `/courses/search`           | Поиск + пагинация                         |
| GET     | `/courses/:id`              | Курс с уроками (`CourseWithLessons`)      |
| GET     | `/courses/:id/bundle`       | Экспорт-пакет (`CourseExportBundle`)      |
| GET     | `/courses/by-scenario/:scenarioId` | Курсы, использующие сценарий         |
| POST    | `/courses`                  | Создание курса (201)                      |
| PUT     | `/courses/:id`              | Обновление курса (403 на чужой)           |
| DELETE  | `/courses/:id`              | Удаление курса                            |

Пейлоад записи: `CourseWritePayload` (`title`, `description`, `published`, `languagePair?`, `lessons[]`, `authoring?`).

### Экспорт-пакет (`CourseExportBundle`)

Используется инструментами автора (экспорт в CourseBundle JSON, PDF):

```typescript
type CourseExportBundle = {
  catalog: CourseCatalogState;         // курсы + уроки (seed + overlay)
  scenarios: readonly Scenario[];      // все сценарии
  cards: readonly Card[];              // все карточки
  cardIndexMeta: Record<string, CardIndexMetaOverride>; // метаданные индекса
};
```

## Аутентификация (`/auth`)

Реализация: `AuthApiService` · порт `AuthPort` · стор `AuthStore` · хранилище `AuthTokenStorage` (sessionStorage).

| Метод   | Путь            | Описание                                        |
| ------- | --------------- | ----------------------------------------------- |
| POST    | `/auth/login`   | Вход по `{ email, password }` → `AuthSession`   |
| POST    | `/auth/refresh` | Обновление токенов по `{ refreshToken }` → `AuthTokens` |
| POST    | `/auth/logout`  | Выход (best-effort)                             |

Типы: `AuthSession` (`user` + `tokens`), `AuthTokens` (`accessToken`, `refreshToken`, `expiresAt`).

Поток:
- `AuthStore.restoreSession()` — при старте приложения (только при `environment.authEnabled`): валидный access-токен → сессия; истёкший → refresh.
- `authRefreshInterceptor` — при ответе 401 (кроме `/auth/*`) выполняет single-flight refresh и повторяет запрос с новым токеном.
- Токены хранятся в `sessionStorage` (не переживают закрытие вкладки).

## Mock vs реальный бэкенд

- Dev: `useCardsApiMock` / `useScenariosApiMock` / `useCoursesApiMock` = `true` — ответы отдают mock-интерсепторы (данные: content seed + user overlay в `localStorage`).
- Production: флаги `false` — запросы идут на `environment.apiUrl` реального бэкенда.
- Auth: `authEnabled` = `false` в dev (mock-бэкенд не требует токенов); `true` в production включает restore-сессии и refresh-интерсептор.
- Контракт должен совпадать: порты + conformance-тесты (`*.port.conformance.spec.ts`) проверяют, что API-сервис и mock-хендлер структурно реализуют один и тот же порт.
- Слой legacy-хранилищ (`courses-storage`, `scenarios-storage`, `CardRepository`) — внутренняя реализация mock-бэкенда; фронтенд через API-сервисы.
