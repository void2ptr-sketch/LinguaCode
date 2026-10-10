# Архитектура: `shared`

Переиспользуемые UI-компоненты, pickers, рендер карточек. [INDEX.md](./INDEX.md) · [ARCHITECTURE.md](./ARCHITECTURE.md).

## Назначение

Общие building blocks для `features/` и `core/layout/`. Без маршрутов и без store фичи.

## Основные модули

| Область         | Путь                                                           | Назначение                                      |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| Card host       | `shared/ui/card-host`                                          | Рендер `Card` по `kind`; `memoryBoardNonce`     |
| Focus shell     | `shared/ui/card-focus-shell`                                   | Fullscreen overlay; reparent host → `body`      |
| Quiz cards      | `shared/ui/cards/`                                             | Select, memory, keyboard, draw, reading…        |
| Pinyin keyboard | `shared/ui/chinese/pinyin-keyboard`                            | Виртуальная клавиатура для `answerMode: pinyin` |
| Lexeme          | `shared/ui/chinese/lexeme-display`                             | G9/G10 отображение лексем                         |
| CJK ruby        | `shared/ui/chinese/cjk-ruby`                                   | Иероглифы с ruby-подписями (пиньинь, жуинь)       |
| IPA             | `shared/ui/chinese/phonetic-ipa`                               | Рендер IPA-транскрипции                             |
| Tone colors     | `shared/ui/chinese/tone-colored-text`                          | Цветовая маркировка тонов                           |
| Pickers         | `shared/ui/course-picker`, `shared/ui/lesson-picker`, `shared/ui/scenario-picker` | Выбор программы/урока/сценария                  |
| Quick switcher  | `shared/ui/active-language-pair-switcher`                      | Быстрое переключение активной языковой пары     |
| Display matrix  | `shared/ui/course-display-settings-matrix`                     | Матрица «задание / ответы» (G9g-e)              |
| Pagination      | `shared/utils/pagination`                                      | `UiPaginationComponent`, `PageRequest`          |
| Catalog search  | `features/card-catalog-search`                                 | Фильтры и store поиска карточек                 |
| Utils           | `shared/utils/card-answer/`                                    | Проверка ответов (CJK, IPA, reading fuzzy)      |
| Markdown        | `shared/utils/markdown-field`                                  | Поле ввода Markdown                             |

## CardHost — маршрутизация по kind

```mermaid
flowchart LR
  CardHost --> SelectCard
  CardHost --> MemoryCard
  CardHost --> KeyboardCard
  CardHost --> DrawCard
  CardHost --> SoundCard
  CardHost --> TimedCard
  CardHost --> SymbolCard
  CardHost --> ToneCard
  CardHost --> ReadingCard
  CardHost --> CardFocusShell
```

`CardFocusShellComponent` оборачивает карточку: при fullscreen host переносится в `document.body`, на `<body>` вешается класс `card-focus-shell-open`.

## Проверка ответов (`card-answer.utils.ts`)

| Kind / режим                        | Логика                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `select`, `timed`, `symbol`, `tone` | `correctIndex === selectedIndex` после `resolveOptionCard`                                            |
| `reading`                           | `matchesReadingCardSelection` — fuzzy match по pinyin / palladius / primary (`readingCandidateTexts`) |
| `keyboard`                          | `answerMode`: plain / pinyin / palladius / ipa / han — отдельные normalizers                          |
| `memory`                            | все пары найдены                                                                                      |
| `draw`                              | `hanzi-card-answer/` + Hanzi Engine grading                                                           |

## Pinyin keyboard

Компонент `app-pinyin-keyboard` + утилиты `core/domain/chinese/pinyin/pinyin-keyboard.utils.ts`:

- динамический ряд тонов над буквами (placeholder `—`, фиксированная высота);
- состояние: `committed` + `pendingSyllable` + `toneRowOpen`;
- тон ставится на **последнюю** гласную текущего слога;
- лимит слога — 6 символов (`MAX_PENDING_SYLLABLE_LENGTH`).

## Memory card

Две колонки; при переходе к следующей карточке `CardSelectStore` инкрементирует `memoryBoardNonce` → колонки перемешиваются заново (`memory-card.component.ts`).

## Диаграмма классов (упрощённо)

```mermaid
classDiagram
  class CardHostComponent {
    +card: input.required~Card~
    +fontSize: input~'sm' | 'md' | 'lg'~
    +direction: input~CardDirection~
    +feedback: input~CardFeedback~
    +selectedIndex: input~number | null~
    +answerText: input~string~
    +memoryComplete: input~boolean~
    +memoryBoardNonce: input~number~
    +drawSubmitted: input~boolean~
    +drawAnswer: input~DrawAnswerPayload | null~
    +focusControlsEnabled: input~boolean~
    +autoFocusFullscreen: input~boolean~
    +optionSelected: output~number~
    +answerTextChange: output~string~
    +memoryCompleteChange: output~boolean~
    +drawSubmittedChange: output~boolean~
    +drawAnswerChange: output~DrawAnswerPayload | null~
    +timeExpired: output~void~
    +checkAnswer: output~void~
    +nextCard: output~void~
  }
  class CardFocusShellComponent {
    +focusControlsEnabled: input~boolean~
    +autoEnterFullscreen: input~boolean~
    +fullscreen: signal~boolean~
    +reparentToBody()
  }
  class LexemeDisplayComponent {
    +lexeme: input~PhoneticLexeme | null~
    +fallbackText: input~string~
    +surface: input~LexemeDisplaySurface~
    +romanizations: input~RomanizationSystem[] | null~
    +showIpa: input~boolean | null~
    +inline: input~boolean~
    +toneColorEnabled: input~boolean | null~
  }
  class PinyinKeyboardComponent {
    +value: input~string~
    +disabled: input~boolean~
    +valueChange: output~string~
  }
  CardHostComponent --> CardFocusShellComponent
  CardHostComponent --> LexemeDisplayComponent : в дочерних card components
  KeyboardCard --> PinyinKeyboardComponent : answerMode pinyin
```

## Особенности

- SCSS через `--mat-sys-*` и grid layout.
- Pickers фильтруют по активной `LanguagePair` (G8).
- `LexemeDisplay.surface` — разделение «задание» / «ответы» (G9g, в работе).
- Аудио: `playLearningAudio` — сначала `audioUrl`, иначе Web Speech API (`card-learning-audio.utils.ts`).

## Связанные документы

- [CARD-CATALOG.md](./SYSTEM/CARD-CATALOG.md) · [CJK-CONTENT.md](./CONTENT/CJK-CONTENT.md) · [PHONETIC-CONTENT.md](./CONTENT/PHONETIC-CONTENT.md)
