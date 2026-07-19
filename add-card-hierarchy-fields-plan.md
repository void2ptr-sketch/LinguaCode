# Plan: Add `courseId`, `lessonId`, `scenarioId` to Card Files

## Objective

Add the hierarchy fields `courseId`, `lessonId`, `scenarioId` to every card object inside each file in `/public/data/cards/*.json`. These fields should be placed **after** the `"title"` field in each card.

## Current State

| File | Cards | Has `scenarioId` at top level? | Cards have hierarchy fields? |
|------|-------|-------------------------------|------------------------------|
| `demo-cards.json` | 30 cards | ✅ `"scenarioId": "demo-scenario"` | ❌ No per-card fields |
| `perl-interview-cards.json` | ~150 cards | ❌ No | ❌ No |
| `perl-db-cards.json` | 0 cards (empty array) | ❌ No | N/A (empty) |
| `radicals-course-cards.json` | 214 cards | ❌ No | ❌ No |

## Data Model (Relationships)

```
Course (courseId)
  └── Lesson (lessonId, belongs to course via courseId)
        └── Scenario (scenarioId, belongs to lesson via lesson.scenarioIds[])
              └── Cards (belong to scenario via scenario.cardSource.cardIds[])
```

## Mapping Logic per File

### 1. `demo-cards.json`
- **Top-level** `"scenarioId": "demo-scenario"` exists
- Cards are referenced in scenarios:
  - `demo-scenario` → cards: `select-1`, `select-2`, `select-3`
  - `scenario-zh-greetings` → cards: `select-zh-1`, `memory-zh-1`, `symbol-zh-1`, `sound-zh-1`
  - `scenario-zh-phonetics` → cards: `keyboard-zh-pinyin-1`, `keyboard-zh-ipa-1`, `tone-ma-1`
  - `scenario-zh-characters` → cards: `draw-nihao-1`, `draw-henbang-1`, `draw-bowuguan-1`, `draw-ren-1`, `draw-hao-1`, `keyboard-zh-1`, `reading-xing-1`
  - `scenario-zh-review` → cards: `timed-zh-1`, `select-zh-1`, `memory-zh-1`
  - `scenario-code-demo` → cards: `code-select-perl-1`, `code-select-java-1`, `code-select-cpp-1`
- **Strategy**: Use `cardToScenarioMap` from `cardSource.cardIds` in scenarios. Fallback to top-level `data.scenarioId` for cards not found in any scenario.

### 2. `perl-interview-cards.json`
- Card IDs follow pattern: `card-perl-sXX-qYY-...`
- Scenario IDs follow pattern: `scenario-perl-sXX-qYY`
- **Strategy**: Extract `scenario-perl-sXX-qYY` from card ID via regex `^(card-perl-s\d+-q\d+)`, then look up `courseId`/`lessonId` from `scenarioMap`.

### 3. `perl-db-cards.json`
- Currently empty (`"cards": []`). No action needed.

### 4. `radicals-course-cards.json`
- Card IDs follow pattern: `draw-radical-NNN`
- Scenarios are grouped by 20 radicals each: `scenario-radicals-01` (1-20), ..., `scenario-radicals-11` (201-214)
- **Strategy**: Compute `scenarioIndex = Math.min(Math.floor((num - 1) / 20), 10)`, then `scenario-radicals-{scenarioIndex+1}`.

## Lesson Resolution

Once `scenarioId` is known, look up `lessonId` and `courseId` from the `scenarioMap` built from:
1. All courses → their lessons → each lesson's `scenarioIds[]`
2. This gives: `scenarioId → { courseId, lessonId }`

## Implementation

The existing script [`scripts/add-card-hierarchy-fields.mjs`](scripts/add-card-hierarchy-fields.mjs) already implements all of the above logic. The task is to **run this script**.

### Execution

```bash
node scripts/add-card-hierarchy-fields.mjs
```

### Expected Output

The script will:
1. Load all scenario files and course files
2. Build `scenarioMap` (scenarioId → { courseId, lessonId })
3. Build `cardToScenarioMap` (cardId → scenarioId) from `cardSource.cardIds`
4. For each card file, iterate cards and add `courseId`, `lessonId`, `scenarioId` after `title`
5. Write updated files back

## Verification

After running, verify by checking that:
- Every card in `demo-cards.json` has `courseId`, `lessonId`, `scenarioId`
- Every card in `perl-interview-cards.json` has these fields
- `perl-db-cards.json` remains empty (no cards)
- Every card in `radicals-course-cards.json` has these fields
