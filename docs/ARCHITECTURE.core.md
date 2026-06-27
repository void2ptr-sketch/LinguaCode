# Архитектура: `core`

Ядро приложения: layout, модели, состояние, API, данные, тема, безопасность. Оглавление: [INDEX.md](./INDEX.md) · обзор: [ARCHITECTURE.md](./ARCHITECTURE.md).

## Назначение

Singleton-сервисы и инфраструктура, **не зависящие** от конкретных фич. Фичи импортируют `core/`, но не наоборот.

## Структура

```text
src/app/core/
├── api/           # HttpClient, interceptors, mock handlers
├── data/          # репозитории, search-сервисы, утилиты домена
├── layout/        # shell, navigation, user/help pages
├── models/        # типы домена (см. DOMAIN.md)
├── security/      # санитизация ввода
├── state/         # UserStore, LearningResultsStore, persistence
└── theme/         # AppThemeService, colorScheme
```

## Компоненты layout

| Компонент             | Путь                     | Роль                                                |
| --------------------- | ------------------------ | --------------------------------------------------- |
| `MainLayoutComponent` | `layout/main-layout`     | Grid shell + `router-outlet`                        |
| `HeaderComponent`     | `layout/header`          | Шапка, menu-\*                                      |
| `NavigationComponent` | `layout/navigation`      | Боковое меню                                        |
| `UserPageComponent`   | `layout/pages/user-page` | Профиль: имя, уровень подготовки, пары языков, тема |

## Состояние

| Store                  | Ключ persistence               | Назначение                                                                 |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `UserStore`            | `lingua-code.user`             | Пользователь, `UserPreferences`, `learningProficiencyLevel`, языковые пары |
| `LearningResultsStore` | `lingua-code.learning-results` | Ответы, прогресс по сценариям/урокам/программам                            |

## API (mock + HTTP)

- Interceptors: auth, error, mock для cards/scenarios/courses в dev.
- Search-сервисы: `CardSearchService`, `ScenarioSearchService`, `CourseSearchService` в `core/data/`.

## Диаграмма компонентов (UML)

```mermaid
flowchart TB
  subgraph layout [Layout]
    Header --> MainLayout
    Navigation --> MainLayout
    Footer --> MainLayout
    MainLayout --> RouterOutlet
  end

  subgraph state [State]
    UserStore --> UserPersistence
    LearningResultsStore
  end

  subgraph api [API Layer]
    Interceptors --> HttpClient
    MockHandlers --> HttpClient
  end

  subgraph data [Data]
    CardSearchService
    ScenarioSearchService
    CourseSearchService
    CardRepository
  end

  Features[features/*] --> state
  Features --> data
  Features --> api
  UserPage --> UserStore
  AppThemeService --> UserStore
```

## Особенности

- **Signals** — основной API состояния; RxJS только на границе HTTP.
- **Standalone** — без NgModule.
- **Lazy routes** — фичи не загружаются в `core`.
- **Theme** — `colorScheme` из `UserStore` → классы `theme-light` / `theme-dark` на `<html>`.

## Связанные документы

- [DOMAIN.md](./DOMAIN.md#модели) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [LANGUAGE-PAIR.md](./LANGUAGE-PAIR.md)
