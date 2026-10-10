# Поля карточек: сравнительная таблица редактирования

Документ описывает, как поля карточек разных типов отображаются в редакторе диалога карточек.

## Обзор типов карточек

| Тип карточки | Ключ | Группа формы | Назначение |
|-------------|------|-------------|-----------|
| Выбор ответа | `select` | choice | Выбор правильного ответа из списка на изучаемом языке |
| Код: выбор ответа | `code-select` | choice | Выбор правильного фрагмента кода из списка |
| Запоминание | `memory` | pairs | Запоминание пар "известный ↔ новый" |
| Символы | `symbol` | choice | Выбор правильного символа из списка |
| Звук | `sound` | media | Выбор правильного слова по звуку |
| На время | `timed` | choice | Выбор правильного ответа в ограниченное время |
| Клавиатура | `keyboard` | input | Ввод ответа с клавиатуры |
| Рисование | `draw` | input | Рисование иероглифа пошагово |
| Тон | `tone` | choice | Выбор правильного тона по слогу |
| Чтение | `reading` | choice | Выбор правильного варианта чтения (полифония) |

---

## Сравнительная таблица полей

| Поле / Карточка | `select` | `code-select` | `memory` | `symbol` | `sound` | `timed` | `keyboard` | `draw` | `tone` | `reading` |
|-----------------|----------|---------------|----------|----------|---------|---------|------------|--------|--------|-----------|
| **kind** | `select` | `code-select` | `memory` | `symbol` | `sound` | `timed` | `keyboard` | `draw` | `tone` | `reading` |
| **title** | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input |
| **appearance** | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) | (в отдельном panel) |
| **promptKnown** | mat-textarea (2 rows) | — | mat-textarea (2 rows) | mat-textarea (2 rows) | mat-textarea (2 rows) | mat-textarea (2 rows) | mat-textarea (2 rows) | mat-textarea (2 rows) | — | mat-textarea (2 rows) |
| **promptLexeme** | lexeme-fields | — | lexeme-fields | lexeme-fields | lexeme-fields (audioLabel) | lexeme-fields | lexeme-fields | lexeme-fields | lexeme-fields | lexeme-fields |
| **audioUrl** | mat-input | — | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input | mat-input |
| **direction** | mat-select (known-to-learning / learning-to-known) | — | — | mat-select | — | mat-select | mat-select | — | mat-select | mat-select |
| **optionsLearning** | mat-options-editor (radio) | — | — | — | — | mat-options-editor (radio) | — | — | — | mat-options-editor (radio) |
| **optionsKnown** | mat-options-editor (radio) | — | — | — | mat-options-editor (radio) | mat-options-editor (radio) | — | — | — | mat-options-editor (radio) |
| **optionsLexemes** | lexeme-fields в options-editor | — | — | lexeme-fields в options-editor | lexeme-fields в options-editor | lexeme-fields в options-editor | — | — | lexeme-fields в options-editor | lexeme-fields в options-editor |
| **correctIndex** | mat-radio-group | — | — | mat-radio-group | mat-radio-group | mat-radio-group | — | — | mat-radio-group | mat-radio-group |
| **caption** | — | mat-textarea (2 rows) | — | — | — | — | — | — | — | — |
| **prompt** (code) | — | mat-textarea (8 rows) + mat-select (language) + code-highlight | — | — | — | — | — | — | — | — |
| **options** (code) | — | mat-textarea (6 rows) × N + mat-select (language) × N + code-highlight | — | — | — | — | — | — | — | — |
| **correctIndex** (code) | — | mat-radio-group | — | — | — | — | — | — | — | — |
| **pairs** (known/learning) | — | — | pairs of mat-input (max 12) | — | — | — | — | — | — | — |
| **pairs.learningLexeme** | — | — | lexeme-fields в панели | — | — | — | — | — | — | — |
| **symbols** | — | — | — | mat-options-editor (radio) | — | — | — | — | — | — |
| **symbolLexemes** | — | — | — | lexeme-fields в options-editor | — | — | — | — | — | — |
| **audioLabelLearning** | — | — | — | — | mat-input | — | — | — | — | — |
| **audioLabelLexeme** | — | — | — | — | lexeme-fields | — | — | — | — | — |
| **timeLimitSec** | — | — | — | — | — | mat-input | — | — | — | — |
| **acceptedAnswersKnown** | — | — | — | — | — | — | mat-input × N (max 8) | — | — | — |
| **acceptedAnswersLearning** | — | — | — | — | — | — | mat-input × N (max 8) | — | — | — |
| **answerMode** | — | — | — | — | — | — | mat-select (text/ipa/pinyin/auto) | — | — | — |
| **referenceHintKnown** | — | — | — | — | — | — | — | mat-input | — | — |
| **meaningKnown** | — | — | — | — | — | — | — | mat-input (optional) | — | — |
| **targetCharacter** | — | — | — | — | — | — | — | mat-input (hidden, auto-filled) | — | — |
| **strokeGuides** | — | — | — | — | — | — | — | (internal) | — | — |
| **radicalHint** | — | — | — | — | — | — | — | mat-input | — | — |
| **characterTargets** | — | — | — | — | — | — | — | (advanced panel) | — | — |
| **syllableBase** | — | — | — | — | — | — | — | — | mat-input | — |
| **toneOptions** | — | — | — | — | — | — | — | — | mat-radio-group (tone buttons) | — |
| **practiceMode** | — | — | — | — | — | — | — | mat-select (stroke/character) | — | — |
| **promptLexeme primary** | mat-input / auto-sync | — | mat-input / auto-sync | mat-input / auto-sync | mat-input / auto-sync | mat-input / auto-sync | mat-input / auto-sync | mat-input (auto-filled from draw) | mat-input / auto-sync | mat-input / auto-sync |

