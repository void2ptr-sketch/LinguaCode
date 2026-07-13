# Пара языков обучения (known → learning)

Обучение в LinguaCode опирается на **два языка контента**: известный пользователю (known) и изучаемый (learning). Это отдельно от **UiLocale** — языка интерфейса приложения (`@angular/localize`, бэклог).

Связанные документы: [INDEX.md](./INDEX.md) · [BUSINESS.md](./BUSINESS.md) · [DOMAIN.md](./DOMAIN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CARD-CATALOG.md](./CARD-CATALOG.md) · [CJK-CONTENT.md](./CJK-CONTENT.md) · [PHONETIC-CONTENT.md](./PHONETIC-CONTENT.md) · [TASKS.md](../TASKS.md).

## Терминология: «Курс» (scope) и «Программа» (`Course`) — G11e

В UI и документации важно не смешивать две сущности:

| Термин в UI                           | Домен          | Пример                                        | Где                                                                               |
| ------------------------------------- | -------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| **Курс**                              | `LanguagePair` | Русский → 中文 (ru→zh)                        | Профиль `/user` (вкладки «Курс», «Настройка курса»), подпись на dashboard `/home` |
| **Программа** / **учебная программа** | `Course` (G11) | «Демо: базовый English» — программа из уроков | `/home`, `/courses`, `/tools/courses`, picker на `/cards/select`                  |

- **Курс** (UI) — scope контента: какие карточки, сценарии и результаты видны в текущей сессии (G7/G8). В коде — `LanguagePair`, `activeLanguagePairId`.
- **Программа** (`Course`) — учебная программа: упорядоченные уроки → сценарии в рамках одного курса (`LanguagePair`).

Подпись: `formatLanguagePair()` → «Русский → English». В locked-режиме каталога карточек (G8a) — строка **«Курс: …»** в шапке фильтров.

**Подсказки в каталоге:** `card-editor-page` при `pairLocked` показывает «Курс: …» и hint: сменить курс — в Профиле; учебные **программы** — в меню «Курсы» / конструкторе (G11).

## Три оси «языка»

| Ось      | Тип                 | Назначение                           | Статус                                       |
| -------- | ------------------- | ------------------------------------ | -------------------------------------------- |
| UiLocale | `UiLocale` (бэклог) | Кнопки, меню, подписи UI             | бэклог `features/locale/`                    |
| Known    | `ContentLanguage`   | Язык, который пользователь уже знает | G1: `User.preferences.languagePair.known`    |
| Learning | `ContentLanguage`   | Язык, который изучают                | G1: `User.preferences.languagePair.learning` |

```typescript
type ContentLanguage = 'en' | 'zh' | 'ru';

type LanguagePair = {
  known: ContentLanguage;
  learning: ContentLanguage;
};

type CardDirection = 'known-to-learning' | 'learning-to-known';
```

## Семантика каталога (G3 — готово)

`CardIndexEntry` хранит **`knownLanguage`** и **`learningLanguage`**. Фильтры `CardSearchCriteria.knownLanguage` / `learningLanguage` и фасеты каталога работают по обоим полям.

## Профиль пользователя (G1)

| Элемент  | Путь / API                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------- |
| Тип (G7) | `languagePairs: UserLanguagePairEntry[]` + `activeLanguagePairId`                                        |
| Default  | `{ known: 'ru', learning: 'en' }` — одна запись в списке                                                 |
| Store    | `UserStore.languagePair` (active alias), `languagePairs`, `addLanguagePair()`, `setActiveLanguagePair()` |
| Persist  | `localStorage` · `lingua-code.user` · миграция legacy `languagePair`                                     |
| UI       | `/user` — список пар + add/remove/set active; compact switcher в header (menu-user)                      |

Подпись пары: `formatLanguagePair()` → «Русский → English».

## Learning Home (G13)

> **Статус:** готово (G13 + G14). Dashboard на `/home` · студия сессии на `/cards/select`.

| Экран                    | Маршрут         | Роль                                                 |
| ------------------------ | --------------- | ---------------------------------------------------- |
| **Обучение** (dashboard) | `/home`         | CTA «Продолжить», прогресс программы, roadmap уроков |
| **Практика** (сессия)    | `/cards/select` | вкладки: программа → уроки → сценарии → карточки     |

