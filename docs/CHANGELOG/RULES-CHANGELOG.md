# Rules Changelog

> Журнал изменений правил проекта (`.continue/rules/`). Правило ведения — см. `01.meta.13.rules-lifecycle.rule.md`.
> Хранится вне `.continue/rules/`, потому что все `.md`-файлы в этом каталоге автозагружаются Continue как правила.

## 2026-11-13

- **`01.meta.04.tasks-workflow.rule.md`** — расширено: статусы задач (`[→]`, `[x]`, `[✓]`, `[⊘]`, `[!]`), Definition of Done per subtask, same-commit sync (code ↔ docs), expanded task workflow checklist.
  Связано с улучшением координации агентов через TASKS.md.
- **`TASKS.md`** — добавлен статус-легенду, Definition of Done template, матрица «файл ↔ задача ↔ документ», обновлены примеры подзадач (G11a, G14b, G12d, G17a).

## 2026-11-13 (документация Program)

- **`docs/ARCHITECTURE/ARCHITECTURE.program.md`** — добавлены поля `requiredTier`, `languagePairId`, `published` в диаграмму и таблицу сравнения с Course, добавлена секция «Поля Program».
- **`docs/ARCHITECTURE/ARCHITECTURE.course.md`** — добавлен `program-builder` в структуру, добавлена секция «Форма программы (ProgramFormComponent)», обновлена иерархия Course → Program → Lesson.
- **`docs/API/API-CONTRACT.md`** — раздел «Программы» расширен: полная таблица полей `ProgramWritePayload` с указанием required/optional, create/update, описания маппинга (`programDescription`, `authorId`, `languagePairId`).
- **`docs/CHANGELOG/RULES-CHANGELOG.md`** — добавлена запись о документировании API контракта программ.

## 2026-10-18

- **CHANGELOG** — журнал перенесён из `.continue/rules/CHANGELOG.md` в `docs/SYSTEM/RULES-CHANGELOG.md` (в `.continue/rules/` все `.md` автозагружаются как правила Continue и попадают в контекст каждой сессии).
- **`01.meta.13.rules-lifecycle.rule.md`** — добавлено: жизненный цикл правил (триггеры обновления, ревью-цикл, changelog, архивирование).
  Связано с внедрением аудита правил `scripts/audit-rules.mjs` (добавлен в `npm run verify`).
- **`CONTINUE.md`** — добавлен раздел «Obsolete rules» (архив заменённых правил с указанием замены) в конце §8.
- **`01.meta.02.validate-write-arguments.rule.md`** — исправлено front-matter: добавлен `alwaysApply: true`.
- **`01.meta.09.rules-maintenance.rule.md`** — добавлен обязательный чеклист «одно изменение = одно правило» (найти затронутые правила → обновить факты → обновить сводные файлы → запись в changelog → `npm run audit:rules`).
- **`03.angular.01.senior-developer.rule.md`** — исправлен дубликат `lastReviewed`/`reviewInterval` в front-matter.
- **`CONTINUE.md`** — исправлены битые относительные ссылки на `docs/` и `TASKS.md` (`../` → `../../`); в индекс §8 добавлены `01.meta.10`, `01.meta.11`, `01.meta.12`, `01.meta.13`.
