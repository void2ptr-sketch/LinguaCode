# SymbolCard

> Исходный код: `src/app/shared/ui/cards/symbol-card/symbol-card.component.ts`

## Назначение

Компонент `SymbolCardComponent` реализует карточку-вопрос с выбором символа.
Пользователь видит вопрос и набор символов (например, иероглифов, букв алфавита),
среди которых один правильный.

## Модель данных

Исходный тип: `SymbolCard` (определён в `src/app/core/models/cards/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'symbol'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `direction` | `CardDirection` | Направление по умолчанию |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `symbols` | `readonly string[]` | Набор символов для выбора |
| `optionsKnown` | `readonly string[] \| undefined` | Варианты на известном языке (для режима «новый → известный») |
| `symbolLexemes` | `readonly PhoneticLexeme[] \| undefined` | Фонетические транскрипции символов |
| `correctIndex` | `number` | Индекс правильного символа (0-based) |

## Use Cases

### 1. Инициализация с направлением «известный → новый»

- **Сценарий:** Карточка монтируется с `direction = 'known-to-learning'`.
- **Ввод:** `card`, `direction`.
- **Вывод:** `resolved` вычисляется через `resolveOptionCard()` — `prompt` = `promptKnown`, `options` = `symbols`.

### 2. Инициализация с направлением «новый → известный»

- **Сценарий:** Пользователь переключает toggle в сессии.
- **Ввод:** `direction = 'learning-to-known'`.
- **Вывод:** `resolved` пересчитывается — `prompt` = `symbols[correctIndex]`, `options` = `optionsKnown` (или выводятся из `symbols` + `symbolLexemes`).

### 3. Выбор символа

- **Сценарий:** Пользователь кликает символ.
- **Ввод:** Клик по индексу `N`.
- **Вывод:** Эмитится `optionSelected(N)`. Если `feedback !== null` — игнорируется.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'symbol'`.
- **Зависимости (imports):**
  - `QuizCardQuestionHeaderComponent` — заголовок и подсказка.
  - `LexemeDisplayComponent` — рендеринг фонетической транскриипции.
  - `MatCardModule`, `MatButtonModule`, `MatIconModule` — Angular Material.
- **Утилиты:**
  - `resolveOptionCard()` из `src/app/core/repositories/cards/utils/card-direction.utils.ts`.
  - `effectiveCardDirection()` из `src/app/core/repositories/cards/utils/card-direction.utils.ts`.
  - `buildOptionClass()` из `src/app/shared/ui/cards/option-card.util.ts`.

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `SymbolCard` | (required) | Данные карточки — символы, правильный индекс |
| `direction` | `'known-to-learning' \| 'learning-to-known'` | `'known-to-learning'` | Направление показа |
| `selectedIndex` | `number \| null` | `null` | Индекс выбранного символа |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `optionSelected` | `Output<number>` | Индекс выбранного символа |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |

## Пример использования

```html
<app-symbol-card
  [card]="symbolCardData"
  [direction]="direction"
  [selectedIndex]="selectedIndex"
  [feedback]="feedback"
  [fontSize]="'md'"
  (optionSelected)="onOptionSelected($event)"
  (checkAnswer)="onCheckAnswer()"
  (nextCard)="onNextCard()"
/>
```

### Пример данных карточки

```typescript
const card: SymbolCard = {
  id: 'symbol-1',
  kind: 'symbol',
  title: 'Выберите иероглиф',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Какой иероглиф означает «вода»?',
  symbols: ['火', '水', '山', '木'],
  symbolLexemes: [
    { primary: 'huǒ', script: 'hani' },
    { primary: 'shuǐ', script: 'hani' },
    { primary: 'shān', script: 'hani' },
    { primary: 'mù', script: 'hani' },
  ],
  correctIndex: 1,
};
```

### Внутренние вычисляемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `resolved` | `Computed<ResolvedOptionCard>` | Резолв карточки с учётом направления |
| `promptLexeme()` | `() => PhoneticLexeme \| undefined` | Фонетика подсказки |
| `optionLexeme(index)` | `(index: number) => PhoneticLexeme \| undefined` | Фонетика символа по индексу |
| `optionClass(index)` | `(index: number) => string` | CSS-классы для варианта |

### Методы

| Метод | Описание |
|-------|----------|
| `selectOption(index)` | Обработка выбора. Если `feedback !== null` — игнорирует. Иначе эмитит `optionSelected(index)` |
