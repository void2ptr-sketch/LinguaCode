# CourseBundle — перенос пользовательского курса в общий каталог

## Для автора (создателя курса)

1. Создайте программу в **Конструкторе курсов** (`/tools/courses`).
2. Убедитесь, что все сценарии используют режим **fixed** или **snapshot** (не criteria).
3. Нажмите кнопку **Экспорт файла** (иконка `file_download`) рядом с курсом в списке.
4. Сохраните `.linguacode-course.json` на диск.
5. Передайте файл maintainer'у проекта (через email, PR или issue).

### Требования к id

При создании курса, уроков, сценариев и карточек используйте уникальные префиксы,
чтобы избежать коллизий при импорте в seed:

- Курс: `course-my-topic`
- Урок: `lesson-my-topic-1`
- Сценарий: `scenario-my-topic-1`
- Карточка: `card-my-topic-1`

## Для maintainer'а

### Импорт курса в seed

```bash
npm run import:course-bundle -- --bundle ./path/to/course.linguacode-course.json --slug my-course
```

Опции:

| Опция       | Описание                                               |
| ----------- | ------------------------------------------------------ |
| `--bundle`  | Путь к CourseBundle JSON (обязательно)                 |
| `--slug`    | Уникальный идентификатор для имен файлов (обязательно) |
| `--replace` | Перезаписать существующие файлы seed при коллизиях id  |

### Что делает скрипт

1. Валидирует формат пакета (formatVersion, замкнутость графа).
2. Проверяет коллизии id с существующим seed.
3. Нормализует данные для seed:
   - `authorId` → `'system'`
   - `published` → `true`
   - `updatedAt` → текущая дата
4. Записывает файлы:
   - `public/data/courses/{slug}-course.json`
   - `public/data/scenarios/{slug}-scenarios.json`
   - `public/data/{slug}-cards.json`
5. Обновляет `public/data/content-manifest.json` (добавляет пути к новым файлам).

### Проверка после импорта

```bash
# Собрать проект
npm run build:prod

# Запустить тесты
npm run test:ci
```

Убедитесь, что курс появился в `/courses` в приложении.

### Commit checklist

- [ ] `public/data/courses/{slug}-course.json`
- [ ] `public/data/scenarios/{slug}-scenarios.json`
- [ ] `public/data/{slug}-cards.json`
- [ ] `public/data/content-manifest.json` (изменения)

## Формат CourseBundle

> **Статус:** формат v2 — основной. Все новые экспорты генерируют v2.
> Формат v1 поддерживается только для импорта (обратная совместимость).
> При создании/редактировании курсов всегда используйте v2.

### Формат v2 (основной) — вложенная древовидная структура

```typescript
type CourseBundle = {
  formatVersion: 2;
  exportedAt: string; // ISO
  sourceAuthorId?: string; // local-user из overlay
  course: Course;                    // единственный курс
  programs: ProgramBundle[];         // программы с порядком
};

type ProgramBundle = {
  program: Program;
  order: number;
  lessons: LessonBundle[];
};

type LessonBundle = {
  lesson: Lesson;
  order: number;
  scenarios: ScenarioBundle[];
};

type ScenarioBundle = {
  scenario: Scenario;
  order: number;
  cards: CardBundle[];
};

type CardBundle = {
  card: Card;
  order: number;
  meta: CardIndexMetaOverride;       // объединённые метаданные
};
```

**Ключевые изменения v2:**
- Вложенная структура вместо плоских массивов
- Каждый уровень сохраняет ВСЕ поля родительского типа
- Поле `order` для явного порядка на каждом уровне
- `meta` объединён с `card.meta` в `CardBundle[].meta` (без отдельного `cardIndexMeta`)
- Поле `authoring.idea` сохраняется в `course.authoring.idea`

### Формат v1 (устаревший, только импорт)

```typescript
type CourseBundleV1 = {
  formatVersion: 1;
  exportedAt: string; // ISO
  sourceAuthorId?: string; // local-user из overlay
  course: {
    courses: Course[]; // ровно 1 курс
    programs: Program[];
    lessons: Lesson[];
  };
  scenarios: Scenario[];
  cards: Card[];
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
};
```

