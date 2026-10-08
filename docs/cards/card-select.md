# SelectCard

> Исходный код: `src/app/shared/components/cards/select-card/select-card.component.ts`

## Назначение

Компонент `SelectCardComponent` реализует карточку-вопрос с множественным выбором ответа.
Пользователь видит вопрос/подсказку и набор вариантов ответа, среди которых один правильный.
После выбора варианта пользователь нажимает «Проверить» — система показывает результат
(«Верно!» / «Неверно» с правильным ответом).

## Модель данных

Исходный тип: `SelectCard` (определён в `src/app/core/models/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'select'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `direction` | `CardDirection` | Направление по умолчанию (`'known-to-learning'` \| `'learning-to-known'`) |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `optionsLearning` | `readonly string[]` | Варианты ответов на изучаемом языке |
| `optionsKnown` | `readonly string[] \| undefined` | Варианты на известном языке (для режима «новый → известный») |
| `optionsLexemes` | `readonly PhoneticLexeme[] \| undefined` | Фонетические транскрипции вариантов |
| `correctIndex` | `number` | Индекс правильного ответа (0-based) |

## Use Cases

### 1. Инициализация с направлением «известный → новый»

- **Сценарий:** Карточка монтируется с `direction = 'known-to-learning'`.
- **Ввод:** `card`, `direction`.
- **Вывод:** `resolved` вычисляется через `resolveOptionCard()` — `prompt` = `promptKnown`, `options` = `optionsLearning`. Правильный ответ — `optionsLearning[correctIndex]`.

### 2. Инициализация с направлением «новый → известный»

- **Сценарий:** Пользователь переключает toggle в сессии.
- **Ввод:** `direction = 'learning-to-known'`.
- **Вывод:** `resolved` пересчитывается — `prompt` берётся из `optionsLearning[correctIndex]`, `options` = `optionsKnown` (или выводятся из `optionsLearning` + `optionsLexemes`).

### 3. Выбор варианта ответа

- **Сценарий:** Пользователь кликает один из вариантов.
- **Ввод:** Клик по индексу `N`.
- **Вывод:** Эмитится `optionSelected(N)`. Если `feedback !== null` — клик игнорируется.

### 4. Проверка ответа

- **Сценарий:** Пользователь выбрал вариант и нажал «Проверить».
- **Ввод:** `selectedIndex !== null`, кнопка «Проверить».
- **Вывод:** Эмитится `checkAnswer`. Компонент передаёт `feedback` извне — классы `option--correct` / `option--incorrect` применяются через `buildOptionClass()`.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'select'`.
- **Зависимости (imports):**
  - `QuizCardQuestionHeaderComponent` — заголовок и подсказка.
  - `LexemeDisplayComponent` — рендеринг фонетической транскриипции.
  - `MatCardModule`, `MatButtonModule`, `MatIconModule` — Angular Material.
- **Сервисы/утилиты:**
  - `resolveOptionCard()` из `src/app/core/data/cards/card-direction.utils.ts` — формирует `prompt`, `options`, `optionLexemes`, `correctIndex` с учётом направления.
  - `effectiveCardDirection()` из того же модуля — определяет фактическое направление в сессии.
  - `buildOptionClass()` из `src/app/shared/components/cards/option-card.utils.ts` — генерирует CSS-классы (`option`, `option--selected`, `option--correct`, `option--incorrect`).

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `SelectCard` | (required) | Данные карточки — вопрос, варианты, правильный индекс |
| `direction` | `'known-to-learning' \| 'learning-to-known'` | `'known-to-learning'` | Направление показа |
| `selectedIndex` | `number \| null` | `null` | Индекс выбранного варианта (управляется извне) |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи (`'correct'` \| `'incorrect'` \| `null`) |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `optionSelected` | `Output<number>` | Индекс выбранного варианта |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |

## Пример использования

```html
<app-select-card
  [card]="selectCardData"
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
const card: SelectCard = {
  id: 'select-1',
  kind: 'select',
  title: 'Выберите перевод',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Что означает «猫»?',
  optionsLearning: ['кошка', 'собака', 'птица', 'рыба'],
  optionsKnown: ['cat', 'dog', 'bird', 'fish'],
  optionsLexemes: [
    { primary: 'māo', script: 'hani' },
    undefined, undefined, undefined,
  ],
  correctIndex: 0,
};
```

### Внутренние вычисляемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `resolved` | `Computed<ResolvedOptionCard>` | Резолв карточки с учётом направления: `prompt`, `options`, `optionLexemes`, `correctIndex` |
| `promptLexeme()` | `() => PhoneticLexeme \| undefined` | Фонетика подсказки (из resolved или из карточки) |
| `optionLexeme(index)` | `(index: number) => PhoneticLexeme \| undefined` | Фонетика варианта по индексу |
| `optionClass(index)` | `(index: number) => string` | CSS-классы для варианта: `option`, `option--selected`, `option--correct`, `option--incorrect` |

### Методы

| Метод | Описание |
|-------|----------|
| `selectOption(index: number)` | Обработка выбора варианта. Если `feedback !== null` — игнорирует. Иначе эмитит `optionSelected(index)` |
