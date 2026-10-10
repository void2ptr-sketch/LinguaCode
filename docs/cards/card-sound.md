# SoundCard

> Исходный код: `src/app/shared/ui/cards/sound-card/sound-card.component.ts`

## Назначение

Компонент `SoundCardComponent` реализует карточку-вопрос «послушай и выбери перевод».
Пользователь нажимает кнопку воспроизведения, слышит аудио (запись или TTS-синтез),
и выбирает правильный перевод из предложенных вариантов.

## Модель данных

Исходный тип: `SoundCard` (определён в `src/app/core/models/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'sound'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `direction` | `CardDirection` | Направление по умолчанию |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `audioUrl` | `string \| undefined` | URL аудиофайла для воспроизведения (из `LexemeCardFields`) |
| `promptLexeme` | `PhoneticLexeme \| undefined` | Фонетика подсказки (из `LexemeCardFields`) |
| `audioLabelLearning` | `string` | Текст для TTS-синтеза (если нет аудиофайла) |
| `optionsKnown` | `readonly string[]` | Варианты перевода на известном языке |
| `optionsLexemes` | `readonly PhoneticLexeme[] \| undefined` | Фонетические транскрипции вариантов |
| `correctIndex` | `number` | Индекс правильного ответа (0-based) |

## Use Cases

### 1. Инициализация

- **Сценарий:** Карточка монтируется.
- **Ввод:** `card`.
- **Вывод:** Кнопка «Прослушать» с иконкой `volume_up`. `stimulusLexeme` вычисляется: если есть `promptLexeme.primary` — используется он, иначе — `audioLabelLearning`. `hasAudioFile` = `Boolean(audioUrl?.trim())`.

### 2. Воспроизведение аудио

- **Сценарий:** Пользователь нажимает «Прослушать».
- **Ввод:** Клик по кнопке.
- **Вывод:** `playAudio()` вызывает `resolveLearningSpeech()` для определения текста и локали, затем `playLearningAudio()` с `audioUrl` или TTS-синтезом.

### 3. Выбор варианта перевода

- **Сценарий:** Пользователь прослушал и выбрал вариант.
- **Ввод:** Клик по индексу `N`.
- **Вывод:** Эмитится `optionSelected(N)`. Если `feedback !== null` — игнорируется.

### 4. Проверка ответа

- **Сценарий:** Пользователь выбрал и нажал «Проверить».
- **Ввод:** `selectedIndex !== null`.
- **Вывод:** Эмитится `checkAnswer`. При `feedback === 'incorrect'` показывается правильный перевод.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'sound'`.
- **Зависимости (imports):**
  - `QuizCardQuestionHeaderComponent` — заголовок и подсказка.
  - `LexemeDisplayComponent` — рендеринг фонетической транскриипции.
  - `MatCardModule`, `MatButtonModule`, `MatIconModule` — Angular Material.
  - `UserStore` (через `inject()`) — получение пары языков пользователя.
- **Утилиты:**
  - `resolveOptionCard()` из `src/app/core/repositories/cards/utils/card-direction.utils.ts` — формирует варианты ответа.
  - `effectiveCardDirection()` из `src/app/core/repositories/cards/utils/card-direction.utils.ts` — определяет фактическое направление.
  - `playLearningAudio()` из `src/app/core/repositories/cards/utils/card-learning-audio.utils.ts` — воспроизведение аудио/TTS.
  - `resolveLearningSpeech()` из того же модуля — определение текста и локали для TTS.
  - `buildOptionClass()` из `src/app/shared/ui/cards/option-card.util.ts` — CSS-классы.

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `SoundCard` | (required) | Данные карточки — аудио, варианты перевода |
| `selectedIndex` | `number \| null` | `null` | Индекс выбранного варианта |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `optionSelected` | `Output<number>` | Индекс выбранного варианта |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |

## Пример использования

```html
<app-sound-card
  [card]="soundCardData"
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
const card: SoundCard = {
  id: 'sound-1',
  kind: 'sound',
  title: 'Послушай и выбери',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Что вы слышите?',
  audioUrl: '/assets/audio/hello.mp3',
  audioLabelLearning: 'hello',
  optionsKnown: ['привет', 'пока', 'спасибо', 'до свидания'],
  correctIndex: 0,
};
```

### Внутренные вычисляемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `resolved` | `Computed<ResolvedOptionCard>` | Резолв карточки с учётом направления |
| `stimulusLexeme` | `Computed<PhoneticLexeme>` | Текст/фонетика для воспроизведения |
| `hasAudioFile` | `Computed<boolean>` | Есть ли аудиофайл (`audioUrl` не пустой) |
| `optionLexeme(index)` | `(index: number) => PhoneticLexeme \| undefined` | Фонетика варианта по индексу |
| `optionClass(index)` | `(index: number) => string` | CSS-классы для варианта |

### Методы

| Метод | Описание |
|-------|----------|
| `playAudio()` | Воспроизводит аудио через `playLearningAudio()` с `audioUrl` или TTS |
| `selectOption(index)` | Обработка выбора. Если `feedback !== null` — игнорирует. Иначе эмитит `optionSelected(index)` |
