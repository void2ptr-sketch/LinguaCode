# Фонетический контент: IPA (International Phonetic Alphabet)

План поддержки **международного фонетического алфавита (IPA)** в карточках LinguaCode: точная запись произношения для любого `ContentLanguage`, в связке с аудио и (опционально) орфографическими слоями G9.

Связанные документы: [INDEX.md](./INDEX.md) · [BUSINESS.md](./BUSINESS.md) · [DOMAIN.md](./DOMAIN.md) · [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md) · [CJK-CONTENT.md](./CJK-CONTENT.md) · [CARD-CATALOG.md](./CARD-CATALOG.md) · [TASKS.md](../TASKS.md).

> **Статус:** MVP реализован · см. [TASKS.md](../TASKS.md) (G10a–G10g).

## Зачем отдельный трек (G10)

G9 закрывает **орфографию CJK**: иероглифы, пиньинь, жуинь, система Палладия. **IPA** решает другую задачу — **как звучит** слово/слог, независимо от языка и письменности.

| Пара      | Польза IPA                                                                           |
| --------- | ------------------------------------------------------------------------------------ |
| **ru→en** | Высокая: `[θ]`, `[ð]`, `[ŋ]`, ударение — hello → `[həˈləʊ]` (BrE) / `[həˈloʊ]` (AmE) |
| **ru→zh** | Средняя: фонетика в учебниках; тоны как контуры Chao: `ma˧˥`                         |
| **en→zh** | Низкая для MVP; пиньинь достаточен; IPA — лингвистические курсы                      |
| **Любая** | `sound`: аудио + выбор/сопоставление транскрипции                                    |

G10 не заменяет G9 и **не смешивается** с UiLocale (G6): IPA — слой **контента карточки**, подписи UI остаются на языке интерфейса.

## Текущее состояние

| Слой                 | Сейчас                                       | Ограничение                                                             |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `SoundCard`          | `audioUrl` + TTS fallback                    | Нет offline CDN аудио по умолчанию                                      |
| Рендер               | Charis SIL для IPA                           | IPA-глифы в отдельном шрифте                                            |
| `keyboard`           | `answerMode`: plain/ipa/pinyin/palladius/han | IPA — **системная клавиатура** в `<input>`, экранной IPA-клавиатуры нет |
| Модель G9 (черновик) | `RomanizationSystem`                         | Только орфография zh, без универсальной фонетики                        |

## IPA vs орфографические системы (G9)

|                  | Пиньинь / жуинь / Палладия        | IPA                                  |
| ---------------- | --------------------------------- | ------------------------------------ |
| Тип              | Орфография / романизация          | Фонетическая транскрипция            |
| Языки            | В основном zh (+ Палладия при ru) | Любой                                |
| Символы          | Буквы языка, Bopomofo, кириллица  | Международный набор IPA              |
| Тоны (zh)        | Диакритика, цифры                 | Контурные тоны Chao: `˥˩`, `˧˥`      |
| Ввод             | Относительно простой              | Сложный (редкий Unicode)             |
| MVP в LinguaCode | Показ + keyboard                  | **Показ + select**; keyboard — позже |

IPA **дополняет** G9, не конкурирует: для 国 возможны одновременно `guó`, `го` и `[kuɔ˧˥]`.

## Целевая модель данных (G10)

Общий тип поверх `CjkLexeme` (G9) или отдельно для en/ru:

