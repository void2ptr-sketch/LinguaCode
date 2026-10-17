# Курс C++ Complete Course

## Обзор

**C++ Complete Course** — это полный курс изучения языка программирования C++, охватывающий все основные темы от основ до продвинутых концепций.

### Метаданные курса

| Поле | Значение |
|------|----------|
| `id` | `course-cpp-complete` |
| `title` | `C++ Complete Course` |
| `description` | Полный курс C++ от основ до продвинутых тем: переменные, типы данных, условия, циклы, функции, массивы, строки, ООП, наследование, полиморфизм, STL контейнеры и алгоритмы |
| `languagePair` | `{ "known": "ru", "learning": "cpp" }` |
| `published` | `true` |

### Структура курса

Курс состоит из **10 программ обучения** (уроков), каждая из которых содержит **5 сценариев**, а каждый сценарий — **20 карточек**.

| Уровень | Количество | Описание |
|---------|-----------|----------|
| **Программы обучения** | 10 | Тематические блоки курса |
| **Сценарии** | 50 (5 на урок) | Интерактивные сессии обучения |
| **Карточки** | 1000 (20 на сценарий) | Единицы контента: вопрос + варианты + объяснение |

## Программы обучения

### 1. Основы C++

#### lesson-cpp-basics-intro — Введение и история
- **scenario-cpp-basics-intro-01** — История и структура программы
- **scenario-cpp-basics-intro-02** — Компиляция и этапы преобразования
- **scenario-cpp-basics-intro-03** — Hello World и базовый вывод
- **scenario-cpp-basics-intro-04** — Комментарии и документация
- **scenario-cpp-basics-intro-05** — Структура программы: main, include

#### lesson-cpp-basics-types — Типы данных
- **scenario-cpp-basics-types-01** — Целочисленные типы
- **scenario-cpp-basics-types-02** — Вещественные типы
- **scenario-cpp-basics-types-03** — Символы и строки
- **scenario-cpp-basics-types-04** — Логический тип
- **scenario-cpp-basics-types-05** — Приведение типов

#### lesson-cpp-basics-control-flow — Управление потоком
- **scenario-cpp-basics-control-flow-01** — Условия: if-else
- **scenario-cpp-basics-control-flow-02** — Условия: switch-case
- **scenario-cpp-basics-control-flow-03** — Циклы: for
- **scenario-cpp-basics-control-flow-04** — Циклы: while и do-while
- **scenario-cpp-basics-control-flow-05** — Управление циклами: break и continue

#### lesson-cpp-basics-functions — Функции
- **scenario-cpp-basics-functions-01** — Объявление и вызов функций
- **scenario-cpp-basics-functions-02** — Параметры и возвращаемые значения
- **scenario-cpp-basics-functions-03** — Перегрузка функций
- **scenario-cpp-basics-functions-04** — Рекурсия
- **scenario-cpp-basics-functions-05** — Inline и макросы

#### lesson-cpp-basics-arrays-strings — Массивы и строки
- **scenario-cpp-basics-arrays-strings-01** — Одномерные массивы
- **scenario-cpp-basics-arrays-strings-02** — Многомерные массивы
- **scenario-cpp-basics-arrays-strings-03** — Строки: std::string
- **scenario-cpp-basics-arrays-strings-04** — C-style строки
- **scenario-cpp-basics-arrays-strings-05** — Операции со строками

### 2. Объектно-ориентированное программирование

#### lesson-cpp-oop-fundamentals — Основы ООП
- **scenario-cpp-oop-fundamentals-01** — Классы и объекты
- **scenario-cpp-oop-fundamentals-02** — Инкапсуляция
- **scenario-cpp-oop-fundamentals-03** — Конструкторы
- **scenario-cpp-oop-fundamentals-04** — Деструкторы
- **scenario-cpp-oop-fundamentals-05** — this-указатель и перегрузка операторов

#### lesson-cpp-oop-inheritance — Наследование
- **scenario-cpp-oop-inheritance-01** — Основы наследования
- **scenario-cpp-oop-inheritance-02** — Модификаторы доступа в наследовании
- **scenario-cpp-oop-inheritance-03** — Множественное наследование
- **scenario-cpp-oop-inheritance-04** — Конструкторы в наследовании
- **scenario-cpp-oop-inheritance-05** — Проблема ромба и виртуальное наследование

#### lesson-cpp-oop-polymorphism — Полиморфизм
- **scenario-cpp-oop-polymorphism-01** — Виртуальные методы
- **scenario-cpp-oop-polymorphism-02** — Динамическая диспетчеризация
- **scenario-cpp-oop-polymorphism-03** — Абстрактные классы
- **scenario-cpp-oop-polymorphism-04** — Динамическое приведение типов
- **scenario-cpp-oop-polymorphism-05** — Полиморфные иерархии

