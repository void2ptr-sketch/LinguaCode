---
name: Angular.LinguaCode Project Guide
description: Angular.LinguaCode Project Guide
---

# Angular.LinguaCode Project Guide

## Project Overview

This is an Angular application designed for language learning with a focus on card-based and course-based learning experiences. The application implements modern Angular architecture patterns including standalone components, signals for state management, and lazy-loaded standalone routes.

### Key Technologies
- Angular 22+ (standalone components, signals, lazy `loadComponent` routes)
- TypeScript 6+ (strict mode)
- RxJS 7+ (внешние потоки; локальное состояние — на Signals)
- Angular Material
- Vitest (тесты, `types: ["vitest/globals"]`)
- Prettier & ESLint

### High-Level Architecture
- **core/** — инфраструктура: layout (shell), hanzi-engine, security, доменные модели и утилиты
- **features/** — изолированные фичи (страницы и их компоненты), лениво загружаются через `loadComponent`
- **shared/** — переиспользуемые UI-компоненты, пайпы, директивы и утилиты

## Getting Started

### Prerequisites
- Node.js 24 LTS (см. `.nvmrc`)
- npm 10+
- Angular CLI 22+
- TypeScript 6+

### Installation
```bash
npm install
```

### Basic Usage
```bash
# Development server
ng serve

# Build for production
ng build --configuration production

# Run tests (Vitest)
ng test
```

## Project Structure

```
src/
├── app/
│   ├── core/                 # Инфраструктура: layout shell, hanzi-engine, security
│   │   ├── layout/           # header, navigation, main-layout, footer, страницы help/user
│   │   ├── hanzi-engine/     # иероглифика: модели, утилиты, quiz-сессии
│   │   └── security/         # санитизация пользовательского ввода
│   ├── features/             # Изолированные фичи (лениво через loadComponent)
│   │   ├── card-select/      # выбор карточек и тренировка
│   │   └── …                 # home, course-catalog, scenario-builder и др.
│   ├── shared/               # Переиспользуемые UI, пайпы, утилиты
│   │   ├── components/       # CardHost, lexeme-display, phonetic-ipa, …
│   │   ├── card-catalog-search/  # фильтры каталога, ScenarioCardPicker
│   │   └── pagination/       # UiPaginationComponent, PageRequest/PageResponse
│   ├── app.component.ts      # Root component
│   └── app.config.ts         # Application configuration
├── assets/                   # Статические ресурсы
└── environments/             # Environment configurations
```

### Key Files and Their Roles

- **`src/main.ts`** — Application entry point
- **`src/app/app.config.ts`** — Application configuration (providers, initializers)
- **`src/app/app.routes.ts`** — Routing configuration (только `loadComponent`)
- **`angular.json`** — Build/test targets (`@angular/build:unit-test`, Vitest runner)

## Development Workflow

### Coding Standards and Conventions

1. **Standalone Components Only**: All new components must be standalone; never use NgModule
2. **TypeScript Strict Mode**: strict typing; prefer `type` over `interface` для данных
3. **Signals for State Management**: локальное состояние — Signals; RxJS — для внешних потоков
4. **Naming Conventions**: полные правила — в `11.angular.naming.rules.md`; кратко: файлы kebab-case с суффиксом типа (`user-profile.component.ts`), классы UpperCamelCase с суффиксом (`UserProfileComponent`), константы UPPER_CASE (`MAX_RETRY_COUNT`)

### Testing Approach

- Unit tests using **Vitest** (`*.spec.ts`, runner `vitest` в `angular.json`, `types: ["vitest/globals"]`)
- Mock external dependencies instead of calling real endpoints
- Test component initialization, input/output bindings, reactive streams, and error handling
- Aim for comprehensive test coverage

### Build and Deployment Process

- Production builds with tree-shaking and optimization enabled
- Automated testing in CI/CD pipeline
- Code quality checks and security scanning
- Environment-specific configurations

## Key Concepts

### Domain-Specific Terminology

- **Card**: Individual learning unit containing language content
- **Course**: Collection of cards organized for learning progression
- **Scenario**: Interactive learning context with multiple cards
- **Learning Session**: User's active learning activity
- **Content Seed**: Initial data loaded into the application

### Core Abstractions

1. **Signals**: For local state management instead of RxJS subjects
2. **Lazy Loading**: Feature pages loaded on-demand via `loadComponent`
3. **Standalone Components**: No NgModules, using imports array for dependencies
4. **Repository Pattern**: Data access abstraction through repositories

### Design Patterns Used

- **Repository Pattern**: For data persistence and access
- **Signal-based State Management**: Local component state management
- **Lazy Loading**: Route-based component loading
- **Component Composition**: Reusable UI components with clear interfaces

## Common Tasks

### Adding a New Feature

1. Create feature folder in `src/app/features/<feature-name>/`
2. Implement standalone components with proper imports
3. Add route configuration in `app.routes.ts` using `loadComponent`
4. Use signals for local state management
5. Test the new functionality (Vitest)

### Working with Data Models

1. Define types in the feature folder or in `src/app/core/` (для глобальных моделей)
2. Create repositories/services for data access
3. Use Angular's dependency injection system (`providedIn: 'root'`)
4. Implement proper error handling and validation

### Modifying UI Components

1. Create or modify standalone components in appropriate folders
2. Use component-scoped styles (SCSS files)
3. Implement proper input/output bindings
4. Follow existing design patterns and styling conventions

## Troubleshooting

### Common Issues

- **Build Errors**: Check TypeScript configuration and dependencies
- **Runtime Errors**: Verify component imports and lifecycle hooks
- **Performance Issues**: Profile change detection and optimize computations
- **Lazy Loading Problems**: Ensure correct route configurations

### Debugging Tips

1. Use Angular DevTools for component inspection
2. Leverage browser developer tools for network requests
3. Implement proper logging in repositories and services
4. Test with minimal reproduction cases

## References

### Documentation
- [Angular Documentation](https://angular.dev/docs)
- [Angular Material Documentation](https://material.angular.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Important Resources
- ESLint configuration for code quality
- Prettier configuration for code formatting
- Vitest test suite documentation

### Related Scripts
- `npm run build:prod` — Production build
- `npm run lint` — Linter check code
- `npm run lint:fix`- Linter fix code
- `npm run test:ci` — CI tests (Vitest)
- `npm run format` — Code formatting check with Prettier
- `npm run format:fix` — Code formatting write with Prettier
- `npm run export:content-seed` — Export content seed data
