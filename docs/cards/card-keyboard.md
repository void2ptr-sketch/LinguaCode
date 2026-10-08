# KeyboardCard

> Исходный код: `src/app/shared/components/cards/keyboard-card/keyboard-card.component.ts`

## Назначение

Компонент `KeyboardCardComponent` реализует карточку с вводом текста.
Пользователь видит вопрос и вводит ответ в текстовое поле. Поддерживаются три режима ввода:
текст, IPA-транскрипция и пиньинь (с виртуальной клавиатурой).

## Модель данных

Исходный тип: `KeyboardCard` (определён в `src/app/core/models/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'keyboard'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `direction` | `CardDirection` | Направление по умолчанию |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `acceptedAnswersKnown` | `readonly string[]` | Допустимые ответы на известном языке |
| `acceptedAnswersLearning` | `readonly string[] \| undefined` | Допустимые ответы на изучаемом языке |
| `answerMode` | `KeyboardAnswerMode \| undefined` | Режим ввода |
| `audioUrl` | `string \| undefined` | URL аудио (из `LexemeCardFields`) |
| `promptLexeme` | `PhoneticLexeme \| undefined` | Фонетика подсказки (из `LexemeCardFields`) |

### KeyboardAnswerMode

`'text' \| 'ipa' \| 'pinyin' \| 'auto'`

## Use Cases

### 1. Инициализация с режимом ввода

- **Сценарий:** Карточка монтируется.
- **Ввод:** `card`.
- **Вывод:** `answerMode` вычисляется через `resolveKeyboardAnswerMode()` — определяет режим ввода:
  - `'ipa'` — поле получает CSS-класс `.phonetic-ipa`, показывается подсказка IPA.
  - `'pinyin'` — показывается `PinyinKeyboardComponent` (виртуальная клавиатура).
  - `'text'` / `'auto'` — обычное текстовое поле.

### 2. Ввод ответа

- **Сценарий:** Пользователь вводит текст в поле.
- **Ввод:** Ввод символов.
- **Вывод:** `ngModelChange` эмитит `answerTextChange(newValue)`. Если режим `pinyin` — используется виртуальная клавиатура.

### 3. Проверка ответа

- **Сценарий:** Пользователь ввёл текст и нажал «Проверить».
- **Ввод:** `answerText` не пустой, кнопка «Проверить».
- **Вывод:** Эмитится `checkAnswer`. При `feedback === 'incorrect'` показывается правильный ответ через `getCorrectAnswerLabel()`.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'keyboard'`.
- **Зависимости (imports):**
  - `FormsModule` — двустороннее связывание через `ngModel`.
  - `QuizCardQuestionHeaderComponent` — заголовок и подсказка.
  - `LexemeDisplayComponent` — рендеринг фонетической транскриипции.
  - `PinyinKeyboardComponent` — виртуальная клавиатура пиньинь.
  - `MatCardModule`, `MatButtonModule`, `MatFormFieldModule`, `MatIconModule`, `MatInputModule` — Angular Material.
- **Утилиты:**
  - `resolveKeyboardAnswerMode()` из `src/app/core/data/keyboard-answer-mode/keyboard-answer-mode.utils.ts`.
  - `resolveKeyboardPrompt()` из `src/app/core/data/cards/card-direction.utils.ts`.
  - `effectiveCardDirection()` из того же модуля.
  - `getCorrectAnswerLabel()` из `src/app/shared/utils/card-answer.utils.ts`.

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `KeyboardCard` | (required) | Данные карточки — вопрос, допустимые ответы |
| `direction` | `'known-to-learning' \| 'learning-to-known'` | `'known-to-learning'` | Направление показа |
| `answerText` | `string` | `''` | Текущий текст ввода |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `answerTextChange` | `Output<string>` | Изменение текста ввода |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |

## Пример использования

```html
<app-keyboard-card
  [card]="keyboardCardData"
  [direction]="direction"
  [answerText]="answerText"
  [feedback]="feedback"
  [fontSize]="'md'"
  (answerTextChange)="answerText = $event"
  (checkAnswer)="onCheckAnswer()"
  (nextCard)="onNextCard()"
/>
```

### Пример данных карточки

```typescript
const card: KeyboardCard = {
  id: 'keyboard-1',
  kind: 'keyboard',
  title: 'Напишите перевод',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Как по-китайски «привет»?',
  acceptedAnswersKnown: ['你好'],
  acceptedAnswersLearning: ['nǐ hǎo'],
  answerMode: 'pinyin',
};
```

### Внутренние вычисляемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `answerMode` | `Computed<KeyboardAnswerMode>` | Режим ввода: `'ipa'` \| `'pinyin'` \| `'text'` \| `'auto'` |
| `usesIpaInput` | `Computed<boolean>` | `true` если режим `'ipa'` |
| `usesPinyinKeyboard` | `Computed<boolean>` | `true` если режим `'pinyin'` |
| `resolvedPrompt` | `Computed<string>` | resolved подсказка через `resolveKeyboardPrompt()` |
| `promptLexeme` | `Computed<PhoneticLexeme \| undefined>` | Фонетика подсказки с учётом направления |

### Методы

| Метод | Описание |
|-------|----------|
| `correctLabel()` | Возвращает метку правильного ответа через `getCorrectAnswerLabel()` |
