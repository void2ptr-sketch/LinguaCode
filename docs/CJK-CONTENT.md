# CJK-контент в карточках (иероглифы, романизация, тоны)

План поддержки **азиатских языков** в карточках LinguaCode: иероглифы (Han), пиньинь, жуинь (注音), **система Палладия** (кириллическая транскрипция для ru→zh), произношение и тоны.

Связанные документы: [INDEX.md](./INDEX.md) · [BUSINESS.md](./BUSINESS.md) · [DOMAIN.md](./DOMAIN.md) · [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md) · [PHONETIC-CONTENT.md](./PHONETIC-CONTENT.md) · [CARD-CATALOG.md](./CARD-CATALOG.md) · [TASKS.md](../TASKS.md).

> **Статус:** MVP реализован · см. [TASKS.md](../TASKS.md) (G9a–G9f).

## Зачем отдельный трек (G9)

G2–G8 дали **двуязычную пару** (`known` / `learning`) и scope UI по **активной паре**. Контент карточек по-прежнему — **плоские строки** (`promptKnown`, `optionsLearning`, …). Для китайского (и позже японского/корейского) этого недостаточно: один и тот же смысл живёт в нескольких **слоях письма** (иероглиф, латиница, кириллица, Bopomofo, аудио, тон).

G9 не заменяет `ContentLanguage` и не смешивается с **UiLocale** (G6): это слой **контента карточки**, а не язык интерфейса.

## Текущее состояние

| Слой | Сейчас | Ограничение для zh / CJK |
|------|--------|---------------------------|
| `ContentLanguage` | `'en' \| 'zh' \| 'ru'` | Один тег `zh`; нет Hans/Hant, TW/CN |
| Payload карточки | `string` на поле | Нельзя хранить 国 + guó + го отдельно |
| Рендер | `{{ text }}`, шрифт Roboto | Нет ruby, CJK-шрифтов, тоновых знаков |
| `keyboard` | `trim().toLowerCase()` | Ломает пиньинь (ǎ, ǐ), жуинь, кириллицу Палладия |
| `sound` | `audioLabelLearning` — строка | Нет `audioUrl`, TTS, проверки произношения |
| `draw` | Заглушка | ~~Нет canvas~~ → canvas, порядок черт, радикалы (G9.8) |
| `symbol` | Символ в кнопке | Подходит для иероглифа, без слоёв чтения |

Пара **ru→zh** в профиле (G7) и фильтрация каталога (G8) уже работают; не хватает **структурированной орфографии** внутри карточки.

## Слои романизации и письма

| Слой | Код / система | Скрипт | Когда использовать |
|------|---------------|--------|---------------------|
| **Иероглифы (Han)** | `hani` | 汉字 (简/繁) | Основной learning для zh |
| **Пиньинь** | `pinyin` | латиница + тоны (nǐ, nǐ3) | Официальная романизация КНР, международные курсы |
| **Жуинь (注音)** | `zhuyin` / `bopo` | Bopomofo ㄋㄧˇ | Тайвань, альтернатива пиньиню |
| **Палладица** | `palladius` | кириллица (ни, чжан) | **ru→zh**: учебники РФ, словари, СМИ |
| **Произношение** | `audio` | URL / TTS / (позже) ASR | `sound`, listening |
| **Тоны** | `tone` | 1–4 + neutral | Упражнения на тон; в палладице обычно не кодируются |

### Система Палладия (палладица)

