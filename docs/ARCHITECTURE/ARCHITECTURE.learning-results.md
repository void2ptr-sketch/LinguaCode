# Архитектура: результаты обучения (`learning-results`)

Сохранение ответов и отображение статистики. Маршрут `/home/progress`.

## Назначение

Фиксация `LearningResult` при каждом ответе; агрегация прогресса по сценарию, уроку, программе.

## Структура

```text
entities/learning/model/learning-results.store.ts
entities/learning/model/learning-result.types.ts
pages/learning-results/learning-progress/
```

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

- [DOMAIN.md](./SYSTEM/DOMAIN.md#модели) · [ARCHITECTURE.home.md](./ARCHITECTURE.home.md)
