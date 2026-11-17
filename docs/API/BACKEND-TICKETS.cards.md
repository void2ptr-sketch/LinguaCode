# Backend tickets: интеграция диалога карточки (`education_cards`)

Статус: **бэкенд-контракт реализован; фронтенд интегрирован** (проверено по сгенерированному OpenAPI).
Область: `Проводник контента` → диалог `Редактирование` (карточки), режимы create/edit.
Источник схемы: `app_data.education_cards` (PostgreSQL).
Текущий фронтенд-контракт: [`src/app/entities/card/model/card-backend-dto.types.ts`](../../src/app/entities/card/model/card-backend-dto.types.ts), [`src/app/entities/card/api/cards-api.service.ts`](../../src/app/entities/card/api/cards-api.service.ts), [`src/app/entities/card/model/card-backend-adapter.ts`](../../src/app/entities/card/model/card-backend-adapter.ts).

---

## 1. Итоговая оценка готовности

Контракт `education_cards` **реализован на бэкенде** и проверен по сгенерированному OpenAPI
(`src/app/shared/api/generated/`). Фронтенд-интеграция выполнена.

| Блок                                | Готовность | Комментарий                                                                                                                                |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Чтение карточки (`GET /cards/{id}`) | Готово     | `languagePairId`, `programId`, `published`, `order` присутствуют; `difficulty=EXPERT` поддержан                                            |
| Создание (`POST /cards`)            | Готово     | Принимает иерархию, языковую пару, `published`, `slug`, `order`; `id`/`authorId` не передаются                                             |
| Обновление (`PUT /cards/{id}`)      | Готово     | `requiredTier` опционален; метаданные и иерархия передаются                                                                                |
| Привязка к сценарию                 | Готово     | `ScenarioCardsService`: `POST/DELETE/PATCH /scenarios/{id}/cards`                                                                          |
| Поиск/фильтры (`GET /cards/search`) | Готово     | Принимает `languagePairId`, `programId`, `lessonId`, `scenarioId`, `difficulty`, `kinds`, `tags`, `published`, `scope`, `page`, `pageSize` |
| Метаданные                          | Готово     | `tags`, `difficulty`, `requiredTier`, `published`, `slug` читаются и сохраняются                                                           |

---

## 2. Матрица полей `education_cards`

Обозначения: ✅ — поддерживается, ⚠️ — частично/есть нюанс, ❌ — отсутствует.

| Поле БД            | Чтение в `Card`    | Create      | Update      | Что нужно на бэке                                                                          |
| ------------------ | ------------------ | ----------- | ----------- | ------------------------------------------------------------------------------------------ |
| `id`               | ✅                 | — (SERIAL)  | path `{id}` | Игнорировать `id` из тела; генерировать на сервере                                         |
| `kind`             | ✅                 | ✅          | ✅          | Оставить enum, синхронизировать с фронтендом                                               |
| `title`            | ✅                 | ✅ required | ✅ optional | Валидация 1..200                                                                           |
| `language_pair_id` | ❌                 | ❌          | ❌          | Добавить `languagePairId` в `Card`, `CardCreateRequest`, `CardUpdateRequest`; FK-валидация |
| `course_id`        | ✅                 | ❌          | ❌          | Добавить `courseId` в create/update; валидировать существование курса                      |
| `program_id`       | ❌                 | ❌          | ❌          | Добавить `programId` в `Card`, create/update; FK уже есть                                  |
| `lesson_id`        | ✅                 | ❌          | ❌          | Добавить `lessonId` в create/update; FK уже есть                                           |
| `scenario_id`      | ✅                 | ❌          | ❌          | Добавить `scenarioId` в create/update; синхронизировать с `scenario.cardSource`            |
| `data_json`        | ✅ (`dataJson`)    | ✅ optional | ✅ optional | Оставить JSONB-строкой в API                                                               |
| `tags`             | ✅ (`tags` string) | ✅ optional | ✅ optional | Оставить JSONB-строкой; нормализовать массив                                               |
| `difficulty`       | ⚠️                 | ⚠️          | ⚠️          | Добавить `EXPERT` в enum (в БД уже разрешён)                                               |
| `author_id`        | ✅                 | ❌          | ❌          | Брать из JWT; не принимать из тела; проверять ownership на update/delete                   |
| `published`        | ❌                 | ❌          | ❌          | Добавить `published` в `Card`, create/update; default `true`                               |
| `required_tier`    | ✅                 | ✅ required | ⚠️ required | Сделать optional на update (сохранять текущее значение); default `FREE` на create          |
| `search_vector`    | —                  | —           | —           | Только сервер: триггер/обновление при изменении title/tags/data_json                       |
| `created_at`       | ✅                 | —           | —           | Только сервер                                                                              |
| `updated_at`       | ✅                 | —           | —           | Только сервер; не принимать из тела                                                        |
| `slug`             | ✅                 | ❌          | ❌          | Добавить `slug` в create/update; пустой/blank → автогенерация; обеспечить уникальность     |
| `card_order`       | ❌                 | ❌          | ❌          | Добавить `order` в `Card`, create/update; см. раздел 5 про связь со сценарием              |