### 3. Стандартная библиотека шаблонов (STL)

#### lesson-cpp-stl-containers-deep — Контейнеры STL
- **scenario-cpp-stl-containers-deep-01** — vector: динамические массивы
- **scenario-cpp-stl-containers-deep-02** — list и forward_list
- **scenario-cpp-stl-containers-deep-03** — map и unordered_map
- **scenario-cpp-stl-containers-deep-04** — set и unordered_set
- **scenario-cpp-stl-containers-deep-05** — Итераторы и аллокаторы

#### lesson-cpp-stl-algorithms-deep — Алгоритмы STL
- **scenario-cpp-stl-algorithms-deep-01** — sort и сортировки
- **scenario-cpp-stl-algorithms-deep-02** — find и поиск
- **scenario-cpp-stl-algorithms-deep-03** — transform и преобразования
- **scenario-cpp-stl-algorithms-deep-04** — for_each и алгоритмы обхода
- **scenario-cpp-stl-algorithms-deep-05** — accumulate и агрегация

## Файловая структура

### Метаданные курса
```
public/data/courses/cpp-complete-course.json
```

### Сценарии
```
public/data/scenarios/cpp-<slug>.json
```
Где `<slug>` — уникальное имя сценария (например, `basics-intro-history`).

Формат файла:
```json
{
  "scenarios": [
    {
      "scenarioId": "scenario-cpp-basics-intro-01",
      "title": "История и структура программы",
      "description": "Сценарий: История и структура программы",
      "order": 0,
      "lessonId": "lesson-cpp-basics-intro",
      "courseId": "course-cpp-complete",
      "cardCount": 20,
      "authoring": {
        "status": "materialized",
        "updatedAt": "2026-06-14T12:00:00.000Z"
      },
      "languagePair": {
        "known": "ru",
        "learning": "cpp"
      },
      "published": true,
      "cards": []
    }
  ]
}
```

### Карточки
```
public/data/cards/cpp-<slug>-cards.json
```
Где `<slug>` — уникальное имя сценария.

Формат файла:
```json
{
  "scenarioId": "scenario-cpp-basics-intro-01",
  "cards": [
    {
      "id": "scenario-cpp-basics-intro-01-card-01",
      "kind": "multiple-choice",
      "title": "История и структура программы - Вопрос 1",
      "appearance": {
        "theme": "azure-blue",
        "fontSize": "md"
      },
      "caption": "Какой язык стал основой для C++?",
      "options": [
        { "id": "a", "text": "C" },
        { "id": "b", "text": "Java" },
        { "id": "c", "text": "Python" },
        { "id": "d", "text": "Smalltalk" }
      ],
      "correctOptionId": "a",
      "explanation": "C++ был создан Бьярне Страуструпом на основе языка C.",
      "authoring": {
        "status": "materialized",
        "ideaUpdatedAt": "2026-06-14T12:00:00.000Z",
        "materializedAt": "2026-06-14T12:00:00.000Z"
      },
      "languagePair": {
        "known": "ru",
        "learning": "cpp"
      },
      "published": true
    }
  ]
}
```

## Манифест контента

Все файлы курса зарегистрированы в `public/data/content-manifest.json`:

```json
{
  "version": 10,
  "courseFiles": [
    "/courses/cpp-complete-course.json"
  ],
  "scenarioFiles": [
    "/scenarios/cpp-basics-arrays-1d.json",
    "/scenarios/cpp-basics-arrays-2d.json",
    ...
  ],
  "cardFiles": [
    "/cards/cpp-basics-arrays-1d-cards.json",
    "/cards/cpp-basics-arrays-2d-cards.json",
    ...
  ]
}
```

## Статистика

| Метрика | Значение |
|---------|----------|
| Всего программ обучения | 10 |
| Всего уроков | 10 |
| Всего сценариев | 50 |
| Всего карточек | 1000 |
| Карточек на урок | 100 |
| Карточек на сценарий | 20 |

## История версий

| Версия | Дата | Описание |
|--------|------|----------|
| 10 | 2026-06-14 | Создание курса C++ Complete Course (50 сценариев, 1000 карточек) |

## Связанные документы

- [DOMAIN.md](./COMMON/DOMAIN.md) — Доменная модель: иерархия Card → Scenario → Lesson → Course
- [CARD-CATALOG.md](./COMMON/CARD-CATALOG.md) — Индекс карточек, поиск, пагинация
- [API-CONTRACT.md](../API-CONTRACT.md) — HTTP API для работы с курсами и карточками
