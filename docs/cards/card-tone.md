# ToneCard

> Исходный код: `src/app/shared/ui/cards/tone-card/tone-card.component.ts`

## Назначение

Компонент `ToneCardComponent` реализует карточку-вопрос для изучения тонов китайских иероглифов.
Пользователь видит слог (базовую пиньинь-форму без тона) и набор вариантов — тот же слог
с разными тоновыми марками. Нужно выбрать правильный тон.

## Модель данных

Исходный тип: `ToneCard` (определён в `src/app/core/models/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'tone'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `direction` | `CardDirection` | Направление по умолчанию |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `syllableBase` | `string` | Базовый слог пиньинь без тона (например, `ni`) |
| `toneOptions` | `readonly ToneMark[]` | Доступные тоновые марки для выбора |
| `correctIndex` | `number` | Индекс правильного тона (0-based) |

### ToneMark

Определяется в `src/app/core/models/phonetic-content.types.ts` — тоновая марка китайского слога.

## Use Cases

### 1. Инициализация

- **Сценарий:** Карточка монтируется.
- **Ввод:** `card`.
- **Вывод:** Базовый слог `syllableBase` отображается в секции вопроса. Варианты — слог с каждой тоновой маркой, цветовой маркировкой тонов через `ToneColoredTextComponent`.

### 2. Выбор тона

- **Сценарий:** Пользователь кликает вариант тона.
- **Ввод:** Клик по индексу `N`.
- **Вывод:** Эмитится `optionSelected(N)`. Если `feedback !== null` — игнорируется.

### 3. Проверка ответа

- **Сценарий:** Пользователь выбрал и нажал «Проверить».
- **Ввод:** `selectedIndex !== null`.
- **Вывод:** Эмитится `checkAnswer`. При `feedback === 'incorrect'` показывается правильный тон с пиньинь.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'tone'`.
- **Зависимости (imports):**
  - `QuizCardQuestionHeaderComponent` — заголовок и подсказка.
  - `ToneColoredTextComponent` — цветовой рендеринг пиньинь с тонами.
  - `MatCardModule`, `MatButtonModule`, `MatIconModule` — Angular Material.
- **Утилиты:**
  - `toneMarkLabel()` из `src/app/core/domain/chinese/answers/tone-mark.utils.ts` — текстовая метка тона (например, «1-й тон»).
  - `applyToneToPinyinSyllable()` из `src/app/core/domain/chinese/answers/tone-mark.utils.ts` — применяет тоновую марку к базовому слогу.
  - `buildOptionClass()` из `src/app/shared/ui/cards/option-card.util.ts` — CSS-классы.

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `ToneCard` | (required) | Данные карточки — базовый слог, варианты тонов |
| `direction` | `'known-to-learning' \| 'learning-to-known'` | `'known-to-learning'` | Направление показа |
| `selectedIndex` | `number \| null` | `null` | Индекс выбранного тона |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `optionSelected` | `Output<number>` | Индекс выбранного тона |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |

## Пример использования

```html
<app-tone-card
  [card]="toneCardData"
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
const card: ToneCard = {
  id: 'tone-1',
  kind: 'tone',
  title: 'Тон слога',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Какой тон у иероглифа «妈»?',
  syllableBase: 'ma',
  toneOptions: [
    // ToneMark значения
  ],
  correctIndex: 0,
};
```

### Внутренние методы

| Метод | Описание |
|-------|----------|
| `toneLabel(tone: ToneMark)` | Возвращает текстовую метку тона через `toneMarkLabel()` |
| `tonedSyllable(tone: ToneMark)` | Возвращает слог с применённой тоновой маркой через `applyToneToPinyinSyllable()` |
| `optionClass(index)` | CSS-классы: `option`, `option--selected`, `option--correct`, `option--incorrect` |
| `selectOption(index)` | Обработка выбора. Если `feedback !== null` — игнорирует. Иначе эмитит `optionSelected(index)` |
