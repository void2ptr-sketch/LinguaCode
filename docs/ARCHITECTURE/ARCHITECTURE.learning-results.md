# Архитектура: результаты обучения (`learning-results`)

Сохранение ответов и отображение статистики. Маршрут `/home/progress`.

## Назначение

Фиксация `LearningResult` при каждом ответе; агрегация прогресса по сценарию, уроку, программе.

## Структура

```text
entities/learning/model/
├── learning-result.types.ts    # типы результатов обучения
├── learning-results.store.ts   # стор результатов (signal-based)
├── learning-results.persistence.ts  # персистентность в localStorage
├── journey.types.ts            # типы джорнея
├── learning-proficiency.types.ts  # типы профайшенса
├── learning-session.types.ts   # типы сессии обучения
└── index.ts                    # barrel-экспорт

entities/learning/lib/
├── learning-proficiency.utils.ts  # утилиты профайшенса
├── learning-resume.utils.ts       # утилиты продолжения обучения
├── learning-session.utils.ts      # утилиты сессии
└── index.ts                       # barrel-экспорт
```

> **Примечание:** Страница прогресса находится в `pages/home/` (вкладка `/home/progress`) или в `pages/journey/journey-page/`, а не в отдельной папке `learning-results`.

## Модель

```typescript
type LearningResult = {
  id: string;
  userId: string;
  cardId: string;
  scenarioId: string;
  correct: boolean;
  answeredAt: string;
  languagePair: LanguagePair;
  direction?: CardDirection;
  lessonId?: string;
  courseId?: string;
};
```

## Диаграмма

```mermaid
flowchart LR
  CardSelectPage -->|checkAnswer| LearningResultsStore
  LearningResultsStore --> LocalStorage
  HomeLearningTab --> LearningResultsStore
  LearningProgress --> LearningResultsStore
  LearningResultsStore --> courseProgress
  LearningResultsStore --> scenarioSetProgress
  LearningResultsStore --> isLessonCompleted
```

## API store (ключевые методы)

| Метод                 | Назначение                            |
| --------------------- | ------------------------------------- |
| `addResult`           | Запись ответа                         |
| `resultsForScenario`  | История по сценарию                   |
| `scenarioSetProgress` | completed/total по списку scenarioIds |
| `courseProgress`      | % по программе                        |
| `isLessonCompleted`   | все сценарии урока пройдены           |

## Связанные документы

- [DOMAIN.md](./COMMON/DOMAIN.md#модели) · [ARCHITECTURE.home.md](./ARCHITECTURE.home.md)