**Курс** (`LanguagePair`) выбирается в **профиле**; dashboard только показывает активную пару.

**Программа** (`Course`) — `LearningSessionPreferences.activeCourseId` per pair; resume через `learning-resume.utils`.

Deep link с dashboard:

```text
/cards/select?courseId=…&lessonId=…&scenarioId=…&tab=learning
```

Файлы: `features/home/` · `core/data/learning-resume.utils.ts` · `core/data/learning-session.utils.ts`.

## G7 — несколько пар, одна активная

> **Статус:** готово (G7a–G7d); опционально G7.5 — прогресс по всем парам на главной.

Пользователь может изучать **несколько** языковых пар (например ru→en и ru→zh), но в любой момент **ровно одна** пара **активна**. Сейчас активная пара влияет на обучение, прогресс и prefill в редакторах; полный scope всего UI — **G8**.

### Модель (план)

```typescript
type UserLanguagePairEntry = {
  id: string; // стабильный UUID
  pair: LanguagePair;
  createdAt: string; // ISO
};

type UserPreferences = CardAppearance & {
  learningProficiencyLevel: LearningProficiencyLevel;
  languagePairs: readonly UserLanguagePairEntry[];
  activeLanguagePairId: string;
};
```

**Правила:**

| Правило                 | Поведение                                       |
| ----------------------- | ----------------------------------------------- |
| Уникальность            | Одна запись на комбинацию `{ known, learning }` |
| `known === learning`    | Запрещено (как в G1)                            |
| Минимум пар             | Нельзя удалить последнюю                        |
| Удаление активной       | Активировать первую оставшуюся                  |
| Добавление существующей | Не дублировать; сделать существующую активной   |

### Store (план)

`UserStore.languagePair()` остаётся **computed активной пары** — потребители G2–G5 (card-select, card-editor, scenario-builder, learning-results) не меняют контракт:

```typescript
readonly languagePair = computed(() => this.activeEntry().pair);

addLanguagePair(pair: LanguagePair): void;
removeLanguagePair(id: string): void;
setActiveLanguagePair(id: string): void;
```

### Что уже готово (G2–G5)

| Компонент                                                             | Готовность                              |
| --------------------------------------------------------------------- | --------------------------------------- |
| `LearningResult.languagePair` на каждый ответ                         | ✅ история не теряется при переключении |
| `Scenario.languagePair`, каталог `knownLanguage` / `learningLanguage` | ✅ контент pair-aware                   |
| Фильтр сценариев / stats по `UserStore.languagePair()`                | ✅ работает для активной пары           |

### UI (план)

| Экран                      | G7                                                |
| -------------------------- | ------------------------------------------------- |
| `/user`                    | Список пар, add/remove, «сделать активной»        |
| `/cards/select` или header | Quick switcher активной пары                      |
| Главная / прогресс         | MVP: только активная пара; опционально — все пары |

### Сессия

При смене активной пары — сброс `CardSelectStore` (текущая карточка, direction toggle). Опционально: confirm «Сменить пару? Сессия будет прервана».

### Миграция persist

```typescript
// user.persistence.ts — normalize legacy
if ('languagePair' in prefs && !('languagePairs' in prefs)) {
  const id = crypto.randomUUID();
  return {
    ...prefs,
    languagePairs: [{ id, pair: normalizeLanguagePair(prefs.languagePair), createdAt: now }],
    activeLanguagePairId: id,
  };
}
```

### Этапы G7

| Шаг  | Содержание                                               |
| ---- | -------------------------------------------------------- |
| G7.1 | Типы + persist + миграция                                |
| G7.2 | `UserStore` (add/remove/setActive, alias `languagePair`) |
| G7.3 | UI `/user`                                               |
| G7.4 | Quick switcher + сброс сессии                            |
| G7.5 | (опционально) прогресс по всем парам                     |

### Отличие от UiLocale (G6)

|                 | Language pairs (G7)          | UiLocale (G6)          |
| --------------- | ---------------------------- | ---------------------- |
| Что меняет      | Контент карточек / **пара**  | Язык интерфейса        |
| Множественность | Несколько пар, одна активна  | Один язык UI           |
| Пример          | ru→en + ru→zh, UI на русском | Кнопки и меню на EN/ZH |

