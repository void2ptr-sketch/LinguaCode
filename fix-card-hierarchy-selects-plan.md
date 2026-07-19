# Plan: Fix Course/Lesson/Scenario `<select>` Population in Card Editor

## Problem

The card editor page at `/tools/cards` uses `CardCatalogFiltersComponent` which has `<select>` elements for **Курс (Course)**, **Урок (Lesson)**, and **Сценарий (Scenario)**. These selects are not populated with data from the JSON files in `public/data/cards/*.json`.

## Root Cause Analysis

The data flow has **multiple breaks** across several layers:

### Layer 1: Card Index (`cardToIndexEntry`)

`cardToIndexEntry()` builds a `CardIndexEntry` from a `Card` object. The `Card` type already has `courseId?`, `lessonId?`, `scenarioId?` fields (defined in `CardBase`). The `CardIndexEntry` type also has these fields.

**However**, `cardToIndexEntry()` does NOT propagate these fields from `Card` to `CardIndexEntry`. The returned object omits `courseId`, `lessonId`, `scenarioId`.

This means the search index has no hierarchy data, so filtering by course/lesson/scenario returns no results.

### Layer 2: Card Drafts (`CardDraft` types)

The `CardDraft` types used in the card editor form do NOT include `courseId`, `lessonId`, or `scenarioId` fields. When a card is loaded for editing via `cardToDraft()`, these fields are silently dropped. When a new card is created via `emptyCardDraft()`, these fields are not initialized.

### Layer 3: Card Normalization (`normalizeCardDraft`)

The `normalizeCardDraft()` and all its sub-functions do NOT include `courseId`, `lessonId`, `scenarioId` in the normalized output. So even if a draft had these fields, they'd be lost on save.

### Layer 4: Card Editor Dialog

The `CardEditorDialogComponent` does not use `CardCatalogHierarchyService` to load courses/lessons/scenarios for the form selects.

### Layer 5: Card Form UI

The `CardFormComponent` template does not include `<select>` elements for Course, Lesson, Scenario in the "Вопрос" tab.

## Data Model

```
Course (courseId)
  └── Lesson (lessonId, linked via courseId)
        └── Scenario (scenarioId, linked via lesson.scenarioIds[])
              └── Cards (linked via scenario.cardSource.cardIds[])
```

JSON data files already have hierarchy fields on cards:
- `demo-cards.json`: cards have `courseId`, `lessonId`, `scenarioId`
- `perl-interview-cards.json`: cards have these fields
- `radicals-course-cards.json`: cards have these fields

The `add-card-hierarchy-fields.mjs` script was created to add these fields to the JSON files.

## Implementation Steps

### Step 1: Propagate hierarchy fields in `cardToIndexEntry`

**File:** `src/app/core/data/cards/card-index.mapper.ts`

Add `courseId`, `lessonId`, `scenarioId` to the returned `CardIndexEntry` object.

### Step 2: Add hierarchy fields to `CardDraft` types

**File:** `src/app/features/card-editor/types/card-draft.types.ts`

Add `courseId?`, `lessonId?`, `scenarioId?` to each `CardDraft` variant type.

### Step 3: Update `cardToDraft` to preserve hierarchy fields

**File:** `src/app/features/card-editor/utils/card-draft.utils.ts`

In `cardToDraft()`, extract and include hierarchy fields from the card into each draft case.

### Step 4: Update `emptyCardDraft` to include hierarchy fields

**File:** `src/app/features/card-editor/utils/card-draft.utils.ts`

In `emptyCardDraft()`, add empty hierarchy fields (`courseId: ''`, `lessonId: ''`, `scenarioId: ''`) to each draft.

### Step 5: Update `normalizeCardDraft` to preserve hierarchy fields

**File:** `src/app/features/card-editor/utils/card-validation.utils.ts`

In each normalize function, add hierarchy fields to the returned `Card` object:
```typescript
courseId: draft.courseId || undefined,
lessonId: draft.lessonId || undefined,
scenarioId: draft.scenarioId || undefined,
```

### Step 6: Add hierarchy selects to the card form UI

**File:** `src/app/features/card-editor/components/card-form/card-form.component.html`

Add Course, Lesson, Scenario `<select>` elements in the "Вопрос" tab, after the language selects and before the title field. The selects should cascade: Course → Lesson → Scenario.

### Step 7: Add hierarchy service integration to `CardFormComponent`

**File:** `src/app/features/card-editor/components/card-form/card-form.component.ts`

Inject `CardCatalogHierarchyService` and add:
- Signals for `availableCourses`, `availableLessons`, `availableScenarios`
- Methods `updateCourseId()`, `updateLessonId()`, `updateScenarioId()` that update the draft and load dependent options
- Load courses on init based on the known/learning language pair

### Step 8: Run the data migration script

```bash
node scripts/add-card-hierarchy-fields.mjs
```

This ensures all JSON card files have `courseId`, `lessonId`, `scenarioId` fields.

## Verification

1. **Data layer:** Check that `cardToIndexEntry` returns entries with `courseId`, `lessonId`, `scenarioId`
2. **Search layer:** Check that `matchesCardIndexEntry` filters correctly by these fields
3. **Editor form:** Check that Course select is populated when opening card editor
4. **Cascade:** Check that selecting a Course populates Lessons, and selecting a Lesson populates Scenarios
5. **Save/load cycle:** Check that hierarchy fields are preserved when saving and re-opening a card
6. **New card:** Check that hierarchy fields can be set on a newly created card

## Architecture Diagram

```mermaid
flowchart LR
    A[JSON files<br/>public/data/cards/*.json] -->|loadFixture| B[CardRepository]
    B -->|normalizeLegacyCards| C[Card[]]
    C -->|cardToIndexEntry| D[CardIndexEntry[]]
    D -->|filterCardIndex| E[Search Results]
    C -->|cardToDraft| F[CardDraft]
    F -->|normalizeCardDraft| C

    G[Course JSON] -->|loadCourses| H[CardCatalogHierarchyService]
    H -->|loadLessons| I[Lesson Options]
    H -->|getScenariosForLesson| J[Scenario Options]

    K[CardFormComponent] -->|injects| H
    K -->|displays| L[Course Select]
    K -->|displays| M[Lesson Select]
    K -->|displays| N[Scenario Select]

    L -->|onChange| M
    M -->|onChange| N
```

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/core/data/cards/card-index.mapper.ts` | Add `courseId`, `lessonId`, `scenarioId` to returned `CardIndexEntry` |
| 2 | `src/app/features/card-editor/types/card-draft.types.ts` | Add `courseId?`, `lessonId?`, `scenarioId?` to all `CardDraft` types |
| 3 | `src/app/features/card-editor/utils/card-draft.utils.ts` | Preserve hierarchy fields in `cardToDraft` and `emptyCardDraft` |
| 4 | `src/app/features/card-editor/utils/card-validation.utils.ts` | Preserve hierarchy fields in all `normalize*CardDraft` functions |
| 5 | `src/app/features/card-editor/components/card-form/card-form.component.ts` | Add hierarchy service integration, signals, and methods |
| 6 | `src/app/features/card-editor/components/card-form/card-form.component.html` | Add Course/Lesson/Scenario `<select>` elements |
| 7 | `scripts/add-card-hierarchy-fields.mjs` | Run to populate JSON data |
