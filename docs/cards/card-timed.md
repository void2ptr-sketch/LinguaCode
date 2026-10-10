# TimedCard

> Исходный код: `src/app/shared/ui/cards/timed-card/timed-card.component.ts`

## Назначение

Компонент `TimedCardComponent` реализует карточку-вопрос с ограничением по времени.
Пользователь видит вопрос и варианты ответа, но должен выбрать ответ до истечения таймера.
Если время истекает — эмитится `timeExpired`, варианты ответов блокируются.

## Модель данных

Исходный тип: `TimedCard` (определён в `src/app/core/models/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'timed'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `direction` | `CardDirection` | Направление по умолчанию |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `optionsLearning` | `readonly string[]` | Варианты ответов на изучаемом языке |
| `optionsKnown` | `readonly string[] \| undefined` | Варианты на известном языке (для режима «новый → известный») |
| `optionsLexemes` | `readonly PhoneticLexeme[] \| undefined` | Фонетические транскрипции вариантов |
| `correctIndex` | `number` | Индекс правильного ответа (0-based) |
| `timeLimitSec` | `number` | Лимит времени в секундах |

## Use Cases

### 1. Инициализация и запуск таймера

- **Сценарий:** Карточка монтируется (`ngOnInit`).
- **Ввод:** `card`.
- **Вывод:** Таймер запускается через `window.setInterval`, отображается счётчик оставшегося времени. Варианты доступны для выбора.

### 2. Выбор варианта

- **Сценарий:** Пользователь кликает вариант.
- **Ввод:** Клик по индексу `N`.
- **Вывод:** Если `feedback !== null` или `secondsLeft <= 0` — игнорируется. Иначе эмитится `optionSelected(N)`.

### 3. Истечение времени

- **Сценарий:** Таймер досчитал до 0.
- **Ввод:** `secondsLeft` достигает 0.
- **Вывод:** Таймер останавливается (`clearInterval`), эмитится `timeExpired`. Варианты блокируются, проверка недоступна.

### 4. Проверка ответа

- **Сценарий:** Пользователь выбрал и нажал «Проверить» до истечения времени.
- **Ввод:** `selectedIndex !== null`, кнопка «Проверить».
- **Вывод:** Эмитится `checkAnswer`. Классы `option--correct` / `option--incorrect` применяются через `buildOptionClass()`.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'timed'`.
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
| `card` | `TimedCard` | (required) | Данные карточки — вопрос, варианты, лимит времени |
| `direction` | `'known-to-learning' \| 'learning-to-known'` | `'known-to-learning'` | Направление показа |
| `selectedIndex` | `number \| null` | `null` | Индекс выбранного варианта |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `optionSelected` | `Output<number>` | Индекс выбранного варианта |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |
| `timeExpired` | `Output<void>` | Время истекло (пользователь не успел ответить) |

## Пример использования

```html
<app-timed-card
  [card]="timedCardData"
  [direction]="direction"
  [selectedIndex]="selectedIndex"
  [feedback]="feedback"
  [fontSize]="'md'"
  (optionSelected)="onOptionSelected($event)"
  (checkAnswer)="onCheckAnswer()"
  (nextCard)="onNextCard()"
  (timeExpired)="onTimeExpired()"
/>
```

### Пример данных карточки

```typescript
const card: TimedCard = {
  id: 'timed-1',
  kind: 'timed',
  title: 'Быстрый выбор',
  appearance: { theme: 'red', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Выберите перевод «猫»',
  optionsLearning: ['кошка', 'собака', 'птица'],
  correctIndex: 0,
  timeLimitSec: 5,
};
```

### Внутренние сигналы

| Сигнал | Тип | Описание |
|--------|-----|----------|
| `secondsLeft` | `Signal<number>` | Оставшееся время в секундах |

### Жизненный цикл

| Метод | Описание |
|-------|----------|
| `ngOnInit()` | Запускает таймер через `startTimer()` |
| `ngOnDestroy()` | Останавливает таймер через `clearTimer()` |

### Методы

| Метод | Описание |
|-------|----------|
| `selectOption(index)` | Обработка выбора. Блокируется если `feedback !== null` или `secondsLeft <= 0` |
| `startTimer()` | Запускает `setInterval`, декрементирует `secondsLeft`, эмитит `timeExpired` при 0 |
| `clearTimer()` | Останавливает таймер через `clearInterval` |
