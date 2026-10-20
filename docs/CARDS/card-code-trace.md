# CodeTraceCard (что выведет код)

> Исходный код: `src/app/entities/card/ui/cards/code-trace-card/code-trace-card.component.ts`

## Назначение

Карточка «что выведет код»: пользователь видит фрагмент программы с
подсветкой синтаксиса и выбирает, что программа выведет на экран.
Проверяет понимание исполнения кода, а не запоминание конструкций.

## Модель данных

Тип `CodeTraceCard` определён в `src/app/entities/card/model/card.types.ts`.

| Поле            | Тип                 | Описание                          |
| --------------- | ------------------- | --------------------------------- |
| `kind`          | `'code-trace'`      | Константа вида                    |
| `caption`       | `string?`           | Подпись (тема задания)            |
| `question`      | `string?`           | Вопрос («Что выведет программа?») |
| `code`          | `CodeBlock`         | Фрагмент кода (язык + текст)      |
| `outputOptions` | `readonly string[]` | Варианты вывода                   |
| `correctIndex`  | `number`            | Индекс правильного вывода         |

## Проверка ответа

- Option-карточка: входит в `OptionCard` и `isOptionCard`.
- `checkCardAnswer`: `selectedIndex === correctIndex` (как у `code-select`).
- Направление сессии не применимо.

## Взаимодействие

- Рендерится в `CardHostComponent` при `card.kind === 'code-trace'`.
- Подсветка: `CodeHighlightService`.
- События: `optionSelected: Output<number>`, `checkAnswer`, `nextCard`.

## Пример данных

```json
{
  "id": "code-trace-cpp-1",
  "kind": "code-trace",
  "title": "C++: что выведет код?",
  "question": "Что выведет программа?",
  "code": {
    "language": "cpp",
    "code": "#include <iostream>\nint main() {\n    int counter = 0;\n    ++counter;\n    ++counter;\n    std::cout << counter;\n}"
  },
  "outputOptions": ["1", "2", "3", "0"],
  "correctIndex": 1
}
```
