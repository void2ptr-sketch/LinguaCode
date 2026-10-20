# Форматы начальных данных: courses, scenarios, cards

Документ описывает форматы JSON-файлов начальных данных (content seed) в каталоге [`public/data/`](../../public/data/):

| Каталог                                      | Содержимое                 | Тип фикстуры (TypeScript)                                              |
| -------------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| [`public/data/courses/`](../../public/data/courses)   | Курсы и уроки              | [`CoursesSeedFixture`](../../src/app/entities/content-seed/content-seed.types.ts:34) |
| [`public/data/scenarios/`](../../public/data/scenarios) | Сценарии                   | [`ScenariosSeedFixture`](../../src/app/entities/content-seed/content-seed.types.ts:24) |
| [`public/data/cards/`](../../public/data/cards)       | Карточки                   | [`CardsSeedFixture`](../../src/app/entities/content-seed/content-seed.types.ts:47) |

Все файлы — UTF-8, валидный JSON. Поля, помеченные «опц.», могут отсутствовать.

---

## 1. Как данные загружаются

1. [`ContentSeedRepository`](../../src/app/entities/content-seed/content-seed.repository.ts:78) при первом запуске читает манифест [`public/data/content-manifest.json`](../../public/data/content-manifest.json):
   ```json
   {
     "version": 12,
     "cardFiles": ["/cards/demo-cards.json"],
     "scenarioFiles": ["/scenarios/demo-scenarios.json"],
     "courseFiles": ["/courses/demo-courses.json"]
   }
   ```
2. Файлы, перечисленные в манифесте, загружаются, нормализуются и кэшируются (in-memory + снапшот в IndexedDB).
3. **Версионирование:** при любом изменении контента нужно увеличивать `version` в манифесте — иначе приложение продолжит использовать старый снапшот.
4. Файлы, которые не перечислены в манифесте, приложением не загружаются (могут использоваться скриптами импорта).

Связи между сущностями:

```
Course (courses/*.json)
 └── lessonIds[] → Lesson (courses/*.json)
                    └── scenarioIds[] → Scenario (scenarios/*.json)
                                         └── cardSource.cardIds[] → Card (cards/*.json)
```

---

## 2. Файлы курсов — `public/data/courses/*.json`

Файл содержит **два** массива: курсы и уроки этих курсов.

```json
{
  "courses": [ /* Course[] */ ],
  "lessons": [ /* Lesson[] */ ]
}
```

### 2.1. Объект `Course`

Тип: [`Course`](../../src/app/entities/course/model/course.types.ts:17).

