# CodeSelectCard

> Исходный код: `src/app/shared/ui/cards/code-select-card/code-select-card.component.ts`

## Назначение

Компонент `CodeSelectCardComponent` реализует карточку-вопрос с выбором правильного фрагмента кода.
Пользователь видит блок кода с вопросом (например, «Какой метод возвращает Observable?») и набор
вариантов — тоже блоки кода с подсветкой синтаксиса. Один из вариантов правильный.

## Модель данных

Исходный тип: `CodeSelectCard` (определён в `src/app/core/models/card.types.ts`).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор карточки |
| `kind` | `'code-select'` | Константа, определяющая тип карточки |
| `title` | `string` | Заголовок карточки |
| `appearance` | `CardAppearance` | Тема оформления и размер шрифта |
| `caption` | `string \| undefined` | Дополнительный заголовок-вопрос (если есть — используется вместо `title`) |
| `prompt` | `CodeBlock` | Блок кода-вопроса |
| `options` | `readonly CodeBlock[]` | Варианты ответов — блоки кода |
| `correctIndex` | `number` | Индекс правильного ответа (0-based) |

### CodeBlock

| Поле | Тип | Описание |
|------|-----|----------|
| `code` | `string` | Текст кода |
| `language` | `CodeHighlightLanguage` | Язык подсветки синтаксиса |

### CodeHighlightLanguage

`'perl' \| 'cpp' \| 'java' \| 'javascript' \| 'typescript' \| 'python' \| 'sql' \| 'bash' \| 'rust' \| 'go' \| 'plain'`

## Use Cases

### 1. Инициализация

- **Сценарий:** Карточка монтируется.
- **Ввод:** `card`.
- **Вывод:** `questionHeadline` вычисляется как `caption` (если есть и не пустой) или `title`. Варианты отображаются с подсветкой синтаксиса через `CodeHighlightComponent`.

### 2. Выбор варианта

- **Сценарий:** Пользователь кликает вариант кода.
- **Ввод:** Клик по индексу `N`.
- **Вывод:** Эмитится `optionSelected(N)`. Если `feedback !== null` — игнорируется.

### 3. Проверка ответа

- **Сценарий:** Пользователь выбрал и нажал «Проверить».
- **Ввод:** `selectedIndex !== null`.
- **Вывод:** Эмитится `checkAnswer`. Классы `option--correct` / `option--incorrect` применяются через `buildOptionClass()`.

## Взаимодействие с другими компонентами

- **Используется в:** `CardHostComponent` — рендерится при `card.kind === 'code-select'`.
- **Зависимости (imports):**
  - `CodeHighlightComponent` — подсветка синтаксиса для вопроса и вариантов.
  - `MatCardModule`, `MatButtonModule`, `MatIconModule` — Angular Material.
- **Утилиты:**
  - `buildOptionClass()` из `src/app/shared/ui/cards/option-card.util.ts` — CSS-классы для вариантов.

### @Input (входные параметры)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|---------------|----------|
| `card` | `CodeSelectCard` | (required) | Данные карточки — код-вопрос, варианты, правильный индекс |
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
<app-code-select-card
  [card]="codeCardData"
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
const card: CodeSelectCard = {
  id: 'code-1',
  kind: 'code-select',
  title: 'Angular Signals',
  caption: 'Какой метод создаёт вычисляемый сигнал?',
  appearance: { theme: 'dark', fontSize: 'md' },
  prompt: { code: 'import { signal, computed } from \'@angular/core\';', language: 'typescript' },
  options: [
    { code: 'signal(42)', language: 'typescript' },
    { code: 'computed(() => value())', language: 'typescript' },
    { code: 'new Subject()', language: 'typescript' },
  ],
  correctIndex: 1,
};
```

### Внутренние вычисляемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `questionHeadline` | `Computed<string>` | `caption` (trimmed) или `title` |
| `optionClass(index)` | `(index: number) => string` | CSS-классы: `option`, `option--selected`, `option--correct`, `option--incorrect` |

### Методы

| Метод | Описание |
|-------|----------|
| `selectOption(index: number)` | Обработка выбора. Если `feedback !== null` — игнорирует. Иначе эмитит `optionSelected(index)` |
