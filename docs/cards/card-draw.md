# DrawCard

> Исходный код: `src/app/shared/ui/cards/draw-card/draw-card.component.ts`

## Назначение

Компонент `DrawCardComponent` — самый сложный тип карточки. Реализует практику рисования
китайских иероглифов. Пользователь рисует иероглиф на canvas, затем проверяет точность черт
через сравнение с эталонной моделью. Поддерживает несколько режимов холста:
«память» (рисование), «порядок черт» (анимация), «радикалы» (разбор структуры).
Может содержать несколько иероглифов за раз (слоги слова).

## Модель данных

Исходный тип: `DrawCard` (определён в `src/app/core/models/cards/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'draw'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `promptKnown` | `string` | Текст вопроса / подсказки |
| `referenceHintKnown` | `string` | Подсказка-перевод для зоны вопроса |
| `meaningKnown` | `string \| undefined` | Значение/перевод в зоне вопроса (без иероглифа) |
| `practiceMode` | `DrawPracticeMode \| undefined` | Режим практики |
| `targetCharacter` | `string \| undefined` | Целевой иероглиф для рисования |
| `strokeGuides` | `readonly DrawStrokeGuide[] \| undefined` | Подсказки порядка черт |
| `radicalHint` | `string \| undefined` | Подсказка радикалов (например, «氵(вода) + 每») |
| `characterTargets` | `readonly DrawCharacterTarget[] \| undefined` | Несколько иероглифов (слогов) за раз |
| `audioUrl` | `string \| undefined` | URL аудио (из `LexemeCardFields`) |
| `promptLexeme` | `PhoneticLexeme \| undefined` | Фонетика подсказки (из `LexemeCardFields`) |

### DrawPracticeMode

Определяется в `src/app/core/models/phonetics/draw-practice.types.ts`.

### DrawCharacterTarget

| Поле | Тип | Описание |
|------|-----|----------|
| `character` | `string` | Символ иероглифа |
| `pinyin` | `string` | Пиньинь произношения |
| `radicalHint` | `string \| undefined` | Подсказка радикалов для этого иероглифа |

## Use Cases

### 1. Инициализация

- **Сценарий:** Карточка монтируется.
- **Ввод:** `card`.
- **Вывод:** `characterTargets` резолвятся через `resolveDrawCharacterTargets()`. Если есть несколько иероглифов — показываются табы. `panelMode` устанавливается в начальный режим через `resolveInitialDrawCanvasMode()`. Массивы `charDone` и `charStrokes` инициализируются для каждого иероглифа.

### 2. Рисование иероглифа

- **Сценарий:** Пользователь рисует на canvas.
- **Ввод:** События `strokesChange` от `DrawCanvasComponent`.
- **Вывод:** `onStrokesChange()` сохраняет черту в `charStrokes[activeCharIndex]`, обновляет `hasStrokes`. Если черта удалена — сбрасывает `charDone[index]` и `drawSubmitted`.

### 3. Переключение режима холста

- **Сценарий:** Пользователь переключает режим через `mat-button-toggle-group`.
- **Ввод:** Клик по режиму (`memory` \| `stroke-order` \| `radicals`).
- **Вывод:** `saveActiveStrokes()` сохраняет текущие черты, `panelMode` обновляется, `loadActiveStrokes()` загружает черты для нового режима.

### 4. Переключение иероглифа (слоги)

- **Сценарий:** Несколько иероглифов, пользователь переключает табы.
- **Ввод:** Клик по табу индекса `N`.
- **Вывод:** `saveActiveStrokes()` сохраняет текущий, `activeCharIndex.set(N)`, `loadActiveStrokes()` загружает черты для нового.

### 5. Отправка и проверка рисунка

Workflow зависит от количества иероглифов в карточке:

#### Один иероглиф (однозначный)

- **Сценарий:** Пользователь нарисовал иероглиф.
- **Ввод:** `hasStrokes === true`, кнопка «Проверить».
- **Вывод:** `submitAndCheck()` вызывает `submitDrawing()` (сохраняет черта, эмитит `drawSubmittedChange(true)` + `drawAnswerChange`) и сразу `checkAnswer.emit()`. Один клик.

#### Несколько иероглифов (слово)

- **Сценарий:** Пользователь рисует по одному иероглифу в слове.
- **Ввод:** Кнопки меняются динамически:

| Состояние | Кнопка | Действие |
|-----------|--------|----------|
| Не все нарисованы | **Готово, следующий** | `submitDrawing()` — сохраняет текущий, переключает на следующий |
| Все нарисованы, не отправлено | **Готово** + **Проверить** | «Готово» → `submitDrawing()`, «Проверить» → `checkAnswer.emit()` |
| Отправлено | **Проверить** | `checkAnswer.emit()` |

- **Вывод после проверки:** Система загружает модели иероглифов через `HanziDataService.loadCharacters()`, сравнивает нарисованные черта с эталонными через `gradeHanziMemoryStrokes()`. При `feedback === 'correct'` — «Ответ принят!». При `feedback === 'incorrect'` — «Есть ошибки в чертах».

### 6. Режим памяти с обратной связью

- **Сценарий:** После проверки в режиме `memory`.
- **Вывод:** `memoryStrokeGrades` вычисляет точность каждой черты через `gradeHanziMemoryStrokes()`, отображается на canvas.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'draw'`.
- **Зависимости (imports):**
  - `DrawCanvasComponent` — canvas для рисования черт.
  - `ToneColoredTextComponent` — цветовой рендеринг пиньинь.
  - `LexemeDisplayComponent` — рендеринг фонетической транскриипции.
  - `MatCardModule`, `MatButtonModule`, `MatButtonToggleModule`, `MatIconModule` — Angular Material.
  - `UserStore` (через `inject()`) — настройки CJK-обучения.
  - `HanziDataService` (через `inject()`) — данные иероглифов.
- **Утилиты:**
  - `resolveDrawCharacterTargets()` из `src/app/core/domain/chinese/drawing/draw-card.utils.ts`.
  - `resolveDrawPromptLexeme()` из того же модуля.
  - `resolveDrawQuestion()` из того же модуля.
  - `resolveDrawAudioUrl()` из того же модуля.
  - `resolveDrawLearningSpeechText()` из того же модуля.
  - `resolveInitialDrawCanvasMode()` из того же модуля.
  - `drawCharacterTabPinyinLabel()` из того же модуля.
  - `parseRadicalHintParts()` из того же модуля.
  - `resolveRadicalComponentPalette()` и `radicalComponentColor()` из `src/app/core/domain/chinese/phonetics/radical-component-color.utils.ts`.
  - `gradeHanziMemoryStrokes()` из `src/app/core/hanzi-engine/hanzi-memory-validation.utils.ts`.
  - `playLearningAudio()` из `src/app/core/repositories/cards/utils/card-learning-audio.utils.ts`.

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `DrawCard` | (required) | Данные карточки — иероглифы, подсказки |
| `drawSubmitted` | `boolean` | `false` | Флаг отправки рисунка |
| `feedback` | `CardFeedback` | `null` | Состояние обратной связи |
| `fontSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер шрифта |

### @Output (выходные события)

| Событие | Тип | Описание |
|---------|-----|----------|
| `drawSubmittedChange` | `Output<boolean>` | Изменение статуса отправки |
| `drawAnswerChange` | `Output<DrawAnswerPayload \| null>` | Данные ответа (черты по иероглифам) |
| `checkAnswer` | `Output<void>` | Запрос на проверку ответа |
| `nextCard` | `Output<void>` | Переход к следующей карточке |

## Пример использования

```html
<app-draw-card
  [card]="drawCardData"
  [drawSubmitted]="drawSubmitted"
  [feedback]="feedback"
  [fontSize]="'md'"
  (drawSubmittedChange)="drawSubmitted = $event"
  (drawAnswerChange)="onDrawAnswer($event)"
  (checkAnswer)="onCheckAnswer()"
  (nextCard)="onNextCard()"
/>
```

### Пример данных карточки

```typescript
const card: DrawCard = {
  id: 'draw-1',
  kind: 'draw',
  title: 'Нарисуйте иероглиф',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  promptKnown: 'Нарисуйте «水»',
  referenceHintKnown: 'вода',
  meaningKnown: 'water',
  targetCharacter: '水',
  strokeGuides: [
    // DrawStrokeGuide[]
  ],
  radicalHint: '氵(вода)',
};
```

### Внутренние сигналы

| Сигнал | Тип | Описание |
|--------|-----|----------|
| `panelMode` | `Signal<DrawCanvasMode>` | Текущий режим панели холста: `memory` \| `stroke-order` \| `radicals` |
| `activeCharIndex` | `Signal<number>` | Индекс активного иероглифа (слага) |
| `charDone` | `Signal<readonly boolean[]>` | Массив статусов готовности по иероглифам |
| `charStrokes` | `Signal<readonly (readonly DrawStrokePath[])[]>` | Черты по иероглифам |
| `hasStrokes` | `Signal<boolean>` | Есть ли черта на активном холсте |
| `reviewCanvasSize` | `Signal<{ width: number; height: number }>` | Размер холста для режима проверки |

### Внутренние вычисляемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `questionLabel` | `Computed<string>` | Подсказка вопроса через `resolveDrawQuestion()` |
| `promptLexeme` | `Computed<PhoneticLexeme \| undefined>` | Фонетика подсказки |
| `characterTargets` | `Computed<readonly DrawCharacterTarget[]>` | Целевые иероглифы |
| `activeTarget` | `Computed<DrawCharacterTarget \| undefined>` | Активный иероглиф |
| `learningAudioUrl` | `Computed<string \| undefined>` | URL аудио для воспроизведения |
| `learningSpeechText` | `Computed<string \| undefined>` | Текст для TTS |
| `canPlayLearningAudio` | `Computed<boolean>` | Можно ли воспроизвести аудио |
| `showSyllableTabs` | `Computed<boolean>` | Показать табы слогов |
| `hasMultipleSyllables` | `Computed<boolean>` | Несколько ли слогов |
| `ghostCharacter` | `Computed<string \| null>` | Иероглиф-призрак для отображения |
| `radicalCanvasHints` | `Computed<readonly { character: string; color: string }[]>` | Подсказки радикалов с цветами |
| `memoryStrokeGrades` | `Computed<readonly StrokeGrade[]>` | Оценки точности черт в режиме проверки |
| `allCharsDone` | `Computed<boolean>` | Все ли иероглифы нарисованы |

### Методы

| Метод | Описание |
|-------|----------|
| `onCanvasModeChange(mode)` | Переключение режима холоста |
| `selectCanvasPanel(mode)` | Сохранение черт + переключение режима |
| `selectCharacterTab(index)` | Переключение иероглифа с сохранением черт |
| `onStrokesChange(hasStrokes)` | Обработка изменения черт |
| `clearAllStrokes()` | Очистка всех черт всех иероглифов |
| `submitDrawing()` | Отправка рисунка, пометка как done, переход к следующему |
| `submitAndCheck()` | Для одного иероглифа: отправляет рисунок и сразу эмитит `checkAnswer` (один клик) |
| `playLearningAudio()` | Воспроизведение аудио/TTS |
| `tabLabel(index)` | Метка таба: пиньинь + индекс |
| `isCharTabActive(index)` | Активен ли таб |
| `isCharTabDone(index)` | Готов ли таб |

### Private-методы

| Метод | Описание |
|-------|----------|
| `saveActiveStrokes()` | Сохраняет чертаы активного canvas в `charStrokes` |
| `loadActiveStrokes()` | Загружает чертаы из `charStrokes` на canvas |
| `buildDrawAnswerPayload()` | Формирует `DrawAnswerPayload` с чертами по иероглифам |
| `captureReviewCanvasSize()` | Записывает размер canvas для режима проверки |

### Effects (реактивные эффекты)

| Effect | Описание |
|--------|----------|
| `characterTargets effect` | Загружает модели иероглифов через `HanziDataService.loadCharacters()` |
| `card change effect` | Сбрасывает состояние при смене карточки: режим, индекс, done-статусы |
| `feedback effect` | При появлении feedback — сохраняет чертаы и загружает модели |
