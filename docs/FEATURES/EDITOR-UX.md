# Editor UX (G12)

Цель: упростить создание и редактирование карточек. Базовый сценарий — select ru→en за **≤ 8 полей** и **< 2 мин**.

Связанные документы: [INDEX.md](./INDEX.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [TASKS.md](../TASKS.md).

## Режимы

| Режим           | Где                  | Что видно                                               |
| --------------- | -------------------- | ------------------------------------------------------- |
| **Базовый**     | Диалог редактора     | Текст, варианты, preview; wizard при создании           |
| **Расширенный** | + вкладка «Фонетика» | Лексемы, IPA, пиньинь, audio URL                        |
| **Настройки**   | Всегда               | Тема/шрифт (расш.), лимит времени, режимы keyboard/draw |

## Создание карточки

### Меню (4 группы вместо 10 kind'ов)

1. **Выбор** — select, timed, reading, symbol, tone
2. **Ввод** — keyboard, draw
3. **Пары** — memory
4. **Медиа** — sound

### Wizard (базовый режим, только create)

1. **Слово** — название + подсказка
2. **Варианты** — kind-specific поля
3. **Расширить** — полный редактор с вкладками и preview

## Упрощение домена (G12c)

### reading

- В JSON остаётся `kind: 'reading'` (legacy совместимость).
- В каталоге — теги `reading`, `polyphony`.
- Целевое состояние: `select` + meta-тег `reading`.

### tone

- В JSON остаётся `kind: 'tone'`.
- Варианты тонов **автогенерируются** из `syllableBase` (mā · má · mǎ · mà).
- Целевое состояние: `select` с автозаполненными вариантами.

### Lexeme-first

При сохранении:

- `optionsLearning[i]` ← `optionsLexemes[i].primary` (если задана)
- Аналогично для `symbols`, `optionsKnown`, `audioLabelLearning`, пар memory

Legacy JSON с расхождением текст/лексема: при load текст сохраняется; при save побеждает лексема.

## Метрики (G12d)

| Метрика                       | Цель              |
| ----------------------------- | ----------------- |
| Поля в базовом select ru→en   | ≤ 8               |
| Время создания demo-карточки  | < 2 мин           |
| Строк на файл form shell/kind | < 200             |
| Регрессия demo JSON           | без потери данных |

## Smoke checklist

- [ ] Create/edit/preview/try — каждый kind, basic + advanced
- [ ] Wizard create → expand → save
- [ ] Demo cards в `select-cards.json` открываются без потери полей