---

## 3. Изменения REST-контракта

### 3.1. `Card` (response DTO)

Добавить поля:

```json
{
  "id": 123,
  "title": "猫",
  "kind": "SELECT",
  "slug": "cat-select-123",
  "authorId": 7,
  "dataJson": "{\"kind\":\"SELECT\",\"promptKnown\":\"猫\",\"optionsLearning\":[\"cat\",\"dog\"],\"correctIndex\":0}",
  "tags": "[\"hsk1\",\"vocabulary\"]",
  "difficulty": "BEGINNER",
  "requiredTier": "FREE",
  "languagePairId": 1,
  "courseId": 10,
  "programId": 20,
  "lessonId": 30,
  "scenarioId": 40,
  "order": 3,
  "published": true,
  "createdAt": "2026-11-15T10:00:00Z",
  "updatedAt": "2026-11-15T10:00:00Z"
}
```

Требования:

- `difficulty` enum: `BEGINNER | INTERMEDIATE | ADVANCED | EXPERT`.
- `tags` и `dataJson` остаются строками JSON (обратная совместимость с фронтендом).
- `order` — позиция карточки в сценарии; для текущей схемы маппится на `card_order`.
- Все ID-поля nullable.

### 3.2. `CardCreateRequest`

```json
{
  "title": "猫",
  "kind": "SELECT",
  "dataJson": "{\"kind\":\"SELECT\",\"promptKnown\":\"猫\",\"optionsLearning\":[\"cat\",\"dog\"],\"correctIndex\":0}",
  "tags": "[\"hsk1\"]",
  "difficulty": "BEGINNER",
  "requiredTier": "FREE",
  "languagePairId": 1,
  "courseId": 10,
  "programId": 20,
  "lessonId": 30,
  "scenarioId": 40,
  "order": 3,
  "published": true,
  "slug": "cat-select-123"
}
```

Требования:

- Required: `title`, `kind`, `requiredTier`.
- Optional: все остальные перечисленные поля.
- `authorId`, `id`, `createdAt`, `updatedAt` **не принимать** (игнорировать или 400 — зафиксировать поведение).
- `slug`: если `null`/`""`/blank — сгенерировать из `title`, при коллизии добавить суффикс; max 255.
- `order`: если не передан и задан `scenarioId` — вычислить `max(card_order) + 1` в рамках сценария.
- `published`: default `true` (как в БД).
- Если передан `scenarioId` — после создания карточки добавить её `id` в `scenario.cardSource.cardIds` (для `fixed`/`snapshot`), сохранив порядок; для `criteria` — не менять `cardIds`.
- Если передан `courseId`/`programId`/`lessonId`/`languagePairId` — сохранить в карточке; при отсутствии некоторых — заполнить из сценария, если это однозначно.

### 3.3. `CardUpdateRequest`