```typescript
type ScriptCode = 'latn' | 'hani' | 'bopo' | 'hira' | 'kana' | 'hang' | 'cyrl';

type OrthographySystem = 'pinyin' | 'zhuyin' | 'palladius' | 'orthographic';

type PhoneticNotation = 'ipa';

type IpaVariant = {
  transcription: string; // "[həˈləʊ]"
  label?: string; // "BrE", "AmE", "путунхуа"
  locale?: string; // en-GB, zh-CN
};

type PhoneticLexeme = {
  primary: string;
  script: ScriptCode;

  /** G9 — орфография */
  pinyin?: string;
  zhuyin?: string;
  palladius?: string;

  /** G10 — фонетика */
  ipa?: string | readonly IpaVariant[];

  glossKnown?: string;
  audioUrl?: string;
};

type PhoneticDisplayMode =
  | 'primary-only'
  | 'primary-ipa'
  | 'primary-orthography' // pinyin / palladius / …
  | 'primary-orthography-ipa';

type PhoneticPreferences = {
  showIpa: boolean;
  ipaVariant?: string; // предпочтительный label (BrE / AmE)
  displayOrthography?: OrthographySystem;
  answerModes: readonly ('orthography' | 'ipa')[];
};
```

**Миграция:** `CjkLexeme` из G9 расширяется полем `ipa?: string | readonly IpaVariant[]` без ломки существующих черновиков.

**Где хранить настройки:** `UserPreferences.phonetic` или расширение `CjkLearningPreferences` → общий `PhoneticPreferences` для всех пар.

## Рендер и шрифты

IPA использует Unicode вне Basic Latin (U+0250–02AF, U+1D00–1D7F, combining marks).

| Требование    | Решение                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| Шрифт         | **Charis SIL**, **Doulos SIL** или **Gentium Plus** (self-hosted в `angular.json`) |
| CSS           | `.phonetic-ipa { font-family: 'Charis SIL', serif; }`                              |
| Ударение      | `ˈ` (U+02C8), `ˌ` (U+02CC) — не ASCII-апостроф                                     |
| Тоны Mandarin | Chao: `ma˧˥` (má), `ma˨˩˦` (mǎ)                                                    |
| Компонент     | `app-phonetic-ipa` или `app-lexeme-annotation` (ruby + IPA в `<rt>`)               |

Без IPA-шрифта символы отображаются как «тофу» — загрузка шрифта обязательна для G10b.

## Привязка к `CardKind`

| `kind`        | С IPA                                                      |
| ------------- | ---------------------------------------------------------- |
| `select`      | Выбор транскрипции: _thought_ → `[θɔːt]` vs `[sɔːt]`       |
| `memory`      | ru ↔ en word ↔ `[ IPA ]`                                   |
| `sound`       | Аудио + подпись IPA; варианты BrE/AmE                      |
| `keyboard`    | **Бэклог:** свободный ввод IPA сложен; MVP — только select |
| `symbol`      | Выбор IPA-символа: `[ŋ]` среди похожих                     |
| `select` / zh | Иероглиф + IPA с контурами тона                            |

## Нормализация и проверка ответов

Отдельный pipeline **`normalizeIpa()`** (не общий с CJK/palladius):

1. Unicode NFKC;
2. опционально снять обрамление `[ ]` / `/ /`;
3. строгая проверка ударных знаков IPA (`ˈ`, не `'`);
4. для zh — сравнение контурных тонов Chao;
5. **не** `toLowerCase()` — `/ɪ/` и `/i/` различны.

В MVP: упражнения **select** (выбор варианта), не свободный keyboard.

## Автогенерация IPA

| Источник            | Реализуемость                                                 |
| ------------------- | ------------------------------------------------------------- |
| **en**              | Словари: CMUdict, Wiktionary API; BrE vs AmE                  |
| **zh**              | pinyin → IPA по таблицам; зависит от стандарта; ручная правка |
| **palladius → IPA** | Цепочка через pinyin; накопление погрешностей                 |
| **Ручной ввод**     | Обязателен для авторов в MVP                                  |

Рекомендация: **G10 MVP — поле `ipa` в редакторе**; автозаполнение — G10f (опционально).

## Примеры

### ru→en

| Primary | IPA (BrE)  | IPA (AmE)  |
| ------- | ---------- | ---------- |
| hello   | `[həˈləʊ]` | `[həˈloʊ]` |
| thought | `[θɔːt]`   | `[θɔt]`    |

### ru→zh (вместе с G9)