---

## Справочник компонентов форм

### Группа `choice` (выбор из вариантов)

#### `choice-card-form.component.ts`

Используется для карточек: `select`, `reading`, `timed`, `symbol`, `tone`.

**Поля в UI:**
- `promptKnown` — mat-textarea (label: "Вопрос" или "Контекст" для reading, "Подсказка" для tone)
- `optionsLearning` / `symbols` — `CardOptionsEditorComponent` с mat-radio-group
- `correctIndex` — mat-radio-group внутри options-editor
- `syllableBase` + `toneOptions` — отдельный блок для tone (mat-input + mat-radio-group)

#### `code-select-card-form.component.ts`

Используется для карточки: `code-select`.

**Поля в UI:**
- `caption` — mat-textarea (optional)
- `prompt.code` — mat-textarea (8 rows) + mat-select (language) + code-highlight
- `options` — цикл по N (max 8) с mat-textarea (6 rows) + mat-select (language) + code-highlight
- `correctIndex` — mat-radio-group

### Группа `input` (ввод)

#### `input-card-form.component.ts`

Используется для карточек: `keyboard`, `draw`.

**Поля в UI (keyboard):**
- `promptKnown` — mat-textarea (2 rows)
- `acceptedAnswersKnown` — mat-input × N (max 8) с кнопками add/remove

**Поля в UI (draw):**
- `promptLexeme.primary` / `targetCharacter` — mat-input (auto-filled from Hanzi)
- `promptKnown` — mat-textarea (2 rows)
- `referenceHintKnown` — mat-input
- (доп. поля: meaningKnown, practiceMode, radicalHint, characterTargets — в расширенной вкладке)

### Группа `pairs` (пары)

#### `pairs-card-form.component.ts`

Используется для карточки: `memory`.

**Поля в UI:**
- `promptKnown` — mat-textarea (2 rows)
- `pairs` — цикл по N (max 12) с двумя mat-input (known + learning)
- `pairs.learningLexeme` — в отдельной панели phonetics

### Группа `media` (аудио)

#### `media-card-form.component.ts`

Используется для карточки: `sound`.