| Поле              | Тип                                         | Обязат. | Описание                                                        |
| ----------------- | ------------------------------------------- | ------- | --------------------------------------------------------------- |
| `id`              | `string`                                    | да      | Уникальный идентификатор курса (например `course-cpp-complete`). |
| `title`           | `string`                                    | да      | Название курса, показывается в каталоге.                         |
| `description`     | `string`                                    | да      | Описание курса из каталога.                                      |
| `authorId`        | `string`                                    | да      | ID автора; у seed-контента — `"system"`.                         |
| `languagePair`    | `{ known, learning }`                       | да      | Пара языков: `known` — известный, `learning` — изучаемый.        |
| `lessonIds`       | `string[]`                                  | да      | ID уроков курса **в порядке следования**.                        |
| `published`       | `boolean`                                   | да      | `true` — курс виден в каталоге.                                  |
| `updatedAt`       | `string` (ISO 8601)                         | да      | Дата последнего обновления, например `2026-06-14T12:00:00.000Z`. |
| `authoring`       | [`CourseAuthoring`](#authoring)             | опц.    | Идея автора и статус пайплайна генерации (не показывается в каталоге). |
| `practiceSettings`| [`CoursePracticeSettings`](#practicesettings) | опц.    | Настройки вкладки «Практика» (по умолчанию — guided).            |

<a id="authoring"></a>
**`CourseAuthoring`** — [`course-authoring.types.ts`](../../src/app/entities/course/model/course-authoring.types.ts:13)

| Поле             | Тип                                   | Описание                                             |
| ---------------- | ------------------------------------- | ---------------------------------------------------- |
| `idea`           | `string`                              | Текст идеи курса (основа для генерации уроков).      |
| `status`         | `'draft' \| 'planned' \| 'generating' \| 'materialized' \| 'failed'` | Статус пайплайна генерации.                          |
| `ideaUpdatedAt`  | `string` (ISO 8601), опц.             | Время последнего изменения идеи.                     |
| `materializedAt` | `string` (ISO 8601), опц.             | Время последней материализации (генерации контента). |
| `lastError`      | `string`, опц.                        | Текст последней ошибки генерации (при `status = 'failed'`). |

<a id="practicesettings"></a>
**`CoursePracticeSettings`** — [`course-practice.types.ts`](../../src/app/entities/course/model/course-practice.types.ts:18)

| Поле                         | Тип                       | Описание                                                        |
| ---------------------------- | ------------------------- | --------------------------------------------------------------- |
| `mode`                       | `'guided' \| 'open'`      | `guided` — линейно: урок → сценарии урока; `open` — свободный выбор. |
| `requireLessonForScenarios`  | `boolean`, опц.           | В `open`-режиме: сценарии доступны только из урока.             |
| `enforceLessonPrerequisites` | `boolean`, опц.           | В `open`-режиме: уроки блокируются пререквизитами.              |
| `allowDifficultyFilter`      | `boolean`, опц.           | Показывать чипы сложности на вкладке «Сценарии».                |

### 2.2. Объект `Lesson`

Тип: [`Lesson`](../../src/app/entities/course/model/lesson.types.ts:7).

| Поле                    | Тип                | Обязат. | Описание                                                        |
| ----------------------- | ------------------ | ------- | --------------------------------------------------------------- |
| `id`                    | `string`           | да      | Уникальный идентификатор урока.                                 |
| `courseId`              | `string`           | да      | ID курса, которому принадлежит урок.                            |
| `title`                 | `string`           | да      | Название урока.                                                 |
| `description`           | `string`           | да      | Описание урока.                                                 |
| `scenarioIds`           | `string[]`         | да      | ID сценариев урока в порядке прохождения.                       |
| `prerequisiteLessonIds` | `string[]`         | да      | ID уроков, которые нужно пройти до этого. Пустой массив — нет пререквизитов. |
| `order`                 | `number`           | да      | Порядковый номер урока в курсе (с 0).                           |
| `updatedAt`             | `string` (ISO 8601)| да      | Дата последнего обновления.                                     |

> См. пример: [`public/data/courses/demo-courses.json`](../../public/data/courses/demo-courses.json).

---

## 3. Файлы сценариев — `public/data/scenarios/*.json`

Файл содержит один массив:

```json
{
  "scenarios": [ /* Scenario[] */ ]
}
```

### 3.1. Объект `Scenario`

Тип: [`Scenario`](../../src/app/entities/scenario/model/scenario.types.ts:10).

| Поле           | Тип                                       | Обязат. | Описание                                                           |
| -------------- | ----------------------------------------- | ------- | ------------------------------------------------------------------ |
| `id`           | `string`                                  | да      | Уникальный идентификатор сценария.                                 |
| `title`        | `string`                                  | да      | Название сценария.                                                 |
| `description`  | `string`                                  | да      | Описание сценария.                                                 |
| `authorId`     | `string`                                  | да      | ID автора (`"system"` у seed-контента).                            |
| `cardSource`   | [`ScenarioCardSource`](#cardsource)      | да      | Источник карточек сценария: фиксированный список, критерии или снапшот. |
| `published`    | `boolean`                                 | да      | `true` — сценарий опубликован.                                     |
| `updatedAt`    | `string` (ISO 8601)                       | да      | Дата последнего обновления.                                        |
| `languagePair` | `{ known, learning }`, опц.               | опц.    | Пара языков сценария.                                              |
| `courseId`     | `string`, опц.                            | опц.    | ID курса, к которому относится сценарий.                           |

<a id="cardsource"></a>
### 3.2. `cardSource` — [`ScenarioCardSource`](../../src/app/entities/scenario/model/scenario-card-source.types.ts:17)

Три режима (дискриминирующее поле `mode`):

**a) `fixed`** — фиксированный список карточек:

```json
{ "mode": "fixed", "cardIds": ["select-1", "select-2"] }
```

| Поле      | Тип        | Описание                                |
| --------- | ---------- | --------------------------------------- |
| `mode`    | `"fixed"`  | Режим.                                  |
| `cardIds` | `string[]` | ID карточек в порядке выполнения (непустой список). |

**b) `criteria`** — динамическая выборка по критериям поиска (выполняется при каждом запуске):

```json
{
  "mode": "criteria",
  "criteria": { "knownLanguage": "ru", "learningLanguage": "zh", "kinds": ["select"] },
  "limit": 10,
  "sort": "random",
  "seed": "my-seed"
}
```

| Поле       | Тип                                        | Описание                                                        |
| ---------- | ------------------------------------------ | --------------------------------------------------------------- |
| `mode`     | `"criteria"`                               | Режим.                                                          |
| `criteria` | [`CardSearchCriteria`](#criteria) (без `page`) | Фильтры отбора карточек (хотя бы один фильтр обязателен).       |
| `limit`    | `number`, опц.                             | Максимум карточек (по умолчанию `DEFAULT_CRITERIA_LIMIT`).      |
| `sort`     | `'updatedAt' \| 'difficulty' \| 'random'`, опц. | Порядок карточек; по умолчанию `updatedAt`.               |
| `seed`     | `string`, опц.                             | Сид перемешивания для `sort = 'random'` (детерминированный порядок). |

**c) `snapshot`** — «замороженный» результат выборки (карточки зафиксированы на момент генерации):

```json
{
  "mode": "snapshot",
  "cardIds": ["scenario-cpp-basics-intro-01-card-01"],
  "criteria": {},
  "limit": 20,
  "frozenAt": "2026-06-14T12:00:00.000Z"
}
```

| Поле       | Тип                                        | Описание                                          |
| ---------- | ------------------------------------------ | ------------------------------------------------- |
| `mode`     | `"snapshot"`                               | Режим.                                            |
| `cardIds`  | `string[]`                                 | Зафиксированный список ID карточек.               |
| `criteria` | [`CardSearchCriteria`](#criteria) (без `page`), опц. | Критерии, по которым был получен снапшот. |
| `limit`    | `number`, опц.                             | Лимит на момент создания снапшота.                |
| `frozenAt` | `string` (ISO 8601)                        | Дата «заморозки» выборки.                         |

<a id="criteria"></a>
### 3.3. Критерии поиска карточек — [`CardSearchCriteria`](../../src/app/entities/card/model/card-search.types.ts:12)

Поле `criteria` (без обязательного `page`) принимает:

| Поле              | Тип                                | Описание                                              |
| ----------------- | ---------------------------------- | ----------------------------------------------------- |
| `query`           | `string`, опц.                     | Свободный текстовый поиск.                            |
| `knownLanguage`   | `ContentLanguage`, опц.            | Язык, который знает пользователь.                     |
| `learningLanguage`| `ContentLanguage`, опц.            | Изучаемый язык.                                       |
| `difficulty`      | `'beginner' \| 'intermediate' \| 'advanced'`, опц. | Уровень сложности.                   |
| `kinds`           | `CardKind[]`, опц.                 | Типы карточек (см. [раздел 4.3](#kinds)).             |
| `tags`            | `string[]`, опц.                   | Каталожные теги.                                      |
| `courseId`        | `string`, опц.                     | Фильтр по курсу.                                      |
| `lessonId`        | `string`, опц.                     | Фильтр по уроку.                                      |
| `scenarioId`      | `string`, опц.                     | Фильтр по сценарию.                                   |

### 3.4. Нормализация и устаревшие поля

При загрузке каждый сценарий проходит через [`normalizeScenario`](../../src/app/entities/scenario/utils/scenario-card-source.utils.ts:66):

- если `cardSource` отсутствует, создаётся `{ mode: 'fixed', cardIds: cardIds ?? [] }` (поддержка legacy-контента);
- если `published` отсутствует — подставляется `false`, `updatedAt` — текущее время.

Дополнительные поля в объектах сценария (например `order`, `lessonId`, `cardCount`, `authoring`, `cards`), встречающиеся в файлах, сгенерированных курсом C++, приложением **игнорируются** — они не входят в тип `Scenario`.

> См. примеры: [`public/data/scenarios/demo-scenarios.json`](../../public/data/scenarios/demo-scenarios.json) (режим `fixed`), [`public/data/scenarios/cpp-basics-intro-history.json`](../../public/data/scenarios/cpp-basics-intro-history.json) (режим `snapshot`).

---

## 4. Файлы карточек — `public/data/cards/*.json`

Файл содержит массив карточек; поле `scenarioId` на верхнем уровне — необязательное служебное (не потребляется приложением):

```json
{
  "scenarioId": "demo-scenario",
  "cards": [ /* Card[] */ ]
}
```

### 4.1. Общие поля всех карточек (`CardBase`)

Тип: [`CardBase`](../../src/app/entities/card/model/card.types.ts:44). Эти поля есть у карточки любого типа:

| Поле         | Тип                                                             | Описание                                                          |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `id`         | `string`                                                        | Уникальный ID карточки.                                           |
| `kind`       | [`CardKind`](#kinds)                                            | Тип карточки (определяет остальные поля).                         |
| `title`      | `string`                                                        | Название карточки.                                                |
| `appearance` | `{ theme: string; fontSize: 'sm' \| 'md' \| 'lg' }`             | Оформление: тема (например `azure-blue`) и размер шрифта.         |
| `meta`       | [`CardIndexMetaOverride`](#meta)                                | Метаданные для каталога и фильтров.                               |
| `courseId`   | `string`, опц.                                                  | ID курса.                                                         |
| `lessonId`   | `string`, опц.                                                  | ID урока.                                                         |
| `scenarioId` | `string`, опц.                                                  | ID сценария.                                                      |

<a id="meta"></a>
**`meta`** — [`CardIndexMetaOverride`](../../src/app/entities/card/model/card-index.types.ts:52) (подмножество полей индекса):

| Поле               | Тип                                          | Описание                              |
| ------------------ | -------------------------------------------- | ------------------------------------- |
| `knownLanguage`    | `ContentLanguage`                            | Язык, который знает пользователь: `'en' \| 'zh' \| 'ru' \| 'perl' \| 'java' \| 'cpp'`. |
| `learningLanguage` | `ContentLanguage`                            | Изучаемый язык (тот же набор).        |
| `difficulty`       | `'beginner' \| 'intermediate' \| 'advanced'` | Уровень сложности.                    |
| `tags`             | `string[]`                                   | Каталожные теги (тема, подтема).      |
| `updatedAt`        | `string` (ISO 8601), опц.                    | Дата обновления карточки.             |

### 4.2. Общие вспомогательные типы

**`direction`** — [`CardDirection`](../../src/app/entities/language-pair/model/language-pair.types.ts:21):

- `'known-to-learning'` — вопрос на известном языке, ответ на изучаемом;
- `'learning-to-known'` — наоборот.

**`PhoneticLexeme`** — [`phonetic-content.types.ts`](../../src/app/entities/phonetic/model/phonetic-content.types.ts:73) (поле `promptLexeme`, `optionsLexemes`, `symbolLexemes`, `learningLexeme` и т.п.):

| Поле               | Тип                                          | Описание                                        |
| ------------------ | -------------------------------------------- | ----------------------------------------------- |
| `primary`          | `string`                                     | Основной текст (слово, иероглиф).               |
| `script`           | `'latn' \| 'hani' \| 'bopo' \| 'hira' \| 'kana' \| 'hang' \| 'cyrl'` | Код письменности (ISO 15924). |
| `pinyin`           | `string`, опц.                               | Пиньинь (китайский).                            |
| `zhuyin`           | `string`, опц.                               | Чжуинь (бопомофо).                              |
| `palladius`        | `string`, опц.                               | Транскрипция Палладия (русская).                |
| `ipa`              | `string \| IpaVariant[]`, опц.               | IPA-транскрипция: строка или массив вариантов.  |
| `glossKnown`       | `string`, опц.                               | Глосса на известном языке.                      |
| `audioUrl`         | `string`, опц.                               | URL аудиофайла.                                 |
| `tones`            | `number[]` (1–5), опц.                       | Тоны.                                           |
| `acceptedReadings` | `string[]`, опц.                             | Допустимые варианты чтения.                     |

**`IpaVariant`** (элемент массива `ipa`): `{ transcription: string; label?: string; locale?: string }` — вариант транскрипции (например `BrE`/`AmE`).

**`CodeBlock`** — для карточек с кодом (поле `prompt`, `code`, элементы `options`):

| Поле      | Тип      | Описание                                      |
| --------- | -------- | --------------------------------------------- |
| `code`    | `string` | Текст исходного кода (с `\n`).                |
| `language`| `'perl' \| 'cpp' \| 'java' \| 'javascript' \| 'typescript' \| 'python' \| 'sql' \| 'bash' \| 'rust' \| 'go' \| 'plain'` | Язык для подсветки синтаксиса. |

### 4.3. Типы карточек (`CardKind`) — 13 видов

<a id="kinds"></a>
`'select' | 'code-select' | 'memory' | 'symbol' | 'sound' | 'timed' | 'keyboard' | 'draw' | 'tone' | 'reading' | 'flip' | 'cloze' | 'code-trace'`

Ниже — специфичные поля для каждого типа (в дополнение к `CardBase`).

**`select`** — выбор правильного перевода из вариантов. [`SelectCard`](../../src/app/entities/card/model/card.types.ts:138)

| Поле             | Тип               | Описание                                              |
| ---------------- | ----------------- | ----------------------------------------------------- |
| `direction`      | `CardDirection`   | Направление.                                          |
| `promptKnown`    | `string`          | Вопрос.                                               |
| `optionsLearning`| `string[]`        | Варианты ответа на изучаемом языке.                   |
| `optionsKnown`   | `string[]`, опц.  | Варианты на известном языке (для направления learning-to-known). |
| `optionsLexemes` | `PhoneticLexeme[]`, опц. | Лексемы вариантов (для фонетических подписей). |
| `correctIndex`   | `number`          | Индекс правильного ответа (с 0).                      |
| `promptLexeme`   | `PhoneticLexeme`, опц. | Лексема вопроса.                                |

**`code-select`** — выбор корректного фрагмента кода. [`CodeSelectCard`](../../src/app/entities/card/model/card.types.ts:124)

| Поле           | Тип                | Описание                                          |
| -------------- | ------------------ | ------------------------------------------------- |
| `caption`      | `string`, опц.     | Пояснение к заданию.                              |
| `prompt`       | `CodeBlock`        | Код-вопрос.                                       |
| `options`      | `CodeBlock[]`      | Варианты кода.                                    |
| `correctIndex` | `number`           | Индекс правильного варианта.                      |

**`memory`** — сопоставление пар «известный → изучаемый». [`MemoryCard`](../../src/app/entities/card/model/card.types.ts:156)

| Поле          | Тип                           | Описание                              |
| ------------- | ----------------------------- | ------------------------------------- |
| `promptKnown` | `string`                      | Инструкция.                           |
| `pairs`       | `{ known: string; learning: string; learningLexeme?: PhoneticLexeme }[]` | Пары для сопоставления. |

**`symbol`** — выбор символа по значению. [`SymbolCard`](../../src/app/entities/card/model/card.types.ts:169)

| Поле             | Тип                        | Описание                                        |
| ---------------- | -------------------------- | ----------------------------------------------- |
| `direction`      | `CardDirection`            | Направление.                                    |
| `promptKnown`    | `string`                   | Вопрос.                                         |
| `symbols`        | `string[]`                 | Символы-варианты (эмодзи, иероглифы).           |
| `optionsKnown`   | `string[]`, опц.           | Варианты названий на известном языке.           |
| `symbolLexemes`  | `PhoneticLexeme[]`, опц.   | Лексемы символов.                               |
| `correctIndex`   | `number`                   | Индекс правильного ответа.                      |

**`sound`** — распознавание слова на слух. [`SoundCard`](../../src/app/entities/card/model/card.types.ts:186)

| Поле                | Тип                        | Описание                                          |
| ------------------- | -------------------------- | ------------------------------------------------- |
| `direction`         | `CardDirection`            | Направление.                                      |
| `promptKnown`       | `string`                   | Инструкция.                                       |
| `audioLabelLearning`| `string`                   | Текст, который озвучивается.                      |
| `optionsKnown`      | `string[]`                 | Варианты ответа на известном языке.               |
| `optionsLexemes`    | `PhoneticLexeme[]`, опц.   | Лексемы вариантов.                                |
| `correctIndex`      | `number`                   | Индекс правильного ответа.                        |
| `audioUrl`          | `string`, опц.             | Прямая ссылка на аудио (если не синтезировать).   |

**`timed`** — ответ с ограничением по времени. [`TimedCard`](../../src/app/entities/card/model/card.types.ts:203)

| Поле              | Тип                     | Описание                                       |
| ----------------- | ----------------------- | ---------------------------------------------- |
| `direction`       | `CardDirection`         | Направление.                                   |
| `promptKnown`     | `string`                | Вопрос.                                        |
| `optionsLearning` | `string[]`              | Варианты ответа на изучаемом языке.            |
| `optionsKnown`    | `string[]`, опц.        | Варианты на известном языке.                   |
| `optionsLexemes`  | `PhoneticLexeme[]`, опц.| Лексемы вариантов.                             |
| `correctIndex`    | `number`                | Индекс правильного ответа.                     |
| `timeLimitSec`    | `number`                | Лимит времени в секундах.                      |

**`keyboard`** — ввод ответа с клавиатуры. [`KeyboardCard`](../../src/app/entities/card/model/card.types.ts:230)

| Поле                   | Тип                            | Описание                                       |
| ---------------------- | ------------------------------ | ---------------------------------------------- |
| `direction`            | `CardDirection`                | Направление.                                   |
| `promptKnown`          | `string`                       | Вопрос.                                        |
| `acceptedAnswersKnown` | `string[]`                     | Допустимые ответы на известном языке.          |
| `acceptedAnswersLearning` | `string[]`, опц.            | Допустимые ответы на изучаемом языке.          |
| `answerMode`           | `'text' \| 'ipa' \| 'pinyin' \| 'auto'`, опц. | Режим ввода.                    |
| `promptLexeme`         | `PhoneticLexeme`, опц.         | Лексема вопроса.                               |

**`draw`** — рисование символа (китайские иероглифы). [`DrawCard`](../../src/app/entities/card/model/card.types.ts:247)

| Поле                | Тип                                     | Описание                                                   |
| ------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `promptKnown`       | `string`                                | Инструкция «Нарисуйте …».                                  |
| `referenceHintKnown`| `string`                                | Подсказка-перевод.                                         |
| `meaningKnown`      | `string`, опц.                          | Значение, показываемое без самого символа.                 |
| `practiceMode`      | `'freehand' \| 'memory' \| 'tracing' \| 'hints' \| 'stroke-order' \| 'radicals'`, опц. | Режим практики. |
| `targetCharacter`   | `string`, опц.                          | Целевой символ (один).                                     |
| `strokeGuides`      | `{ order: number; path: string }[]`, опц. | Подсказки штрихов (SVG path, viewBox 0 0 100 100).      |
| `radicalHint`       | `string`, опц.                          | Подсказка по радикалам (например `女 + 子`).               |
| `characterTargets`  | [`DrawCharacterTarget[]`](#drawtarget), опц. | Цели по вкладкам (несколько символов).             |
| `promptLexeme`      | `PhoneticLexeme`, опц.                  | Лексема символа (пиньинь и т.д.).                          |

<a id="drawtarget"></a>
**`DrawCharacterTarget`**: `{ character: string; pinyin?: string; zhuyin?: string; palladius?: string; glossKnown?: string; strokeGuides?: DrawStrokeGuide[]; radicalHint?: string; audioUrl?: string }`.

**`tone`** — определение тона слога (китайский). [`ToneCard`](../../src/app/entities/card/model/card.types.ts:268)

| Поле           | Тип                  | Описание                                    |
| -------------- | -------------------- | ------------------------------------------- |
| `direction`    | `CardDirection`      | Направление.                                |
| `promptKnown`  | `string`             | Вопрос.                                     |
| `syllableBase` | `string`             | Слог без тона (например `ma`).              |
| `toneOptions`  | `number[]` (1–5)     | Варианты тонов (например `[1, 2, 3, 4]`).    |
| `correctIndex` | `number`             | Индекс правильного тона.                    |
| `promptLexeme` | `PhoneticLexeme`, опц. | Лексема вопроса.                          |

**`reading`** — чтение с выбором интерпретации (полифония). [`ReadingCard`](../../src/app/entities/card/model/card.types.ts:284)

| Поле              | Тип                          | Описание                                          |
| ----------------- | ---------------------------- | ------------------------------------------------- |
| `direction`       | `CardDirection`              | Направление.                                      |
| `promptKnown`     | `string`                     | Контекст/вопрос.                                  |
| `optionsLearning` | `string[]`                   | Варианты чтения/интерпретаций на изучаемом языке. |
| `optionsKnown`    | `string[]`, опц.             | Варианты на известном языке.                      |
| `optionsLexemes`  | `PhoneticLexeme[]`, опц.     | Лексемы вариантов.                                |
| `correctIndex`    | `number`                     | Индекс правильного ответа.                        |

**`flip`** — классическая карточка-переворот (самооценка). [`FlipCard`](../../src/app/entities/card/model/card.types.ts:303)

| Поле          | Тип                    | Описание                                        |
| ------------- | ---------------------- | ----------------------------------------------- |
| `front`       | `string`               | Лицевая сторона (известный язык).               |
| `frontLexeme` | `PhoneticLexeme`, опц. | Лексема лицевой стороны.                        |
| `back`        | `string`               | Оборотная сторона (изучаемый язык).             |
| `backLexeme`  | `PhoneticLexeme`, опц. | Лексема оборотной стороны.                      |
| `audioUrl`    | `string`, опц.         | Аудио к карточке.                               |

**`cloze`** — заполнение пропуска в предложении (два режима: выбор или ввод). [`ClozeCard`](../../src/app/entities/card/model/card.types.ts:322)

| Поле            | Тип                 | Описание                                                     |
| --------------- | ------------------- | ------------------------------------------------------------ |
| `promptKnown`   | `string`            | Текст с пропуском (например `I ___ coffee every morning.`).  |
| `options`       | `string[]`, опц.    | Варианты — **режим выбора** (тогда обязателен `correctIndex`). |
| `correctIndex`  | `number`, опц.      | Индекс правильного варианта (режим выбора).                  |
| `correctAnswer` | `string`            | Правильный ответ (используется в обоих режимах).             |
| `acceptedAnswers` | `string[]`, опц.   | Дополнительные допустимые ответы (режим ввода).              |

**`code-trace`** — «что выведет программа?». [`CodeTraceCard`](../../src/app/entities/card/model/card.types.ts:344)

| Поле            | Тип               | Описание                                   |
| --------------- | ----------------- | ------------------------------------------ |
| `caption`       | `string`, опц.    | Пояснение.                                 |
| `question`      | `string`, опц.    | Вопрос (например «Что выведет программа?»).|
| `code`          | `CodeBlock`       | Код программы.                             |
| `outputOptions` | `string[]`        | Варианты вывода.                           |
| `correctIndex`  | `number`          | Индекс правильного ответа.                 |

### 4.4. Примеры

`select` (см. [`public/data/cards/demo-cards.json`](../../public/data/cards/demo-cards.json)):

```json
{
  "id": "select-1",
  "kind": "select",
  "title": "Приветствие",
  "courseId": "demo-course",
  "lessonId": "demo-lesson-2",
  "scenarioId": "demo-scenario",
  "appearance": { "theme": "azure-blue", "fontSize": "md" },
  "direction": "known-to-learning",
  "promptKnown": "Как сказать «Привет» по-английски?",
  "optionsLearning": ["Hello", "Goodbye", "Thanks", "Please"],
  "optionsKnown": ["Привет", "Пока", "Спасибо", "Пожалуйста"],
  "correctIndex": 0,
  "meta": {
    "knownLanguage": "ru",
    "learningLanguage": "en",
    "difficulty": "beginner",
    "tags": []
  }
}
```

`draw` с китайскими лексемами:

```json
{
  "id": "draw-ren-1",
  "kind": "draw",
  "title": "Иероглиф 人",
  "promptKnown": "Нарисуйте иероглиф «人» (человек)",
  "referenceHintKnown": "человек",
  "meaningKnown": "человек",
  "practiceMode": "stroke-order",
  "targetCharacter": "人",
  "promptLexeme": {
    "primary": "人",
    "script": "hani",
    "pinyin": "rén",
    "zhuyin": "ㄖㄣˊ",
    "palladius": "жэнь",
    "ipa": "ʐən˧˥"
  },
  "meta": { "knownLanguage": "ru", "learningLanguage": "zh", "difficulty": "beginner", "tags": [] }
}
```

---

## 5. Устаревшие форматы и нормализация карточек

Карточки загружаются через [`normalizeLegacyCards`](../../src/app/entities/card/mapping/card-legacy.mapper.ts:184): неизвестные/устаревшие поля приводятся к современному виду.

### 5.1. `kind: "multiple-choice"` (генератор курса C++)

Файлы курса C++ (например [`public/data/cards/cpp-basics-intro-hello-world-cards.json`](../../public/data/cards/cpp-basics-intro-hello-world-cards.json)) содержат карточки в формате генератора — они **не входят** в доменный `CardKind` и нормализуются в `select`:

```json
{
  "id": "scenario-cpp-basics-intro-02-card-01",
  "kind": "multiple-choice",
  "title": "Hello World - Вопрос 1",
  "appearance": { "theme": "azure-blue", "fontSize": "md" },
  "caption": "Какая функция является точкой входа в C++ программу?",
  "options": [
    { "id": "a", "text": "main()" },
    { "id": "b", "text": "start()" }
  ],
  "correctOptionId": "a",
  "explanation": "main() - обязательная функция...",
  "authoring": { "status": "materialized", "ideaUpdatedAt": "...", "materializedAt": "..." },
  "languagePair": { "known": "ru", "learning": "cpp" },
  "published": true
}
```

Правила преобразования:

| Исходное поле            | Результат                                             |
| ------------------------ | ----------------------------------------------------- |
| `kind: "multiple-choice"` | `kind: "select"`                                     |
| `caption` / `title`      | `promptKnown` (если нет `promptKnown`)                |
| `options` (`{id,text}[]`)| `optionsLearning` = `text` в том же порядке           |
| `correctOptionId`        | `correctIndex` = индекс варианта с этим `id` (иначе `0`) |
| `direction`              | по умолчанию `known-to-learning`                      |

> Поля `explanation`, `authoring`, `languagePair`, `published` не входят в `Card` и после нормализации игнорируются.

### 5.2. Устаревшие имена полей

Для остальных типов действуют подстановки по умолчанию (логика [`normalizeLegacyCard`](../../src/app/entities/card/mapping/card-legacy.mapper.ts:67)):

| Тип карточки | Подстановки                                                  |
| ------------ | ------------------------------------------------------------ |
| `select`     | `promptKnown ← question`; `optionsLearning ← options`; `direction ← 'known-to-learning'` |
| `memory`     | `promptKnown ← prompt`; пара `{ back, front }` → `{ known: back, learning: front }` |
| `symbol`     | `promptKnown ← prompt`; `direction` по умолчанию             |
| `sound`      | `audioLabelLearning ← audioLabel`; `optionsKnown ← options`  |
| `timed`      | `promptKnown ← question`; `optionsLearning ← options`        |
| `keyboard`   | `acceptedAnswersKnown ← acceptedAnswers`                     |
| `draw`       | `referenceHintKnown ← referenceHint`                         |
| `flip`       | пустые `front` / `back` → `""`                               |
| `cloze`      | `promptKnown ← prompt`; `correctAnswer` по умолчанию `""`    |
| `code-trace` | `outputOptions ← options`; `correctIndex` по умолчанию `0`   |

---

## 6. Чек-лист при добавлении нового контента

1. Создать/обновить JSON-файлы в `public/data/courses|scenarios|cards`.
2. Соблюсти связи ID: `course.lessonIds` → `lesson.id`, `lesson.scenarioIds` → `scenario.id`, `scenario.cardSource.cardIds` → `card.id`.
3. Добавить пути файлов в `public/data/content-manifest.json` и **увеличить `version`**.
4. Проверить, что `card.kind` входит в 13 доменных типов (либо это legacy `multiple-choice`, который нормализуется).
5. Убедиться, что в каждом `meta` заполнены `knownLanguage`, `learningLanguage`, `difficulty`, `tags`.