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
| Тип | `UserPreferences.languagePair: LanguagePair` |
| Default | `{ known: 'ru', learning: 'en' }` |
| Store | `UserStore.languagePair`, `languagePairLabel`, `updateLanguagePair()` |
| Persist | `localStorage` · `lingua-code.user` |
| UI | `/user` — селекты «Известный» / «Новый» |

Подпись пары: `formatLanguagePair()` → «Русский → English».

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

## Связанные пути в коде

```
src/app/core/models/language-pair.types.ts
src/app/core/models/card-index.types.ts          # language = learning
src/app/core/models/user.types.ts                # UserPreferences
src/app/core/data/language-pair.utils.ts
src/app/core/state/user.store.ts
src/app/core/state/user.persistence.ts
src/app/core/layout/pages/user-page/
src/app/features/card-select/components/card-select-page/
public/data/select-cards.json                    # миграция на G2
```
