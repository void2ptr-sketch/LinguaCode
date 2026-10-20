# ClozeCard (пропуск)

> Исходный код: `src/app/entities/card/ui/cards/cloze-card/cloze-card.component.ts`

## Назначение

Карточка «заполни пропуск»: в предложении скрыто слово (маска `___`),
пользователь выбирает его из вариантов или вводит с клавиатуры.
Бимодальная: наличие `options` включает режим выбора, иначе — режим ввода.

## Модель данных

Тип `ClozeCard` определён в `src/app/entities/card/model/card.types.ts`.

| Поле              | Тип                  | Описание                                    |
| ----------------- | -------------------- | ------------------------------------------- |
| `kind`            | `'cloze'`            | Константа вида                              |
| `promptKnown`     | `string`             | Текст с маской пропуска (`___`)             |
| `options`         | `readonly string[]?` | Варианты выбора (режим выбора)              |
| `correctIndex`    | `number?`            | Индекс правильного варианта                 |
| `correctAnswer`   | `string`             | Правильный ответ (оба режима)               |
| `acceptedAnswers` | `readonly string[]?` | Допустимые варианты написания (режим ввода) |

## Проверка ответа

- Режим выбора: `selectedIndex === correctIndex`.
- Режим ввода: нечёткое сравнение через `matchesKeyboardAnswer` (нормализация,
  IPA/Pinyin/Palladius) по множеству `[correctAnswer, ...acceptedAnswers]`.

## Взаимодействие

- Рендерится в `CardHostComponent` при `card.kind === 'cloze'`.
- События: `optionSelected: Output<number>`, `answerTextChange: Output<string>`,
  `checkAnswer`, `nextCard`.

## Примеры данных

```json
{
  "id": "cloze-1",
  "kind": "cloze",
  "title": "Пропуск: спряжение глагола",
  "promptKnown": "I ___ coffee every morning.",
  "options": ["drinks", "drink", "drinking", "to drink"],
  "correctAnswer": "drink",
  "correctIndex": 1
}
```

```json
{
  "id": "cloze-input-1",
  "kind": "cloze",
  "title": "Пропуск (ввод): числительное",
  "promptKnown": "Five + five = ___",
  "correctAnswer": "ten",
  "acceptedAnswers": ["10"]
}
```