## G8 — scope UI по активной паре

> **Статус:** готово (MVP strict) · см. [TASKS.md](../TASKS.md) (G8a–G8d).

G7 даёт **выбор активной пары**; G8 — **enforcement**: после выбора **пары** интерфейс показывает только карточки, сценарии и pickers, соответствующие `UserStore.languagePair()`.

### Уже scoped (G5 + G7)

| Область                    | Поведение                                                   |
| -------------------------- | ----------------------------------------------------------- |
| `/cards/select` — сценарии | API filter по паре + `scenarioMatchesLanguagePair` при load |
| Прогресс                   | `LearningResultsStore.pairResults` — только активная пара   |
| Смена пары в обучении      | Сброс `CardSelectStore` (G7d)                               |
| Create card / scenario     | Prefill known/learning из активной пары                     |

### Пробелы (G8) — закрыто в MVP strict

| Область                          | Было                     | Стало (G8)                                                       |
| -------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `/tools/cards` каталог           | Фильтры вручную          | `initWithActivePair` + locked подпись **«Курс: …»** + hint (G8a) |
| `clearFilters()`                 | Сбрасывал known/learning | Сохраняет locked pair                                            |
| `/tools/scenario-builder` список | Все сценарии             | API filter по активной паре                                      |
| `ScenarioCardPicker`             | Без auto-scope           | `initWithActivePair` + reload                                    |
| `ScenarioSearchCriteria`         | Нет полей пары           | `knownLanguage` / `learningLanguage`                             |
| Смена пары на `/tools/*`         | Нет reload               | effect → reload списков                                          |

### Режимы

| Режим               | Описание                                                            |
| ------------------- | ------------------------------------------------------------------- |
| **Strict** (MVP G8) | Каталоги и списки locked на active pair; языковые фильтры read-only |
| **Author** (опц.)   | `showAllLanguagePairs` — prefill active, но можно смотреть все пары |

### Архитектура (план)

```typescript
// Единый scope из UserStore (alias уже есть)
readonly activePair = userStore.languagePair();
readonly activePairLabel = userStore.languagePairLabel();

// CardCatalogSearchStore — на init и при смене пары
applyLanguagePair(activePair.known, activePair.learning);

// clearFilters() в locked mode — не трогает known/learning
```

**Сценарии:** добавить в `ScenarioSearchCriteria` поля `knownLanguage` / `learningLanguage` (или `languagePair`) и фильтровать в mock handler — иначе client filter ломает `totalItems` и пагинацию.

**Legacy:** `Scenario.languagePair` отсутствует → сейчас `scenarioMatchesLanguagePair` возвращает `true` (виден в любой паре). В strict mode — скрывать или мигрировать demo.

### Этапы G8

| Шаг  | Содержание                                                              |
| ---- | ----------------------------------------------------------------------- |
| G8.1 | Каталог `/tools/cards`: applyLanguagePair + reload при смене пары       |
| G8.2 | `clearFilters` + locked UI фильтров языка                               |
| G8.3 | ScenarioCardPicker + criteria editor — scope active pair                |
| G8.4 | Scenario builder list + `ScenarioSearchCriteria` + API                  |
| G8.5 | Reload `/tools/*` при смене пары; legacy rules; (опц.) try dialog check |

### Отличие G7 vs G8

|          | G7                      | G8                                 |
| -------- | ----------------------- | ---------------------------------- |
| Фокус    | Несколько пар, switcher | Весь UI в контексте **одной пары** |
| Обучение | Scoped                  | Уже scoped — без изменений         |
| Tools    | Prefill при create      | **Фильтрация** каталогов и списков |

## G11 — учебные курсы (Course)