| Han     | Pinyin | Палладица | IPA (путунхуа) |
| ------- | ------ | --------- | -------------- |
| 国      | guó    | го        | `[kuɔ˧˥]`      |
| 马 (má) | má     | ма        | `[ma˧˥]`       |

## Редактор и каталог

- Поле **IPA** (+ опционально несколько `IpaVariant`) в форме карточки.
- Preview: `PhoneticDisplayMode` (`primary-ipa`, `primary-orthography-ipa`).
- Каталог: тег `ipa` (авто при наличии транскрипций); поиск по IPA через `normalizeIpa()`.
- Валидация: символы из IPA Unicode ranges; запрет смешения IPA и пиньиня в одном поле.

## Связь с G9

| Трек    | Фокус                                                             |
| ------- | ----------------------------------------------------------------- |
| **G9**  | Орфография CJK: han, pinyin, zhuyin, palladius, тоны в орфографии |
| **G10** | Универсальная фонетика: IPA для любого языка                      |

Общий контейнер **`PhoneticLexeme`** объединяет оба слоя; `CjkLexeme` — частный случай или type alias.

## Риски

| Тема             | Решение                                      |
| ---------------- | -------------------------------------------- |
| Нет IPA-шрифта   | Self-hosted Charis SIL / Doulos SIL          |
| BrE vs AmE       | `IpaVariant[]` с `label`                     |
| Санитизация      | Не обрезать combining marks                  |
| UiLocale ≠ IPA   | Подписи UI на русском; контент — IPA-символы |
| Сложный keyboard | Отложить; MVP = показ + select               |

## Этапы G10

| Шаг   | Содержание                                                                               |
| ----- | ---------------------------------------------------------------------------------------- |
| G10.1 | `IpaVariant`, `ipa` в `PhoneticLexeme`; расширение G9-типов                              |
| G10.2 | IPA-шрифты; `app-phonetic-ipa`                                                           |
| G10.3 | Показ IPA в `sound`, `select`, `memory` (ruby / subtitle)                                |
| G10.4 | `PhoneticPreferences.showIpa`; профиль / appearance                                      |
| G10.5 | Demo ru→en с IPA; тег `ipa` в каталоге; поиск по транскрипции                            |
| G10.6 | (опц.) автозаполнение en (CMUdict / Wiktionary) — `lookupEnglishIpa`, кнопка в редакторе |
| G10.7 | (опц.) zh IPA + Chao tones; `pinyinToIpa`; keyboard `answerMode`                         |

## Связанные пути в коде (план)

```
src/app/core/models/phonetic-content.types.ts   # PhoneticLexeme, IpaVariant
src/app/core/data/ipa-normalize.utils.ts        # normalizeIpa, validation
src/app/core/data/ipa-en-lookup.utils.ts        # lookupEnglishIpa (editor autofill)
src/app/core/data/pinyin-to-ipa.utils.ts        # pinyinToIpa, Chao tone contours
src/app/core/data/card-ipa-index.utils.ts        # collectCardIpaReadings для каталога
src/app/core/data/card-search.utils.ts          # matchesSearchQuery по IPA
src/app/shared/components/phonetic-ipa/         # app-phonetic-ipa
src/app/features/card-editor/                   # поле IPA, preview, autofill
public/fonts/                                   # Charis SIL / Doulos SIL
```

## Отличие осей

| Ось                  | Пример             | Трек             |
| -------------------- | ------------------ | ---------------- |
| **UiLocale** (G6)    | Кнопка «Проверить» | UI               |
| **Orthography** (G9) | guó, го, 国        | Контент          |
| **Phonetics** (G10)  | `[kuɔ˧˥]`          | Контент          |
| **Audio**            | `audioUrl`, TTS    | G9/G10 + `sound` |

## Ссылки

- [International Phonetic Alphabet (Википедия)](https://ru.wikipedia.org/wiki/Международный_фонетический_алфавит)
- [CJK-CONTENT.md](./CJK-CONTENT.md) — G9, орфография zh
- [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md) — known / learning
- [TASKS.md](../TASKS.md) — чеклист G10