**Поля в UI:**
- `promptKnown` — mat-textarea (2 rows)
- `audioLabelLearning` — mat-input
- `audioLabelLexeme` — lexeme-fields (compact)
- `optionsKnown` — `CardOptionsEditorComponent` с mat-radio-group

---

## Справочник полей лексемы (LexemeDraftFields)

Используется в компоненте `lexeme-fields.component.ts`.

| Поле лексемы | UI-элемент | Описание |
|-------------|-----------|----------|
| `primary` | mat-input | Основной текст (ключевое слово) |
| `script` | mat-select | Письменность (latn, cyrl, han, kore, jpan) |
| `pinyin` | mat-input | Пиньинь (латинская транскрипция) |
| `zhuyin` | mat-input | Жуинь (Bopomofo, Taiwan) |
| `palladius` | mat-input | Палладица (кириллица) с кнопкой "авто из пиньинь" |
| `ipa` | mat-input | Международный фонетический алфавит с кнопками "авто" |
| `audioUrl` | mat-input | URL аудиофайла |
| `acceptedReadings` | mat-input | Допустимые ответы (через запятую) |

**Что показывается в зависимости от пары языков:**
- `ru-en` / `ru-ja` / `ru-ko` / `ru-vi`: показываются `pinyin`, `palladius`, `ipa`, `zhuyin`, `acceptedReadings`
- `en-ru` / `ja-ru` / `ko-ru` / `vi-ru`: показывается только `ipa`
- `zh-ru` / `zh-en`: показывается `pinyin`, `palladius`, `ipa`, `zhuyin`, `acceptedReadings`

---

## Сводная таблица: карточки ↔ группы форм

| Карточка | Группа формы | Компонент |
|---------|-------------|----------|
| `select` | choice | `ChoiceCardFormComponent` |
| `code-select` | choice | `CodeSelectCardFormComponent` |
| `memory` | pairs | `PairsCardFormComponent` |
| `symbol` | choice | `ChoiceCardFormComponent` |
| `sound` | media | `MediaCardFormComponent` |
| `timed` | choice | `ChoiceCardFormComponent` |
| `keyboard` | input | `InputCardFormComponent` |
| `draw` | input | `InputCardFormComponent` |
| `tone` | choice | `ChoiceCardFormComponent` |
| `reading` | choice | `ChoiceCardFormComponent` |

---

## Сводная таблица: компоненты ↔ поля

| Компонент | Поля |
|----------|------|
| `ChoiceCardFormComponent` | promptKnown, optionsLearning/symbols, optionsLexemes, correctIndex, syllableBase, toneOptions |
| `CodeSelectCardFormComponent` | caption, prompt.code + language, options.code + language, correctIndex |
| `InputCardFormComponent` | promptKnown, targetCharacter (draw), referenceHintKnown (draw), acceptedAnswersKnown (keyboard), answerMode (keyboard) |
| `PairsCardFormComponent` | promptKnown, pairs.known + learning, pairs.learningLexeme |
| `MediaCardFormComponent` | promptKnown, audioLabelLearning, audioLabelLexeme, optionsKnown, optionsLexemes |
| `LexemeFieldsComponent` | primary, script, pinyin, zhuyin, palladius, ipa, audioUrl, acceptedReadings |

---

## Примечания

1. **Группировка по типу редактора** (`card-form.registry.ts`):
   - `choice` — выбор из вариантов (радио-кнопки)
   - `input` — ввод текста
   - `pairs` — пары слов
   - `media` — аудио-варианты

2. **Фонетические поля** используют `LexemeDraftFields` — единая структура для всех карточек, использующих лексемы.

3. **CardOptionsEditorComponent** — универсальный компонент для списка вариантов с радио-выбором правильного.

4. **Количество вариантов**:
   - options/pairs: 2–8 (или 12 для memory)
   - keyboard acceptedAnswers: 1–8

5. **Auto-sync**: в режиме "Базовый" (не advanced) поля `primary` и `learning` синхронизируются автоматически.
