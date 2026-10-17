# FlipCard (переворот)

> Исходный код: `src/app/entities/card/ui/cards/flip-card/flip-card.component.ts`

## Назначение

Классическая двусторонняя карточка без объективной проверки: пользователь видит
лицевую сторону, открывает обратную и сам сообщает результат кнопками
**«Знал» / «Не знал»**. Результат записывается в сессию через `flipKnown`
и является основой будущего интервального повторения (SRS).

## Модель данных

Тип `FlipCard` определён в `src/app/entities/card/model/card.types.ts`.

| Поле          | Тип               | Описание                          |
| ------------- | ----------------- | --------------------------------- |
| `kind`        | `'flip'`          | Константа вида                    |
| `front`       | `string`          | Лицевая сторона (известный язык)  |
| `frontLexeme` | `PhoneticLexeme?` | Фонетика лицевой стороны          |
| `back`        | `string`          | Обратная сторона (изучаемый язык) |
| `backLexeme`  | `PhoneticLexeme?` | Фонетика обратной стороны         |
| `audioUrl`    | `string?`         | Аудио озвучки обратной стороны    |

## Проверка ответа

- `canCheckCardAnswer`: `state.flipKnown !== null`.
- `checkCardAnswer`: возвращает `state.flipKnown` (`true` — знал, `false` — не знал).
- `getCorrectAnswerLabel`: обратная сторона (`back`).

## Взаимодействие

- Рендерится в `CardHostComponent` при `card.kind === 'flip'`.
- События: `flipKnownChange: Output<boolean>`, `checkAnswer`, `nextCard`.
- Состояние сессии: `CardSelectStore.flipKnown` / `SingleCardPlayStore.flipKnown`.

## Пример данных

```json
{
  "id": "flip-1",
  "kind": "flip",
  "title": "Карточка-переворот: приветствие",
  "front": "Здравствуйте!",
  "back": "Hello!"
}
```
