---
description: Angular Project Rule
---

# Project Architecture

This is an Angular application (Angular 22, TypeScript 6, standalone components, Signals). Adhere strictly to the defined structure:

*   **`src/app/core/`** — Infrastructure: `layout/` (shell), `hanzi-engine/`, `security/` (sanitization), domain models and utilities.
*   **`src/app/features/`** — Isolated features (e.g., `card-select/`): pages, feature components, feature services/stores.
*   **`src/app/shared/`** — Reusable UI components, pipes, directives, and utilities (e.g., `pagination/`, `card-catalog-search/`, `components/`).


### Key Configuration Files
*   **`src/app/app.config.ts`** — Application configuration (providers, initializers).
*   **`src/app/app.routes.ts`** — Routing configuration (lazy `loadComponent` only).
*   **`src/environments/environment.ts`** — Environment configuration.
*   **`angular.json`** — Build/test targets (`@angular/build:unit-test`, Vitest runner).

---

# Coding Standards

### 1. Core Architecture
*   **Standalone Only:** Use standalone components exclusively. Never use `NgModule`.
*   **TypeScript:** Write all new files strictly in TypeScript (strict mode).
*   **Naming Conventions:** Follow `11.angular.naming.rules.md` without exceptions.
*   **Components Suffix:** Use the `.component.ts` suffix for all component files.

### 2. State & Data Types
*   **State Management:** Prioritize **Angular Signals** for state management. Minimize RxJS usage (see `05.angular.Reactive.rule.md`).
*   **Type Definitions:** Prefer `type` over `interface` for all data structures and models.

### 3. Testing & Quality Guardrails
*   **Test Coverage:** Write comprehensive tests for all new features.
*   **Testing Framework:** Use **Vitest** (`*.spec.ts`, `types: ["vitest/globals"]`, runner `vitest` in `angular.json`).
*   **Code Formatting:** Follow Prettier standards: single quotes, trailing commas, semicolons (see `.prettierrc`).

### 4. Language Requirements
*   **Code Identifiers:** Write all variables, functions, and classes strictly in English.
*   **Documentation:** Write comments, docstrings, and commit messages in either Russian or English.