> **Формат v1 устарел.** Поддерживается только для импорта старых пакетов.
> Экспорт всегда генерирует v2. При работе с новыми курсами используйте только v2.

### Правила замыкания зависимостей

**v2:**
- `course.programIds` → все `programs`
- `program.lessonIds` → все `lessons`
- `lesson.scenarioIds` → все `scenarios`
- `scenario.cardSource.cardIds` → все `cards`
- Для каждой карточки — запись в `CardBundle[].meta`

**v1:**
- Из `course.lessonIds` → все `lessons`
- Из `lesson.scenarioIds` → все `scenarios`
- Из `scenario.cardSource` → все `cardIds` (только `fixed` и `snapshot`)
- Для каждой карточки — запись в `cardIndexMeta`

## Импорт через GUI

### Для автора (загрузка в приложение)

1. Откройте курс в **Конструкторе курсов** (`/tools/courses`).
2. Нажмите "Редактировать" на нужном курсе.
3. Перейдите на вкладку **Экспорт**.
4. Нажмите **"Импорт JSON (CourseBundle)"** и выберите `.json` файл.
5. В диалоге подтверждения проверьте данные и нажмите "Импортировать".
6. Курс появится в списке и в локальном каталоге.

### Что импортируется

- Курс + программа(ы) + урок(и) + сценарии + карточки + meta
- Данные записываются в overlay (`lingua-code.user-content.v1`)
- Существующие сущности с совпадающими ID будут обновлены
- Сценарии в `criteria` режиме не импортируются (как и при экспорте)

### Ограничения

- Размер файла ограничен ~5 МБ (лимит localStorage)
- При большом количестве карточек пакет может превысить лимит — появится предупреждение
- Импорт поддерживает форматы v1 и v2; экспорт всегда генерирует v2

## Ограничения MVP

| Тема                  | MVP-поведение                               |
| --------------------- | ------------------------------------------- |
| Сценарии criteria     | Экспорт запрещён; нужен fixed/snapshot      |
| Прогресс обучения     | Не входит в пакет                           |
| Обновление курса      | Новый bundle → повторный import (--replace) |
| Права автора          | Attribution в sourceAuthorId                |
| In-app import         | Не в MVP — только seed через репозиторий    |
| Backend / URL publish | Не в MVP — следующий этап                   |

## Troubleshooting

### Коллизии id

```
Найдены коллизии id с существующим seed.
```

Используйте `--replace` для перезаписи, либо измените id в CourseBundle.

### Criteria-сценарии

```
Сценарий «...» использует criteria-режим.
```

Переведите сценарий в режим `fixed` или `snapshot` в конструкторе сценариев перед экспортом.

### export:content-seed затирает imported-курсы

Начиная с G15, `export-content-seed.mjs` сохраняет imported-записи в manifest.
Если вы вручную правили manifest, убедитесь, что ваши изменения не потерялись.

## Миграция с v1 на v2

### Что изменилось

| Аспект | v1 (устаревший) | v2 (основной) |
| ------ | --------------- | ------------- |
| Структура | Плоские массивы (`courses`, `programs`, `lessons`, `scenarios`, `cards`) | Вложенная иерархия (`course` → `programs` → `lessons` → `scenarios` → `cards`) |
| Порядок | Нет явного порядка | `order: number` на каждом уровне |
| Метаданные карточек | Отдельный `cardIndexMeta` на верхнем уровне | `meta` в каждом `CardBundle` |
| Идея курса | Поле `authoring.idea` терялось | Сохраняется в `course.authoring.idea` |

### Как мигрировать

1. **Новые курсы** — экспорт автоматически генерирует v2. Никаких действий не требуется.
2. **Старые пакеты v1** — импорт поддерживает обратную совместимость. Скрипт `import:course-bundle` автоматически конвертирует v1 во внутреннее представление v2.
3. **Seed-файлы** — при импорте в seed данные нормализуются независимо от формата пакета. Seed-формат не меняется.

### Что делать, если encountered v1 пакет

Если вы получили пакет v1 от автора:
- Импортируйте его через `npm run import:course-bundle` — скрипт обработает v1 автоматически.
- Попросите автора экспортировать курс заново — экспорт всегда генерирует v2.
