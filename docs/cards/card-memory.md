# MemoryCard

> Исходный код: `src/app/shared/ui/cards/memory-card/memory-card.component.ts`

## Назначение

Компонент `MemoryCardComponent` реализует карточку-упражнение типа «memory» (сопоставление пар).
Пользователь видит два столбца — слова на известном языке и слова на новом языке — и должен
соединить каждую пару кликом: сначала элемент в одном столбце, затем его партнёр в другом.
После того как все пары сопоставлены, пользователь нажимает «Проверить» (или карточка
автоматически завершается при `feedback === 'correct'`).

## Модель данных

Исходный тип: `MemoryCard` (определён в `src/app/core/models/cards/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'memory'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки (отображается в `QuizCardQuestionHeaderComponent`) |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `promptKnown` | `string` | Инструкция к заданию (например, «Сопоставьте переводы») |
| `promptLexeme` | `PhoneticLexeme \| undefined` | Опциональная фонетическая транскрипция подсказки (из `LexemeCardFields`) |
| `audioUrl` | `string \| undefined` | URL аудио (из `LexemeCardFields`) |
| `pairs` | `readonly MemoryPair[]` | Массив пар для сопоставления |

### MemoryPair

Определён в `src/app/core/models/cards/card.types.ts`.

| Поле | Тип | Описание |
|------|-----|----------|
| `known` | `string` | Слово/фраза на известном языке |
| `learning` | `string` | Перевод на новом языке |
| `learningLexeme` | `PhoneticLexeme \| undefined` | Фонетика для «новой» стороны |

## Use Cases

### 1. Инициализация доски

- **Сценарий:** Компонент монтируется или получает новую карточку.
- **Ввод:** `card`, `direction`, `boardNonce`.
- **Вывод:** Столбцы `leftItems` и `rightItems` заполнены и перемешаны алгоритмом Фишера-Йейтса; `selectedItemId`, `matchedPairIds`, `mismatchItemIds` сброшены.

### 2. Сопоставление пары (правильный ответ)

- **Сценарий:** Пользователь кликает элемент в левом столбце, затем его партнёр в правом.
- **Ввод:** Два клика по элементам с одинаковым `pairId` из разных столбцов.
- **Вывод:** Элементы помечаются как `matched` (класс `memory-item--matched`, кнопка `disabled`), пара добавляется в `matchedPairIds`. Если все пары найдены — эмитится `memoryComplete(true)`.

### 3. Неправильное сопоставление

- **Сценарий:** Пользователь кликает элементы с разными `pairId`.
- **Ввод:** Два клика по элементам из разных столбцов, не являющимся парой.
- **Вывод:** Оба элемента подсвечиваются красным (класс `memory-item--mismatch`) в течение 700 мс через `window.setTimeout`. Состояние сбрасывается, доска остаётся открытой.

### 4. Смена направления (known ↔ learning)

- **Сценарий:** Пользователь переключает toggle «Известный ↔ Новый» в сессии.
- **Ввод:** `direction` меняется с `'known-to-learning'` на `'learning-to-known'` (или наоборот).
- **Вывод:** `columnLabels` пересчитывается (`computed`), левый столбец получает «Новый» / «Известный» в зависимости от направления; пары пересоздаются и перемешиваются.

### 5. Перемешивание при повторном открытии

- **Сценарий:** Карточка закрывается и открывается снова в той же сессии.
- **Ввод:** `boardNonce` инкрементируется (внешний триггер).
- **Вывод:** `effect` реагирует на изменение `boardNonce`, вызывает `resetBoard()` — столбцы заново перемешиваются.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` (`src/app/shared/components/card-host/card-host.component.ts`) — рендерится как один из вариантов в зависимости от `card.kind`.
- **Зависимости (imports):**
  - `QuizCardQuestionHeaderComponent` — отображение заголовка и подсказки (`title`, `promptKnown`, `promptLexeme`).
  - `LexemeDisplayComponent` — рендеринг фонетической транскриипции рядом с текстом.
  - `MatCardModule`, `MatButtonModule`, `MatIconModule` — Angular Material.
- **Сервисы/утилиты:**
  - `resolveMemoryPairs()` из `src/app/core/repositories/cards/utils/card-direction.utils.ts` — формирует пары для левого и правого столбца с учётом `direction` (результат содержит `left`, `right`, `leftLexeme`, `rightLexeme`).
  - `CardFeedback` из `src/app/shared/types` — состояние обратной связи (`null` | `'correct'` | `'incorrect'`).

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `MemoryCard` | (required) | Данные карточки — пары, заголовок, подсказка |
| `direction` | `'known-to-learning' \| 'learning-to-known'` | `'known-to-learning'` | Направление сопоставления |
| `boardNonce` | `number` | `0` | Nonce-триггер для перемешивания при повторном открытии |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи от сессии |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта для стилизации |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `memoryComplete` | `Output<boolean>` | Эмитируется `true`, когда все пары сопоставлены |
| `checkAnswer` | `Output<void>` | Эмитируется при нажатии кнопки «Проверить» (все пары найдены) |
| `nextCard` | `Output<void>` | Эмитируется при нажатии кнопки «Далее» (после `feedback`) |

## Пример использования

```html
<app-memory-card
  [card]="cardData"
  [direction]="direction"
  [boardNonce]="nonce"
  [feedback]="feedback"
  [fontSize]="'md'"
  (memoryComplete)="onMemoryComplete($event)"
  (checkAnswer)="onCheckAnswer()"
  (nextCard)="onNextCard()"
/>
```

### Пример данных карточки (из теста `memory-card.component.spec.ts`)

```typescript
const card: MemoryCard = {
  id: 'memory-1',
  kind: 'memory',
  title: 'Пары слов',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  promptKnown: 'Сопоставьте переводы',
  pairs: [
    { known: 'Привет', learning: 'Hello' },
    { known: 'Пока', learning: 'Bye' },
  ],
};
```

### Внутренние состояния (Signals)

| Сигнал | Тип | Описание |
|--------|-----|----------|
| `leftItems` | `Signal<readonly MemoryColumnItem[]>` | Перемешанные элементы левого столбца |
| `rightItems` | `Signal<readonly MemoryColumnItem[]>` | Перемешанные элементы правого столбца |
| `selectedItemId` | `Signal<string \| null>` | ID выбранного элемента (null = ничего не выбрано) |
| `matchedPairIds` | `Signal<readonly string[]>` | ID пар, которые уже найдены |
| `mismatchItemIds` | `Signal<readonly string[]>` | ID элементов с неверной парой (для подсветки ошибки) |

### Внутренние типы

```typescript
type MemoryColumnItem = {
  id: string;          // Уникальный ID: `${pairId}-left` или `${pairId}-right`
  pairId: string;      // ID пары (индекс пары как строка)
  column: 'left' | 'right';
  label: string;       | Текст элемента (слово или перевод)
  lexeme?: PhoneticLexeme; // Опциональная фонетика
};
```
