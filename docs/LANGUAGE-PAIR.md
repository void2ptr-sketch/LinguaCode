# Пара языков обучения (known → learning)

Обучение в LinguaCode опирается на **два языка контента**: известный пользователю (known) и изучаемый (learning). Это отдельно от **UiLocale** — языка интерфейса приложения (`@angular/localize`, бэклог).

Связанные документы: [DOMAIN.md](./DOMAIN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CARD-CATALOG.md](./CARD-CATALOG.md) · [TASKS.md](../TASKS.md).

## Три оси «языка»

| Ось | Тип | Назначение | Статус |
|-----|-----|------------|--------|
| UiLocale | `UiLocale` (бэклог) | Кнопки, меню, подписи UI | бэклог `features/locale/` |
| Known | `ContentLanguage` | Язык, который пользователь уже знает | G1: `User.preferences.languagePair.known` |
| Learning | `ContentLanguage` | Язык, который изучают | G1: `User.preferences.languagePair.learning` |

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

| Элемент | Путь / API |
|---------|------------|
| Тип (G7) | `languagePairs: UserLanguagePairEntry[]` + `activeLanguagePairId` |
| Default | `{ known: 'ru', learning: 'en' }` — одна запись в списке |
| Store | `UserStore.languagePair` (active alias), `languagePairs`, `addLanguagePair()`, `setActiveLanguagePair()` |
| Persist | `localStorage` · `lingua-code.user` · миграция legacy `languagePair` |
| UI | `/user` — список пар + add/remove/set active; switcher на `/cards/select` и в header |

Подпись пары: `formatLanguagePair()` → «Русский → English».

## G7 — несколько пар, одна активная

> **Статус:** готово (G7a–G7d); опционально G7.5 — прогресс по всем парам на главной.

Пользователь может изучать **несколько** языковых пар (например ru→en и ru→zh), но в любой момент **ровно одна** пара **активна**. Активная пара определяет фильтрацию сценариев, prefill в редакторах, подпись на `/cards/select` и агрегаты прогресса.

### Модель (план)

```typescript
type UserLanguagePairEntry = {
  id: string;           // стабильный UUID
  pair: LanguagePair;
  createdAt: string;    // ISO
};

type UserPreferences = CardAppearance & {
  languagePairs: readonly UserLanguagePairEntry[];
  activeLanguagePairId: string;
};
```

**Правила:**

| Правило | Поведение |
|---------|-----------|
| Уникальность | Одна запись на комбинацию `{ known, learning }` |
| `known === learning` | Запрещено (как в G1) |
| Минимум пар | Нельзя удалить последнюю |
| Удаление активной | Активировать первую оставшуюся |
| Добавление существующей | Не дублировать; сделать существующую активной |

### Store (план)

`UserStore.languagePair()` остаётся **computed активной пары** — потребители G2–G5 (card-select, card-editor, scenario-builder, learning-results) не меняют контракт:

```typescript
readonly languagePair = computed(() => this.activeEntry().pair);

addLanguagePair(pair: LanguagePair): void;
removeLanguagePair(id: string): void;
setActiveLanguagePair(id: string): void;
```

### Что уже готово (G2–G5)

| Компонент | Готовность |
|-----------|------------|
| `LearningResult.languagePair` на каждый ответ | ✅ история не теряется при переключении |
| `Scenario.languagePair`, каталог `knownLanguage` / `learningLanguage` | ✅ контент pair-aware |
| Фильтр сценариев / stats по `UserStore.languagePair()` | ✅ работает для активной пары |

### UI (план)

| Экран | G7 |
|-------|-----|
| `/user` | Список пар, add/remove, «сделать активной» |
| `/cards/select` или header | Quick switcher активной пары |
| Главная / прогресс | MVP: только активная пара; опционально — все пары |

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

| Шаг | Содержание |
|-----|------------|
| G7.1 | Типы + persist + миграция |
| G7.2 | `UserStore` (add/remove/setActive, alias `languagePair`) |
| G7.3 | UI `/user` |
| G7.4 | Quick switcher + сброс сессии |
| G7.5 | (опционально) прогресс по всем парам |

### Отличие от UiLocale (G6)

| | Language pairs (G7) | UiLocale (G6) |
|--|---------------------|---------------|
| Что меняет | Контент карточек / курс | Язык интерфейса |
| Множественность | Несколько пар, одна активна | Один язык UI |
| Пример | ru→en + ru→zh, UI на русском | Кнопки и меню на EN/ZH |

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

Legacy JSON нормализуется через `card-legacy.mapper.ts` при загрузке из `localStorage`.

## Сценарии (G4 — готово)

`Scenario.languagePair` — опционально; валидация fixed/snapshot в mock handler.

## Результаты (G5 — готово)

`LearningResult.languagePair` + optional `direction`.

## Этапы

| Этап | Содержание | Статус |
|------|------------|--------|
| G0 | `LanguagePair` в DOMAIN и `core/models`; `CardIndexEntry.knownLanguage` / `learningLanguage` | готово |
| G1 | `User.preferences.languagePair`, persist, UI `/user`, подпись в обучении | готово |
| G2 | Structured content в `Card` (known/learning поля); миграция demo | готово |
| G3 | Index/search по паре; редактор — поля языка | готово |
| G4 | `Scenario.languagePair` + валидация в builder | готово |
| G5 | Render по direction; `LearningResult` + pair | готово |
| G7 | Несколько пар в профиле, одна активная | готово |
| G6 | UiLocale (`@angular/localize`) — отдельный трек | бэклог |

## G2+ — детали бэклога

### G2 — structured content

| Шаг | Содержание |
|-----|------------|
| G2.1 | Типы `Card` / `MemoryPair` — поля `known` / `learning` |
| G2.2 | `CardDraft`, `card-form`, validation |
| G2.3 | Миграция fixtures + backward-compat mapper (legacy `question`/`options`) |
| G2.4 | Renderers — чтение новых полей |

### G3 — каталог

| Шаг | Содержание |
|-----|------------|
| G3.1 | `CardIndexEntry` + search criteria по паре |
| G3.2 | Card editor — languagePair в форме и index meta |
| G3.3 | Filters UI + API params |

### G4 — сценарии

| Шаг | Содержание |
|-----|------------|
| G4.1 | `Scenario.languagePair` в типах и API |
| G4.2 | Builder form + validation cardSource |
| G4.3 | Scenario picker filter |

### G5 — сессия и analytics

| Шаг | Содержание |
|-----|------------|
| G5.1 | Render по `CardDirection` |
| G5.2 | `LearningResult` + pair context |
| G5.3 | Filter scenarios by user pair |

### G7 — multi-pair profile

| Шаг | Содержание |
|-----|------------|
| G7.1 | `UserLanguagePairEntry`, persist, migration |
| G7.2 | `UserStore` add/remove/setActive; `languagePair` as active alias |
| G7.3 | UI `/user` — list, add, remove, set active |
| G7.4 | Quick switcher; reset session on pair change |
| G7.5 | (опционально) progress across all pairs |

## Связанные пути в коде

```
src/app/core/models/language-pair.types.ts
src/app/core/models/user.types.ts                # UserPreferences (G7: languagePairs)
src/app/core/models/card-index.types.ts
src/app/core/data/language-pair.utils.ts
src/app/core/state/user.store.ts
src/app/core/state/user.persistence.ts           # G7: migration legacy languagePair
src/app/core/layout/pages/user-page/
src/app/features/card-select/components/card-select-page/
public/data/select-cards.json
```
