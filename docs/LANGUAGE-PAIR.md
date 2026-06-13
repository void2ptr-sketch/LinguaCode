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

## Семантика каталога

`CardIndexEntry.language` — **язык изучаемого контента** (learning / target), не known language пользователя.

Фильтр `CardSearchCriteria.language` на текущем этапе означает то же: learning language карточки. В G3+ — расширение до `languagePair` или отдельных полей `knownLanguage` / `learningLanguage`.

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

На `/cards/select` отображается текущая пара из профиля. Рендер карточек по direction — бэклог G5.

## Карточки (бэклог G2)

Сейчас двуязычность **неявная** в строках (`question` на ru, `options` на en). План:

```typescript
type MemoryPair = {
  known: string;
  learning: string;
};

type SelectCard = CardBase & {
  kind: 'select';
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  correctIndex: number;
};
```

Demo JSON (`public/data/select-cards.json`) мигрирует на G2.

## Сценарии (бэклог G4)

```typescript
type Scenario = {
  // ...
  languagePair?: LanguagePair;
};
```

Валидация: карточки fixed/snapshot соответствуют `languagePair` сценария.

## Результаты (бэклог G5)

```typescript
type LearningResult = {
  // ...
  languagePair: LanguagePair;
  direction?: CardDirection;
};
```

## Этапы

| Этап | Содержание | Статус |
|------|------------|--------|
| G0 | `LanguagePair` в DOMAIN и `core/models`; семантика `CardIndexEntry.language` | готово |
| G1 | `User.preferences.languagePair`, persist, UI `/user`, подпись в обучении | готово |
| G2 | Structured content в `Card` (known/learning поля); миграция demo | план |
| G3 | Index/search по паре; редактор — поля языка | план |
| G4 | `Scenario.languagePair` + валидация в builder | план |
| G5 | Render по direction; `LearningResult` + pair | план |
| G6 | UiLocale (`@angular/localize`) — отдельный трек | бэклог |

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
