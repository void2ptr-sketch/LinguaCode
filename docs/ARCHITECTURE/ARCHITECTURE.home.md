# Архитектура: обучение (`home`)

Dashboard «куда идти дальше». Маршрут `/home`, вкладка прогресса `/home/progress`.

## Назначение

Ответ на вопрос **что делать дальше** без дублирования pickers практики (G13).

## Структура

```text
features/home/
├── components/
│   ├── home-learning-tab/         # dashboard по умолчанию
│   ├── learning-continue-card/    # CTA для продолжения обучения
│   ├── learning-lesson-roadmap/   # дорожная карта уроков
│   └── learning-program-progress/ # прогресс по программе
├── services/
│   └── learning-dashboard.service.ts  # сервис дашборда
├── types/
│   ├── home-tab.types.ts          # типы вкладок
│   └── learning-dashboard.types.ts # типы дашборда
├── utils/                         # утилиты (пустой barrel)
├── models/                        # модели (пустой barrel)
└── index.ts                       # barrel-экспорт
```

> **Примечание:** `home-page` — это страница (page), а не компонент фичи. Она расположена в `pages/home/home-page/` и является точкой входа маршрута `/home`. Компоненты фичи (`features/home/components/`) импортируются страницей.

## Компоненты dashboard

| Компонент                   | Данные                                       |
| --------------------------- | -------------------------------------------- |
| `learning-continue-card`    | `learning-resume.utils` → CTA + query params |
| `learning-program-progress` | `LearningResultsStore.courseProgress`        |
| `learning-lesson-roadmap`   | уроки, prerequisites, locked/done            |

## Диаграмма

```mermaid
flowchart TB
  HomePage --> HomeLearningTab
  HomePage --> LearningProgramProgress
  HomeLearningTab --> LearningDashboardService
  LearningDashboardService --> CourseSearchService
  LearningDashboardService --> UserStore
  LearningContinueCard --> CardSelect["/cards/select?…&tab=learning"]
```

## Persistence

`UserLanguagePairSettings.learning` — `activeCourseId`, `lastLessonId`, `lastScenarioId`. Обновляется из практики при ответах.

## Связанные документы

- [DOMAIN.md](./COMMON/DOMAIN.md#learning-home-g13) · [LANGUAGE-PAIR.md](./FEATURES/LANGUAGE-PAIR.md#learning-home-g13) · [ARCHITECTURE.card-select.md](./ARCHITECTURE.card-select.md)