> **Статус:** готово (G11). См. [DOMAIN.md](./DOMAIN.md#иерархия-контента) · [TASKS.md](../TASKS.md).

`Course` — программа из уроков (`Lesson`), каждый урок ссылается на упорядоченные `scenarioIds`. Курс привязан к `Course.languagePair` и фильтруется так же, как сценарии (G8).

| Область      | Поведение                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------- |
| Конструктор  | `/tools/courses` — CRUD курса и вложенных уроков                                            |
| Обучение     | `/cards/select` — опционально: курс → урок → сценарий                                       |
| Прогресс     | `LearningResult.courseId?`, `lessonId?` + агрегация в `LearningResultsStore`                |
| Терминология | Подпись scope в каталоге — **«Курс: …»**; **программа** (`Course`) — отдельная сущность G11 |

Курс **не заменяет** `LanguagePair`: одна пара может иметь несколько курсов; без выбора курса обучение идёт напрямую по сценариям (как до G11).

## Обучение (G1)

На `/cards/select` отображается текущая пара из профиля; toggle direction в сессии; рендер карточек по `CardDirection` — G5.

## Карточки (G2 — готово)

```typescript
type MemoryPair = { known: string; learning: string };

type SelectCard = CardBase & {
  kind: 'select';
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  correctIndex: number;
};
```

Legacy JSON нормализуется через `card-legacy.mapper.ts` при загрузке seed; пользовательские правки — в `UserContentOverlay` (G15).

### G5.1 — render по `CardDirection` (по kind)

Утилиты: `card-direction.utils.ts` — `resolveOptionCard`, `resolveMemoryPairs`, `effectiveCardDirection`.

| Kind                                           | Поведение при `learning-to-known`                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `select`, `timed`, `reading`, `symbol`, `tone` | Swap prompt ↔ options; `optionsKnown` / `glossKnown` для known-side          |
| `keyboard`                                     | Swap prompt; `acceptedAnswersLearning` для обратного направления             |
| `memory`                                       | Swap колонок known ↔ learning; лексемы на learning-side                      |
| `sound`                                        | **Инвариант** — аудио всегда на learning; direction не меняет источник звука |
| `draw`, `tone`                                 | Toggle direction **скрыт** в UI (не влияет на задание)                       |

Сессия: `CardSelectStore.sessionDirection` побеждает над `card.direction` (default при старте сценария).

## Сценарии (G4 — готово)

`Scenario.languagePair` — опционально; валидация fixed/snapshot в mock handler.

## Результаты (G5 — готово)

`LearningResult.languagePair` + optional `direction`.

## Этапы

| Этап | Содержание                                                                                   | Статус |
| ---- | -------------------------------------------------------------------------------------------- | ------ |
| G0   | `LanguagePair` в DOMAIN и `core/models`; `CardIndexEntry.knownLanguage` / `learningLanguage` | готово |
| G1   | `User.preferences.languagePair`, persist, UI `/user`, подпись в обучении                     | готово |
| G2   | Structured content в `Card` (known/learning поля); миграция demo                             | готово |
| G3   | Index/search по паре; редактор — поля языка                                                  | готово |
| G4   | `Scenario.languagePair` + валидация в builder                                                | готово |
| G5   | Render по direction; `LearningResult` + pair                                                 | готово |
| G7   | Несколько пар в профиле, одна активная                                                       | готово |
| G8   | Scope UI по активной паре (каталоги, сценарии, pickers)                                      | готово |
| G11  | `Course` / `Lesson`; терминология «Курс» (scope) vs «Программа» (`Course`)                   | готово |
| G15  | User content overlay + content seed manifest                                                 | готово |
| G9   | CJK-контент: иероглифы, пиньинь, жуинь, Палладия, тоны                                       | готово |
| G10  | IPA (International Phonetic Alphabet)                                                        | готово |
| G6   | UiLocale (`@angular/localize`) — отдельный трек                                              | бэклог |

## G2+ — детали бэклога

### G2 — structured content

| Шаг  | Содержание                                                               |
| ---- | ------------------------------------------------------------------------ |
| G2.1 | Типы `Card` / `MemoryPair` — поля `known` / `learning`                   |
| G2.2 | `CardDraft`, `card-form`, validation                                     |
| G2.3 | Миграция fixtures + backward-compat mapper (legacy `question`/`options`) |
| G2.4 | Renderers — чтение новых полей                                           |

### G3 — каталог

| Шаг  | Содержание                                      |
| ---- | ----------------------------------------------- |
| G3.1 | `CardIndexEntry` + search criteria по паре      |
| G3.2 | Card editor — languagePair в форме и index meta |
| G3.3 | Filters UI + API params                         |

### G4 — сценарии

| Шаг  | Содержание                            |
| ---- | ------------------------------------- |
| G4.1 | `Scenario.languagePair` в типах и API |
| G4.2 | Builder form + validation cardSource  |
| G4.3 | Scenario picker filter                |

### G5 — сессия и analytics

| Шаг  | Содержание                                           |
| ---- | ---------------------------------------------------- |
| G5.1 | Render по `CardDirection` — см. таблицу по kind выше |
| G5.2 | `LearningResult` + pair context                      |
| G5.3 | Filter scenarios by user pair                        |

### G7 — multi-pair profile

| Шаг  | Содержание                                                       |
| ---- | ---------------------------------------------------------------- |
| G7.1 | `UserLanguagePairEntry`, persist, migration                      |
| G7.2 | `UserStore` add/remove/setActive; `languagePair` as active alias |
| G7.3 | UI `/user` — list, add, remove, set active                       |
| G7.4 | Quick switcher; reset session on pair change                     |
| G7.5 | (опционально) progress across all pairs                          |

### G8 — active pair UI scope

| Шаг  | Содержание                                                                       |
| ---- | -------------------------------------------------------------------------------- |
| G8.1 | Card catalog: `applyLanguagePair` on init + reload on pair change                |
| G8.2 | Locked pair filters; подпись **«Курс: …»** + hint; `clearFilters` preserves pair |
| G8.3 | Scenario card picker + criteria editor scoped                                    |
| G8.4 | Scenario list API filter (`ScenarioSearchCriteria` + mock)                       |
| G8.5 | Tools reload on pair change; legacy scenarios; optional author mode              |

### G9 — CJK content layer

> Детали: [CJK-CONTENT.md](./CJK-CONTENT.md).

Для пары **ru→zh** контент карточки выходит за рамки плоских `string`: иероглифы, пиньинь, жуинь, **транскрипционная система Палладия** (кириллица), произношение, тоны. G9 добавляет `CjkLexeme` и рендер ruby без смены контракта `LanguagePair`.

| Шаг  | Содержание                                          |
| ---- | --------------------------------------------------- |
| G9.1 | Типы + adapter; CJK fonts + `app-cjk-ruby`          |
| G9.2 | `CjkLearningPreferences` (palladius при `known=ru`) |
| G9.3 | Lexeme в payload карточек + редактор                |
| G9.4 | pinyin ↔ palladius; demo ru→zh                      |
| G9.5 | CJK keyboard normalizer; audio; tones               |

### G10 — IPA (phonetic layer)

> Детали: [PHONETIC-CONTENT.md](./PHONETIC-CONTENT.md). Дополняет G9; приоритет **ru→en**.

| Шаг   | Содержание                                 |
| ----- | ------------------------------------------ |
| G10.1 | `PhoneticLexeme`, `IpaVariant`, поле `ipa` |
| G10.2 | IPA fonts + `app-phonetic-ipa`             |
| G10.3 | Показ в sound / select / memory            |
| G10.4 | `PhoneticPreferences`                      |
| G10.5 | Demo ru→en; тег `ipa`                      |
| G10.6 | (опц.) автозаполнение en; zh Chao tones    |

## Связанные пути в коде

```
src/app/core/models/language-pair.types.ts
src/app/core/models/course.types.ts                 # G11: Course (не путать с LanguagePair)
src/app/core/models/user.types.ts                # UserPreferences (G7: languagePairs)
src/app/core/models/card-index.types.ts
src/app/core/data/language-pair.utils.ts
src/app/core/state/user.store.ts
src/app/core/state/user.persistence.ts           # G7: migration legacy languagePair
src/app/core/layout/pages/user-page/
src/app/shared/card-catalog-search/card-catalog-search.store.ts  # applyLanguagePair (G8)
src/app/features/card-editor/components/card-editor-page/  # «Курс: …» + hint (G8a)
src/app/features/card-editor/components/card-editor-page/
src/app/features/course-builder/                 # G11: конструктор Course
src/app/features/scenario-builder/services/scenario-builder.store.ts
src/app/shared/scenario-picker/scenario-picker.component.ts
src/app/shared/course-picker/                    # G11: выбор Course на обучении
src/app/shared/lesson-picker/
src/app/features/card-select/components/card-select-page/
public/data/select-cards.json
```
