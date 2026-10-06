---
name: Ленивая загрузка вкладок
description: Рефакторинг вкладок на ленивую загрузку через loadComponent
invokable: true
---

# Цель

Рефакторинг eagerly-импортированных вкладок на `loadComponent` для снижения размера начального бандла.

## Контекст проекта

- **Фреймворк:** Angular 22, **standalone**, **signal-based**
- **Руководство:** `.continue/rules/02.angular.lazy-loading.rule.md` (rule 02)
- **Паттерн маршрутизации:** `loadComponent` в `app.routes.ts` — never `loadChildren`/NgModule
- **Кандидаты на рефакторинг:**
  - `course-catalog-page` — eagerly импортирует `CourseCatalogCoursesComponent`, `CourseCatalogSettingsComponent`, `CourseCatalogProgramsComponent` в `imports: [...]`
  - `home-learning-tab` — eagerly импортирует `LearningContinueCardComponent`, `LearningProgramProgressComponent`, `LearningLessonRoadmapComponent`

## Задача

Перенести вкладки из прямого `imports: [...]` Tab-компонентов в ленивую загрузку через `loadComponent` в роутер.

## Алгоритм действий

1. **Найди** eagerly-импортированные вкладки — просканируй `imports: [...]` в Tab-компонентах (`course-catalog-page.component.ts`, `home-learning-tab.component.ts`)
2. **Перенеси** в `loadComponent` — добавь маршруты в `app.routes.ts` (или вложенные routes) с `loadComponent: () => import('...').then(m => m.XxxComponent)`
3. **Обнови** родительский компонент — убери компоненты из `imports: [...]`, добавь `<router-outlet>` в шаблон
4. **Проверь зависимости** — shared-модули должны оставаться eager; Material через `provideAnimations()`; нет circular deps
5. **Валидация** — прогони чек-лист (см. ниже) и `ng build`

## Best Practices

- Используй `loadComponent` (не `loadChildren`/NgModule) для standalone-компонентов
- Shared UI и утилиты — eager imports (в `app.config.ts` или shared-модулях)
- Material animations — только через `provideAnimations()` в `app.config.ts`, не прямой import в lazy-компоненты
- Lazy-вкладки через `<router-outlet>` внутри Tab-компонента
- Предпочитай route-level lazy loading над eager imports feature-кода

## Anti-patterns

- ❌ NgModule / `loadChildren` — проект не использует модули
- ❌ Прямой `import` компонента в `imports: [...]` родительского компонента — это eager loading
- ❌ Circular dependencies между lazy-компонентами и их route-definitions
- ❌ Забытые `redirectTo` в роутах — после рефакторинга проверь дефолтные редиректы
- ❌ `provideAnimations()` внутри lazy-компонента — только в `app.config.ts`

## Чек-лист валидации

- [ ] Все целевые вкладки используют `loadComponent` в роутах
- [ ] Родительские компоненты больше не содержат вкладки в `imports: [...]`
- [ ] В шаблонах родительских компонентов есть `<router-outlet>`
- [ ] `provideAnimations()` подключён в `app.config.ts`
- [ ] Shared-зависимости остаются eager
- [ ] `ng build` проходит без ошибок
- [ ] Нет circular dependencies (проверить `ng build --configuration production`)

## Стандарты кодирования

- `./continue/agents/angular-architecture.agent.md` — Angular Architecture
- `./continue/rules/*` — правила кодирования
