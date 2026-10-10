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
5. Обновляет `public/data/card-index-meta.json` (добавляет meta для новых карточек).
6. Обновляет `public/data/content-manifest.json` (добавляет пути к новым файлам).

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
- [ ] `public/data/card-index-meta.json` (изменения)
- [ ] `public/data/content-manifest.json` (изменения)

## Формат CourseBundle

```typescript
type CourseBundle = {
  formatVersion: 1;
  exportedAt: string; // ISO
  sourceAuthorId?: string; // local-user из overlay
  course: {
    courses: Course[]; // ровно 1 программа
    lessons: Lesson[];
  };
  scenarios: Scenario[];
  cards: Card[];
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
};
```

### Правила замыкания зависимостей

- Из `course.lessonIds` → все `lessons`
- Из `lesson.scenarioIds` → все `scenarios`
- Из `scenario.cardSource` → все `cardIds` (только `fixed` и `snapshot`)
- Для каждой карточки — запись в `cardIndexMeta`

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
