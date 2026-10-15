# Barrel Exports Audit Report

## Summary

This document provides a comprehensive audit of barrel exports (`index.ts`) across the Angular.LinguaCode project, verifying compliance with the rules defined in `11.angular.naming.rules.md`.

## Audit Results

### ✅ Compliant Directories

All directories with multiple exports have proper `index.ts` files:

#### entities/
- `entities/auth/index.ts` — exports model, repository, api, services (via nested index.ts)
- `entities/auth/api/index.ts` — exports auth-api.service
- `entities/auth/model/index.ts` — exports types and state
- `entities/auth/repository/index.ts` — exports auth.port
- `entities/auth/services/index.ts` — exports token storage and store
- `entities/card/lib/index.ts` — exports card-answer, card-catalog-hierarchy, card-catalog-search, cards, catalog-tag-groups, code-highlight, keyboard-answer-mode
- `entities/chinese/lib/index.ts` — exports answers, drawing, phonetics, pinyin, tone-marks, tones
- `entities/chinese/lib/pinyin/index.ts` — exports keyboard, romanization, phonetics
- `entities/chinese/lib/pinyin/keyboard/index.ts` — exports utils and types (cohesive module)
- `entities/chinese/model/index.ts` — exports hanzi-character model and types
- `entities/chinese/ui/index.ts` — exports cjk-ruby, lexeme-display, phonetic-ipa, pinyin-keyboard, tone-colored-text
- `entities/chinese/ui/cjk-ruby/index.ts` — exports component
- `entities/chinese/ui/lexeme-display/index.ts` — exports component
- `entities/chinese/ui/phonetic-ipa/index.ts` — exports component
- `entities/chinese/ui/pinyin-keyboard/index.ts` — exports component (cohesive module)
- `entities/chinese/ui/tone-colored-text/index.ts` — exports component
- `entities/content-seed/index.ts` — exports repository, persistence, types, utils
- `entities/course/index.ts` — exports services, repository, mapping, storage, utils
- `entities/course/api/index.ts` — exports courses-api.service
- `entities/course/mapping/index.ts` — exports course-index.mapper
- `entities/course/model/index.ts` — exports all course types
- `entities/course/repository/index.ts` — exports course-catalog.port
- `entities/course/search/index.ts` — exports search service and utils
- `entities/course/storage/index.ts` — exports storage functions
- `entities/course/ui/course-display-settings-matrix/index.ts` — exports component and types (cohesive module)
- `entities/course/ui/course-picker/index.ts` — exports component
- `entities/course/utils/index.ts` — exports all course utils and types
- `entities/journey/lib/index.ts` — exports journey-nodes.utils
- `entities/language-pair/lib/index.ts` — exports language pair utils
- `entities/learning/lib/index.ts` — exports learning proficiency, resume, session utils
- `entities/learning/model/index.ts` — exports learning types and stores
- `entities/lesson/lib/index.ts` — exports lesson prerequisites utils
- `entities/lesson/ui/lesson-picker/index.ts` — exports component
- `entities/phonetic/lib/index.ts` — exports phonetic lexeme and preferences utils
- `entities/phonetic/model/index.ts` — exports phonetic content and tone color types
- `entities/scenario/index.ts` — exports services, repository, mapping, storage, utils
- `entities/scenario/api/index.ts` — exports scenarios-api.service
- `entities/scenario/mapping/index.ts` — exports scenario-index.mapper
- `entities/scenario/model/index.ts` — exports scenario types
- `entities/scenario/repository/index.ts` — exports scenario-catalog.port
- `entities/scenario/search/index.ts` — exports search service and utils
- `entities/scenario/storage/index.ts` — exports scenarios-storage
- `entities/scenario/ui/scenario-picker/index.ts` — exports component
- `entities/scenario/utils/index.ts` — exports all scenario utils
- `entities/user/index.ts` — exports overlay
- `entities/user/lib/index.ts` — exports constants and utils
- `entities/user/model/index.ts` — exports user types, persistence, store
- `entities/user/overlay/index.ts` — exports overlay types, resolver, repair, storage

#### features/
- `features/index.ts` — namespace exports for all features (CardEditor, CardSelect, CourseBuilder, etc.)
- `features/card-editor/index.ts` — exports components, services, utils/types
- `features/card-editor/components/index.ts` — exports all card-editor components
- `features/card-select/index.ts` — exports components and types
- `features/card-select/components/index.ts` — exports all card-select components
- `features/course-builder/index.ts` — exports components, services, types
- `features/course-builder/components/index.ts` — exports all course-builder components
- `features/course-catalog/index.ts` — exports components, services, types
- `features/course-catalog/components/index.ts` — exports all course-catalog components
- `features/home/index.ts` — exports components (via nested index), services, types
- `features/home/components/index.ts` — exports all home components
- `features/journey/index.ts` — exports journey components
- `features/journey/components/index.ts` — exports all journey components
- `features/learning-results/index.ts` — exports components and types
- `features/learning-results/components/index.ts` — exports learning-progress component
- `features/scenario-builder/index.ts` — exports components, services, types

#### shared/
- `shared/utils/markdown-field/index.ts` — exports markdown util and component (cohesive module)
- `shared/utils/pagination/index.ts` — exports pagination types, utils, state, component (cohesive module)

### ⚠️ Directories Without index.ts (Single Export - OK)

These directories have only one export and are not used in namespace imports, so they don't need `index.ts`:

#### pages/
- `pages/card-editor/` — contains only card-editor-page component (single export)
- `pages/card-select/` — contains only card-select-page component (single export)
- `pages/course-builder/` — contains only course-builder-page component (single export)
- `pages/course-catalog/` — contains only course-catalog-page component (single export)
- `pages/help/` — contains help-page component and data file (single export + data)
- `pages/home/` — contains only home-page component (single export)
- `pages/journey/` — contains only journey-page component (single export)
- `pages/scenario-builder/` — contains only scenario-builder-page component (single export)
- `pages/user/` — contains user-page component (single export)
- `pages/help-usage-scenarios/` — contains help-usage-scenarios-page component and data file

#### widgets/
- `widgets/main-layout/` — contains only main-layout component (single export)
- `widgets/main-header/` — contains only main-header component (single export)
- `widgets/main-footer/` — contains only main-footer component (single export)
- `widgets/menu-cards/` — contains only menu-cards component (single export)
- `widgets/menu-help/` — contains only menu-help component (single export)
- `widgets/menu-tools/` — contains only menu-tools component (single export)
- `widgets/menu-user/` — contains only menu-user component (single export)
- `widgets/sidebar-navigation-left/` — contains only sidebar-navigation-left component (single export)

#### entities/language-pair/model/
- Contains only language-pair.types.ts (single export, no index.ts needed)

### ✅ No Spec Files Exported

Verified that no `*.spec.ts` files are exported from any `index.ts`.

### ✅ Alphabetical Order

All exports within sections follow alphabetical order as per the template.

## Recommendations

1. **No action required** — All barrel exports are compliant with the rules.
2. **Consider adding index.ts to pages/** — If pages are ever imported via namespace (`export * as Pages from './pages'`), they would need index.ts files. Currently, they're imported directly.
3. **Consider adding index.ts to widgets/** — Same as above, if widgets are ever imported via namespace.

## Verification Commands

Run these commands to verify the barrel exports:

```bash
# Check for lint errors
npm run lint

# Build the project
ng build

# Run tests in CI mode
npm run test:ci
```