```json
{
  "title": "猫",
  "kind": "SELECT",
  "dataJson": "{\"kind\":\"SELECT\",\"promptKnown\":\"猫\",\"optionsLearning\":[\"cat\",\"dog\"],\"correctIndex\":0}",
  "tags": "[\"hsk1\"]",
  "difficulty": "EXPERT",
  "requiredTier": "STARTER",
  "languagePairId": 1,
  "courseId": 10,
  "programId": 20,
  "lessonId": 30,
  "scenarioId": 41,
  "order": 1,
  "published": false,
  "slug": "cat-select-123"
}
```

Требования:

- **Исправить контракт:** `requiredTier` на update должен быть **optional**; при отсутствии — сохранять текущее значение. Сейчас OpenAPI помечает его required, а фронтенд его не отправляет.
- Все поля optional (частичное обновление).
- При смене `scenarioId`:
  - удалить `id` карточки из `cardSource.cardIds` старого сценария;
  - добавить в `cardSource.cardIds` нового сценария (в конец, если `order` не задан);
  - обновить `scenario_id`.
- При `published=false` карточка не должна пропадать из авторских выборок (`scope=all`/`published` параметр — см. 3.4).
- `authorId`, `id`, `createdAt`, `updatedAt` не принимать.

### 3.4. Поиск и список

`GET /api/v1/cards/search` — добавить параметры:

| Параметр           | Тип                  | Назначение                                  |
| ------------------ | -------------------- | ------------------------------------------- |
| `query`            | string               | Поиск по title (уже есть)                   |
| `knownLanguage`    | string               | Язык известного (уже есть)                  |
| `learningLanguage` | string               | Язык изучаемого (уже есть)                  |
| `languagePairId`   | int64                | Фильтр по паре                              |
| `courseId`         | int64                | Фильтр по курсу                             |
| `programId`        | int64                | Фильтр по программе                         |
| `lessonId`         | int64                | Фильтр по уроку                             |
| `scenarioId`       | int64                | Фильтр по сценарию                          |
| `difficulty`       | enum                 | `BEGINNER/INTERMEDIATE/ADVANCED/EXPERT`     |
| `kinds`            | string[]             | Несколько типов                             |
| `tags`             | string[]             | Несколько тегов                             |
| `published`        | boolean              | Явный фильтр                                |
| `scope`            | `mine/all/published` | Авторский режим; `all` включает черновики   |
| `page`             | int                  | Плоская пагинация (фронтенд уже отправляет) |
| `pageSize`         | int                  | Плоская пагинация (фронтенд уже отправляет) |

Требования:

- Поддержать `page`/`pageSize` **или** согласовать переход на `pageable`; сейчас фронтенд отправляет `page`/`pageSize`, а OpenAPI ждёт `pageable`.
- Без `query` и без `scope` поведение «только published» сохранить для обратной совместимости, но для Проводника должен работать `scope=all` (или `published=false`).
- `GET /api/v1/cards` — аналогично добавить `scenarioId`, `courseId`, `programId`, `lessonId`, `languagePairId`, `published`, `scope`, `page`, `pageSize`.
- Вернуть facets (опционально, для каталога): `knownLanguages`, `learningLanguages`, `difficulties`, `kinds`, `tags`.

### 3.5. Привязка карточки к сценарию

Рекомендуемые явные endpoint'ы (вместо ручного `PUT /scenarios/{id}`):

| Метод    | Путь                                            | Тело                            | Назначение                               |
| -------- | ----------------------------------------------- | ------------------------------- | ---------------------------------------- |
| `POST`   | `/api/v1/scenarios/{scenarioId}/cards`          | `{ "cardId": 123, "order": 3 }` | Добавить карточку в `cardSource.cardIds` |
| `DELETE` | `/api/v1/scenarios/{scenarioId}/cards/{cardId}` | —                               | Удалить карточку из `cardSource.cardIds` |
| `PATCH`  | `/api/v1/scenarios/{scenarioId}/cards/{cardId}` | `{ "order": 1 }`                | Изменить позицию                         |

Требования:

- Операции атомарные; возвращать обновлённый сценарий или link-объект.
- Для `criteria`-сценариев `POST`/`DELETE` возвращать `409 Conflict` с понятным сообщением.
- Дубликаты `cardId` не создавать.
- `order` нормализовать (>= 1 или 0 — зафиксировать; сейчас в контракте `order >= 1`).
- Если явные endpoint'ы не делаются: как минимум `PUT /scenarios/{id}` должен корректно синхронизировать `card.scenario_id`/`lesson_id`/`course_id`/`program_id` для всех карточек из `cardSource.cardIds`.

### 3.6. Каскады и целостность

| Событие                | Требуемое поведение                                                         |
| ---------------------- | --------------------------------------------------------------------------- |
| Удаление карточки      | Убрать `id` из всех `scenario.cardSource.cardIds`; не оставлять dangling ID |
| Удаление сценария      | `education_cards.scenario_id = NULL` (или `ON DELETE SET NULL`)             |
| Удаление урока         | `education_cards.lesson_id = NULL`                                          |
| Удаление программы     | `education_cards.program_id = NULL`                                         |
| Удаление курса         | `education_cards.course_id = NULL`                                          |
| Удаление языковой пары | Запретить, если есть карточки (или `SET NULL`, если поле nullable)          |

Сейчас FK на `scenario/lesson/program/language_pair` есть, но без `ON DELETE`; удаление родителя может падать. Нужно явно определить политику.

---

## 4. Валидация, права, серверные поля

| Правило                          | Требование                                                          |
| -------------------------------- | ------------------------------------------------------------------- |
| `title`                          | 1..200 символов; trim; не пустой                                    |
| `kind`                           | enum из 13 значений; не менять при update без необходимости         |
| `difficulty`                     | `BEGINNER/INTERMEDIATE/ADVANCED/EXPERT`                             |
| `requiredTier`                   | `FREE/STARTER/GROWTH/PREMIUM`; default `FREE`                       |
| `slug`                           | nullable; blank → null/автогенерация; unique partial index; max 255 |
| `tags`                           | JSON-массив строк; не более N (зафиксировать, например 50)          |
| `data_json`                      | валидный JSON-объект; размер ограничить (например 1 MB)             |
| `author_id`                      | Только из JWT; update/delete — автор или `ROLE_ADMIN`               |
| `published`                      | Менять может автор/админ; создать черновик может автор              |
| `created_at/updated_at`          | Только сервер; `updated_at` обновлять триггером                     |
| `search_vector`                  | Обновлять триггером по `title`, `tags`, `data_json`                 |
| `language_pair_id`               | Должен существовать в `language_pairs`                              |
| `course/program/lesson/scenario` | Должны существовать; желательно проверить согласованность иерархии  |

---

## 5. Порядок карточек (`card_order`) — отдельное решение

В таблице есть `education_cards.card_order`, но карточка может входить в несколько сценариев (сейчас через `scenario.cardSource.cardIds`, в целевой схеме — `scenario_cards`). Нужно выбрать и зафиксировать один вариант:

1. **MVP:** `card_order` хранится в `education_cards`; карточка принадлежит одному сценарию (`scenario_id`). Порядок в других сценариях не поддерживается.
2. **Целевой:** таблица связи `scenario_cards(scenario_id, card_id, card_order)`; `education_cards.card_order` не используется или удаляется. Порядок уникален в рамках сценария.
3. **Компромисс:** `education_cards.card_order` как fallback, `scenario_cards.card_order` как приоритет.

Для диалога карточки достаточно, чтобы `GET /cards/{id}` и `GET /cards/search` возвращали `order`, а create/update принимали `order`. Для Проводника порядок должен совпадать с `scenario.cardSource.cardIds` / `Scenario.resolvedCardIds`.

---

## 6. Миграция и backfill существующих данных

После добавления полей в API:

1. Заполнить `scenario_id` для карточек, которые уже входят в `scenario.cardSource.cardIds` (fixed/snapshot).
2. Заполнить `lesson_id`, `program_id`, `course_id`, `language_pair_id` из найденного сценария.
3. Заполнить `card_order` по позиции в `cardSource.cardIds`.
4. Сгенерировать `slug` для строк с `slug IS NULL`; проверить уникальность.
5. Определить `published` для существующих строк (оставить `true` или взять из сценария/курса).
6. Обновить `search_vector`.

---

## 7. Обновление OpenAPI и генерация

1. Обновить `src/assets/openapi-patched.json`:
   - `Card`, `CardCreateRequest`, `CardUpdateRequest` — новые поля;
   - `difficulty` enum — добавить `EXPERT`;
   - `CardUpdateRequest.requiredTier` — убрать из `required`;
   - `cards.search` / `cards.list` — новые query-параметры;
   - новые endpoint'ы `scenarios/{id}/cards`.
2. Выполнить `npm run generate:api` (orval) и проверить дифф в `src/app/shared/api/generated/`.
3. Приложить примеры запросов/ответов (curl или `.http`) для проверки.

---

## 8. Acceptance criteria для бэкенда

> Контракт реализован; пункты ниже остаются чек-листом для e2e-проверки поведения
> на реальном бэкенде (каскады, права, атомарность переноса между сценариями).

- [ ] `POST /cards` с полным телом сохраняет `language_pair_id`, `course_id`, `program_id`, `lesson_id`, `scenario_id`, `data_json`, `tags`, `difficulty`, `published`, `required_tier`, `slug`, `card_order`.
- [ ] `GET /cards/{id}` возвращает все перечисленные поля, включая `languagePairId`, `programId`, `published`, `order`.
- [ ] `PUT /cards/{id}` без `requiredTier` не возвращает 400 и сохраняет текущий tier.
- [ ] `PUT /cards/{id}` с `scenarioId` переносит карточку между `cardSource.cardIds` старого и нового сценария.
- [ ] `POST /cards` с `scenarioId` добавляет карточку в `cardSource.cardIds` и выставляет `scenario_id`.
- [ ] `difficulty=EXPERT` принимается и возвращается.
- [ ] Пустой `slug` не приводит к нарушению `ux_education_cards_slug`; генерируется уникальный slug.
- [ ] `GET /cards/search?scenarioId=...&scope=all` возвращает карточки сценария, включая неопубликованные.
- [ ] `GET /cards/search` принимает `page`/`pageSize` (или согласован переход на `pageable`).
- [ ] `DELETE /cards/{id}` убирает карточку из всех `scenario.cardSource.cardIds`.
- [ ] Удаление сценария/урока/программы/курса не падает по FK; ссылки в карточках обнуляются.
- [ ] Обновлённая OpenAPI-спецификация отдаётся с `/v3/api-docs` и проходит `npm run generate:api`.

---

## 9. Что фронтенд сделал после готовности бэкенда

- [x] Расширены `Card`, `BackendCardDto`, `BackendCardCreatePayload`, `BackendCardUpdatePayload`.
- [x] `CardBackendAdapter` сохраняет `tags`/`difficulty`/`requiredTier`/`slug`/hierarchy/`order`, отправляет `requiredTier` на update при наличии, не отправляет `id`/`authorId`/пустой `slug`.
- [x] `CardEditorStore` мержит метаданные диалога в payload и публикует `lastSavedCard`.
- [x] В диалог добавлены `requiredTier`, `published`, `slug` (read-only), языковая пара, program select; `updatedAt` только для чтения; `cardMeta` учитывается в dirty-tracking.
- [x] `CardEditorDialogData` расширен контекстом сценария; результат содержит `cardId` и `scenarioId`.
- [x] Проводник контента передаёт контекст сценария, обновляет старый и новый узел сценария после сохранения.
- [x] Mock-интерсепторы и unit-тесты обновлены (adapter, search params, store, dialog, `ScenarioCardsService`).
- [x] Обновлены `ARCHITECTURE.card-editor.md`, `API-CONTRACT.md`, `FEATURES/CONTENT-EXPLORER.md`.
