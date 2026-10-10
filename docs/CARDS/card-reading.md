# ReadingCard

> Исходный код: `src/app/shared/ui/cards/reading-card/reading-card.component.ts`

## Назначение

Компонент `ReadingCardComponent` реализует карточку-вопрос с выбором чтения (пиньинь/транскрипции).
Пользователь видит иероглиф (или текст) и набор вариантов чтения, среди которых один правильный.

## Модель данных

Исходный тип: `ReadingCard` (определён в `src/app/core/models/cards/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'reading'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `direction` | `CardDirection` | Направление по умолчанию |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `optionsLearning` | `readonly string[]` | Варианты чтения на изучаемом языке |
| `optionsKnown` | `readonly string[] \| undefined` | Варианты на известном языке (для режима «новый → известный») |
| `optionsLexemes` | `readonly PhoneticLexeme[] \| undefined` | Фонетические транскрипции вариантов |
| `correctIndex` | `number` | Индекс правильного чтения (0-based) |

## Use Cases

### 1. Инициализация с направлением «известный → новый»

- **Сценарий:** Карточка монтируется с `direction = 'known-to-learning'`.
- **Ввод:** `card`, `direction`.
- **Вывод:** `resolved` вычисляется через `resolveOptionCard()` — `prompt` = `promptKnown`, `options` = `optionsLearning`.

### 2. Инициализация с направлением «новый → известный»

- **Сценарий:** Пользователь переключает toggle в сессии.
- **Ввод:** `direction = 'learning-to-known'`.
- **Вывод:** `resolved` пересчитывается — `prompt` = `optionsLearning[correctIndex]`, `options` = `optionsKnown`.

### 3. Выбор чтения

- **Сценарий:** Пользователь кликает вариант чтения.
- **Ввод:** Клик по индексу `N`.
- **Вывод:** Эмитится `optionSelected(N)`. Если `feedback !== null` — игнорируется.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'reading'`.
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
| `card` | `ReadingCard` | (required) | Данные карточки — текст, варианты чтения |
| `direction` | `'known-to-learning' \| 'learning-to-known'` | `'known-to-learning'` | Направление показа |
| `selectedIndex` | `number \| null` | `null` | Индекс выбранного варианта |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `optionSelected` | `Output<number>` | Индекс выбранного чтения |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |

## Пример использования

```html
<app-reading-card
  [card]="readingCardData"
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
const card: ReadingCard = {
  id: 'reading-1',
  kind: 'reading',
  title: 'Выберите чтение',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Как читается иероглиф «学»?',
  optionsLearning: ['xué', 'jiào', 'xí', 'wén'],
  optionsKnown: ['study', 'teach', 'learn', 'text'],
  correctIndex: 0,
};
```

### Внутренние вычисляемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `resolved` | `Computed<ResolvedOptionCard>` | Резолв карточки с учётом направления |
| `promptLexeme()` | `() => PhoneticLexeme \| undefined` | Фонетика подсказки |
| `optionLexeme(index)` | `(index: number) => PhoneticLexeme \| undefined` | Фонетика варианта по индексу |
| `optionClass(index)` | `(index: number) => string` | CSS-классы для варианта |

### Методы

| Метод | Описание |
|-------|----------|
| `selectOption(index)` | Обработка выбора. Если `feedback !== null` — игнорирует. Иначе эмитит `optionSelected(index)` |
