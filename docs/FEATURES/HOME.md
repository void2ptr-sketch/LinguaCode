# Главная страница и Learning Dashboard (Home)

> **Статус:** готово. Dashboard обучения с двумя вкладками: «Обучение» (Learning) и «Прогресс» (Progress).

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [ARCHITECTURE.home.md](../ARCHITECTURE/ARCHITECTURE.home.md) · [TASKS.md](../TASKS.md).

## Маршрут и доступ

| Маршрут | Компонент           | Роль             |
| ------- | ------------------- | ---------------- |
| `/home` | `HomePageComponent` | Все пользователи |

Пункт меню: «Главная» в sidebar.

## Архитектура страницы

```
HomePageComponent
└── MatTabGroup
    ├── Learning (HomeLearningTabComponent)
    │   ├── LearningContinueCard — CTA «Продолжить»
    │   ├── LearningLessonRoadmap — Roadmap уроков
    │   └── LearningProgramProgress — Прогресс программы
    └── Progress (LearningProgressComponent from learning-results)
        ├── Overall accuracy %
        ├── Total results count
        ├── Recent results
        └── Per-scenario progress
```

## Компоненты

### HomeLearningTabComponent

Вкладка обучения: dashboard с курсом, road map и кнопкой «Продолжить».

| Сигнал                | Источник                                  | Описание                      |
| --------------------- | ----------------------------------------- | ----------------------------- |
| `loading`             | `LearningDashboardService.loading`        | Загрузка данных               |
| `error`               | `LearningDashboardService.error`          | Ошибка загрузки               |
| `course`              | `LearningDashboardService.course`         | Текущий курс с уроками        |
| `resumeTarget`        | `LearningDashboardService.resumeTarget`   | Цель для «Продолжить»         |
| `roadmap`             | `LearningDashboardService.roadmap`        | Roadmap уроков                |
| `courseProgress`      | `LearningDashboardService.courseProgress` | Прогресс курса                |
| `displayName`         | `UserStore.displayName`                   | Имя пользователя              |
| `languagePairLabel`   | `UserStore.languagePairLabel`             | Подпись пары языков           |
| `continueQueryParams` | `computed`                                | Query params для «Продолжить» |
| `continueLabel`       | `computed`                                | Метка кнопки «Продолжить»     |
| `accuracyPercent`     | `LearningResultsStore.accuracyPercent`    | Точность в %                  |
| `totalResults`        | `LearningResultsStore.totalCount`         | Общее количество результатов  |

**Effect:** `reloadOnContextChange` — перезагрузка dashboard при смене `activeLanguagePairId` или `pairResults`.

### LearningContinueCardComponent

Карточка «Продолжить»: CTA с кнопкой перехода к последней сессии.

| Input                 | Тип                        | Назначение                 |
| --------------------- | -------------------------- | -------------------------- |
| `continueLabel`       | `string`                   | Текст кнопки               |
| `continueQueryParams` | `NavigationExtras \| null` | Query params для навигации |
| `loading`             | `boolean`                  | Загрузка                   |

### LearningLessonRoadmapComponent

Roadmap уроков: визуализация прогресса по урокам курса.

| Input         | Тип                              | Назначение     |
| ------------- | -------------------------------- | -------------- |
| `roadmap`     | `readonly JourneyLocationNode[]` | Roadmap nodes  |
| `courseTitle` | `string`                         | Название курса |

### LearningProgramProgressComponent

Прогресс программы: визуализация прогресса по трекам.

| Input            | Тип                  | Назначение       |
| ---------------- | -------------------- | ---------------- |
| `courseProgress` | `CourseProgressData` | Данные прогресса |
| `courseTitle`    | `string`             | Название курса   |

## LearningDashboardService

`LearningDashboardService` — сервис загрузки данных dashboard.

| Сигнал           | Тип                                  | Описание              |
| ---------------- | ------------------------------------ | --------------------- |
| `loading`        | `Signal<boolean>`                    | Загрузка              |
| `error`          | `Signal<string \| null>`             | Ошибка                |
| `course`         | `Signal<CourseWithPrograms \| null>` | Курс с программами    |
| `resumeTarget`   | `Signal<ResumeTarget \| null>`       | Цель для «Продолжить» |
| `roadmap`        | `Signal<JourneyLocationNode[]>`      | Roadmap               |
| `courseProgress` | `Signal<CourseProgressData>`         | Прогресс курса        |

### ResumeTarget

```typescript
type ResumeTarget = {
  courseId: string;
  programId?: string;
  lessonId?: string;
  scenarioId?: string;
};
```

### continueButtonLabel

Возвращает локализованную метку:

- `"Продолжить: Урок · Сценарий"` — если есть lesson + scenario
- `"Начать: Урок"` — если только lesson
- `"Начать"` — если ничего не выбрано

## LearningProgressComponent (из learning-results)

Компонент вкладки «Прогресс»:

| Показатель     | Источник                                | Описание              |
| -------------- | --------------------------------------- | --------------------- |
| Accuracy %     | `LearningResultsStore.accuracyPercent`  | Точность 0–100        |
| Total results  | `LearningResultsStore.totalCount`       | Общее количество      |
| Recent results | `LearningResultsStore.recentResults`    | Последние результаты  |
| Per-scenario   | `LearningResultsStore.scenarioProgress` | Прогресс по сценариям |

## Зависимости

| Слой                      | Зависимости                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| entities/learning         | `LearningDashboardService`, `LearningResultsStore`, `JourneyLocationNode`, `CourseProgressData` |
| entities/user             | `UserStore`                                                                                     |
| features/learning-results | `LearningProgressComponent`                                                                     |
| shared/utils              | `UiPaginationComponent`                                                                         |

## Связанные пути в коде

```
src/app/features/home/
├── components/
│   ├── home-learning-tab/           # Вкладка обучения
│   │   └── home-learning-tab.component.ts
│   ├── learning-continue-card/      # CTA «Продолжить»
│   ├── learning-lesson-roadmap/     # Roadmap уроков
│   └── learning-program-progress/   # Прогресс программы
├── model/
├── types/
│   ├── home-tab.types.ts
│   └── learning-dashboard.types.ts  # ResumeTarget, buildContinueLinkQueryParams
├── utils/
└── index.ts
```