[Транскрипционная система Палладия](https://ru.wikipedia.org/wiki/Транскрипционная_система_Палладия) — общепринятая **кириллическая** запись путунхуа для русскоязычных. Примеры: 张 zhāng → **Чжан**; 国 guó → **го**; 北京 → **Пекин** (устоявшиеся имена не всегда побуквенны).

| | Пиньинь | Палладица |
|--|---------|-----------|
| Аудитория | Международная, КНР | ru→zh, китаистика |
| Тоны | Диакритика или цифры | **Обычно не передаются** |
| Роль в LinguaCode | Обязательный слой для zh | **Дополнительный** при `known === 'ru'` |

Палладица **дополняет** пиньинь, не заменяет: для живого общения на китайском нужен пиньинь/иероглифы; для русскоязычного ввода и узнавания — палладица.

## Целевая модель данных (G9)

Не ломать все `CardKind` сразу — ввести переиспользуемый тип лексемы и постепенно встраивать в существующие kind.

```typescript
type ScriptCode = 'latn' | 'hani' | 'bopo' | 'hira' | 'kana' | 'hang';

type ToneMark = 1 | 2 | 3 | 4 | 5; // 5 = neutral / лёгкий

type RomanizationSystem = 'pinyin' | 'zhuyin' | 'palladius';

type TextSegment = {
  text: string;
  script?: ScriptCode;
  reading?: string;
  tone?: ToneMark;
  audioUrl?: string;
};

type CjkLexeme = {
  han: string;
  pinyin?: string;
  zhuyin?: string;
  palladius?: string;
  glossKnown?: string;
  tones?: readonly ToneMark[];
  audioUrl?: string;
};

type CjkDisplayMode =
  | 'han-only'
  | 'han-pinyin'
  | 'han-zhuyin'
  | 'han-palladius'
  | 'pinyin-only'
  | 'zhuyin-only'
  | 'palladius-only';

type CjkLearningPreferences = {
  displayRomanizations: readonly RomanizationSystem[];
  answerRomanization: readonly RomanizationSystem[];
  showTones: boolean;
  toneColorScheme: ToneColorSchemeId;
};
```

**Миграция:** legacy `string` → `{ han: s }` или `glossKnown: s` через adapter; полная лексема — в новых карточках и при редактировании.

**Где хранить настройки:** `UserPreferences.cjkLearning` (только если `learning === 'zh'` и/или `known === 'ru'`) или расширение `CardAppearance` для preview.

## Режимы показа (UI)

| Режим | Пример (ru→zh) |
|-------|----------------|
| `han-only` | 你好 |
| `han-palladius` | 你好 + *ни хао* (ruby) |
| `han-pinyin` | 你好 + *nǐ hǎo* |
| `han-zhuyin` | 你好 + ㄋㄧˇ ㄏㄠˇ |
| `palladius-only` | ни хао (без иероглифа) |

Компонент **`app-cjk-ruby`**: HTML `<ruby>` / `<rt>` или вертикальный Bopomofo; шрифты Noto Sans SC/TC, Noto Sans Bopomofo; `lang="zh-Hans"` / `zh-Hant`.

## Привязка к `CardKind`

| `kind` | Сейчас | G9 |
|--------|--------|-----|
| `select` | RU prompt → варианты learning | + варианты в палладице/пиньинь; выбор иероглифа |
| `memory` | `known` / `learning` строки | Тройки ru ↔ palladius ↔ han |
| `symbol` | Символ в кнопке | Иероглиф + чтения |
| `sound` | Текстовая метка | `audioUrl`; подпись по `displayRomanization` |
| `keyboard` | Точное совпадение строки | Нормализатор CJK; `acceptedReadings[]` |
| `timed` | Как `select` | Быстрый выбор тона / чтения |
| `draw` | Canvas + режимы практики | `freehand`, `stroke-order`, `radicals` |
| `tone` | — | Выбор тона для слога (mā/má/mǎ/mà) |
| `reading` | — | Полифония: выбор чтения в контексте |

## Проверка ответов (`keyboard`)

Текущий `normalizeAnswer` (`trim().toLowerCase()`) **не подходит** для CJK. Отдельные pipeline:

| Система | Нормализация |
|---------|--------------|
| **palladius** | trim; ё/е; дефисы; без `toLowerCase` для кириллицы по правилам |
| **pinyin** | NFKC; опционально снятие тонов (ni3 ≈ nǐ); несколько accepted |
| **zhuyin** | сравнение по кодовым точкам Bopomofo |
| **han** | OpenCC 简↔繁 (опционально); exact match |

Карточка может задавать `acceptedAnswers` в нескольких системах: `['го', 'guó', 'guo']`.

## Произношение и тоны

| Уровень | Содержание |
|---------|------------|
| MVP | `audioUrl` в `CjkLexeme` / `SoundCard` |
| Далее | Web Speech API / внешний TTS |
| Бэклог | ASR, оценка произношения |

**Тоны:** хранить `ToneMark` явно; упражнения «услышь → выбери тон», «иероглиф + 4 кнопки»; **цветовая маркировка** иероглифов и пиньинь (настройка в профиле → «Настройка курса»). Для палладицы тоны — через **отдельные** упражнения с пиньинь/аудио, не через кириллицу.

### Цветовая маркировка тонов

| Поле | Тип | Описание |
|------|-----|----------|
| `showTones` | `boolean` | Включить окраску иероглифов и пиньинь по тону слога |
| `toneColorScheme` | `ToneColorSchemeId` | Палитра: `classic`, `pastel`, `vivid`, `warm` |

**Схема `classic` (по умолчанию):** палитра [Nathan Dummit, *Chinese Through Tone & Color* (2008)](https://en.wikipedia.org/wiki/Tone_number#Color): 1-й — красный · 2-й — оранжевый · 3-й — зелёный · 4-й — синий · нейтральный — чёрный. Та же схема используется в MDBG и ряде словарей.

Рендер: `app-tone-colored-text` внутри `app-lexeme-display`, вкладки draw-карточки, варианты `tone`-карточки. Тон слога берётся из разметки пиньинь (`parsePinyinSyllable`) или явного массива `tones[]` на лексеме.

## Редактор и каталог

- Вкладка **«Китайский контент»**: han, pinyin, zhuyin, palladius, audio.
- Автозаполнение palladius из pinyin (syllable table) с **ручной правкой** (Пекин, Конфуций).
- Preview с `CjkDisplayMode`.
- Индекс каталога: поиск по `han`, `pinyin`, `palladius`, `glossKnown`.
- Теги: `hsk1`, `tones`, `radicals` (позже).

## `ContentLanguage` и пары

| Вариант | Описание |
|---------|----------|
| **MVP (G9)** | Оставить `zh`; варианты Hans/Hant и romanization — в `UserPreferences` |
| **Позже** | `zh-Hans`, `zh-Hant`; отдельные курсы TW (жуинь) vs CN (пиньинь) |

**Палладица** релевантна только при **`known === 'ru'`**; для en→zh скрывать в UI по умолчанию.

## Риски и edge cases

| Тема | Решение |
|------|---------|
| **Полифония** (行 xíng/háng) | Контекст (слово целиком); kind `reading` |
| **Смешанный текст** | `TextSegment[]`, не одна строка |
| **Устоявшиеся имена** | Явное поле `palladius`, не только конвертер |
| **Санитизация** | Не обрезать combining marks для латиницы с тонами |
| **G8 scope** | CJK-карточки фильтруются по `knownLanguage`/`learningLanguage` как сейчас |

## Этапы G9

| Шаг | Содержание |
|-----|------------|
| G9.0 | Типы `CjkLexeme`, `RomanizationSystem`; adapter `string` → lexeme |
| G9.1 | Шрифты CJK; `app-cjk-ruby`; `CjkDisplayMode` |
| G9.2 | `CjkLearningPreferences` при ru→zh; профиль `/user` |
| G9.3 | Расширение payload `SelectCard` / `MemoryCard` (optional `lexeme`) |
| G9.4 | Конвертер pinyin ↔ palladius; поле palladius в редакторе |
| G9.5 | CJK normalizer для `keyboard`; `acceptedReadings` |
| G9.6 | `sound`: `audioUrl`; упражнения на тон |
| G9.7 | Demo-карточки ru→zh; теги `hsk1`, `tones` |
| G9.8 | (опц.) `draw`: canvas; stroke order; радикалы — `app-draw-canvas`, справочник черт |

## Связанные пути в коде (план)

```
src/app/core/models/cjk-content.types.ts      # CjkLexeme, RomanizationSystem
src/app/core/data/cjk-romanization.utils.ts   # pinyin ↔ palladius, normalizers
src/app/shared/components/cjk-ruby/           # app-cjk-ruby
src/app/features/card-editor/                 # поля лексемы, preview
src/app/shared/utils/card-answer.utils.ts     # CJK-aware check (G9.5)
```

## Отличие осей «языка»

| Ось | Пример | G9 |
|-----|--------|-----|
| **UiLocale** (G6) | Кнопки UI на русском | Не трогаем |
| **LanguagePair** (G7) | ru → zh | Определяет need palladius |
| **RomanizationSystem** | palladius vs pinyin | Слой **контента** карточки |
| **Phonetics** (G10) | `[kuɔ˧˥]` | Контент |
| **CjkDisplayMode** | han + ruby | Отображение в сессии |

## Ссылки

- [Транскрипционная система Палладия (Википедия)](https://ru.wikipedia.org/wiki/Транскрипционная_система_Палладия)
- [PHONETIC-CONTENT.md](./PHONETIC-CONTENT.md) — IPA (G10), дополняет орфографию G9
- [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md) — known / learning, G2 structured content
- [TASKS.md](../TASKS.md) — чеклист G9
