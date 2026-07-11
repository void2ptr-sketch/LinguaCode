# Паттерн "Dirty State" (Несохранённые изменения)

## Обзор

Паттерн **Dirty State** — это архитектурное решение для отслеживания изменений в формах и редакторах, которые используются в модальных диалогах приложения LinguaCode. Паттерн позволяет определить, были ли внесены изменения в данных с момента их инициализации, и при необходимости предупредить пользователя о потере несохранённых изменений при закрытии.

Связанные документы: [INDEX.md](./INDEX.md) · [MODAL-DIALOG.md](./MODAL-DIALOG.md) · [EDITOR-UX.md](./EDITOR-UX.md).

---

## Проблема

В приложении LinguaCode существует множество форм редактирования:

- Редактор карточек (`CardEditorDialogComponent`)
- Конструктор курсов (`CourseBuilderDialogComponent`)
- Конструктор сценариев (`ScenarioBuilderDialogComponent`)

Все эти формы сопровождаются диалогами, которые:

1. Загружают исходные данные при открытии
2. Позволяют пользователю вносить изменения
3. Требуют подтверждения при закрытии, если есть несохранённые изменения

Без паттерна Dirty State пользователь мог бы случайно закрыть форму, потеряв все внесённые изменения.

---

## Решение

Паттерн Dirty State реализует отслеживание изменений через **сравнение текущего состояния с исходным снимком** (snapshot).

### Архитектурный слой

```
┌──────────────────────────────────────────────────────┐
│ 1. Computed Signal (производное состояние)           │
│    dirty = computed(() => current !== initial)       │
├──────────────────────────────────────────────────────┤
│ 2. Initial Snapshot (исходный снимок)                │
│    initialSnapshot = signal<string>('')              │
├──────────────────────────────────────────────────────┤
│ 3. Current State (текущее состояние)                 │
│    draft = signal<Draft>(emptyDraft())               │
├──────────────────────────────────────────────────────┤
│ 4. Serialization (сериализация для сравнения)        │
│    serializeDraft(draft) → string                    │
└──────────────────────────────────────────────────────┘
```

---

## Реализация

### 1. Сериализация для сравнения

Функция сериализации превращает сложный объект в строку для сравнения:

```typescript
function serializeDraft(draft: CardDraft): string {
  return JSON.stringify(draft);
}
```

### 2. Сигналы состояния

```typescript
// Исходный снимок (неизменяемый)
private readonly initialSnapshot = signal('');

// Текущее состояние (изменяемое)
readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));
```

### 3. Computed сигнал для отслеживания изменений

```typescript
readonly dirty = computed(
  () => serializeDraft(this.draft()) !== this.initialSnapshot()
);
```

### 4. Инициализация снимка

При открытии диалога создаётся снимок текущего состояния:

```typescript
async ngOnInit(): Promise<void> {
  if (this.data.mode === 'create') {
    this.store.startCreate(this.data.kind);
    const nextDraft = this.store.emptyDraft(this.data.kind);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeDraft(nextDraft));
    return;
  }

  await this.store.startEdit(this.data.cardId);
  const editing = this.store.editingCard();

  if (!editing) {
    this.dialogRef.close(undefined);
    return;
  }

  const nextDraft = this.store.cardToDraft(editing);
  this.draft.set(nextDraft);
  this.initialSnapshot.set(serializeDraft(nextDraft));
}
```

---

## Использование в коде

### Проверка перед закрытием

```typescript
async cancel(): Promise<void> {
  if (!(await this.confirmClose())) {
    return;
  }

  this.store.cancelEdit();
  this.dialogRef.close({ saved: false });
}

private async confirmClose(): Promise<boolean> {
  if (!this.dirty()) {
    return true; // Нет изменений — можно закрыть
  }

  // Открыть диалог подтверждения
  const ref = this.dialog.open(CardEditorDiscardDialogComponent, {
    width: 'min(24rem, 96vw)',
    autoFocus: 'first-titled-element',
  });

  return (await firstValueFrom(ref.afterClosed())) === true;
}
```

---

## Примеры реализации в проекте

### 1. CardEditorDialogComponent

**Файл**: `src/app/features/card-editor/components/card-editor-dialog/card-editor-dialog.component.ts`

```typescript
readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));
readonly indexMeta = signal<CardIndexMetaDraft>({...});
private readonly initialSnapshot = signal('');
private readonly initialMetaSnapshot = signal('');

readonly dirty = computed(
  () =>
    serializeDraft(this.draft()) !== this.initialSnapshot() ||
    JSON.stringify(this.indexMeta()) !== this.initialMetaSnapshot()
);
```

**Особенности**:
- Отслеживается изменение двух сущностей: `draft` и `indexMeta`
- Используется два снимка: `initialSnapshot` и `initialMetaSnapshot`

### 2. CourseBuilderDialogComponent

**Файл**: `src/app/features/course-builder/components/course-builder-dialog/course-builder-dialog.component.ts`

```typescript
readonly draft = signal<CourseFormDraft>(emptyCourseFormDraft());
private readonly initialSnapshot = signal('');

readonly dirty = computed(
  () => serializeCourseFormDraft(this.draft()) !== this.initialSnapshot()
);
```

### 3. ScenarioBuilderDialogComponent

**Файл**: `src/app/features/scenario-builder/components/scenario-builder-dialog/scenario-builder-dialog.component.ts`

```typescript
readonly draft = signal<ScenarioFormDraft>(emptyScenarioFormDraft());
private readonly initialSnapshot = signal('');

readonly dirty = computed(
  () => serializeScenarioFormDraft(this.draft()) !== this.initialSnapshot()
);
```

---

## Вариации паттерна

### 1. Множественные снимки

Для форм с несколькими независимыми сущностями:

```typescript
private readonly initialSnapshot = signal('');
private readonly initialMetaSnapshot = signal('');

readonly dirty = computed(
  () =>
    serializeDraft(this.draft()) !== this.initialSnapshot() ||
    JSON.stringify(this.indexMeta()) !== this.initialMetaSnapshot()
);
```

### 2. Комплексная сериализация

Для сложных структур можно использоватьdeep equality:

```typescript
import { isEqual } from 'lodash-es';

readonly dirty = computed(
  () => !isEqual(this.draft(), this.initialDraft())
);
```

### 3. Шаговая валидация

Для многошаговых форм можно проверять "грязность" на уровне шагов:

```typescript
readonly stepDirty = computed(() => {
  const currentStep = this.step();
  return this.steps()[currentStep].dirty;
});
```

---

## Преимущества паттерна

| Преимущество | Описание |
|-------------|----------|
| **Простота** | Не требует сторонних библиотек, использует встроенные возможности Angular |
| **Производительность** | Computed сигналы кэшируются и пересчитываются только при изменении зависимостей |
| **Декларативность** | Состояние "грязности" вычисляется автоматически, без ручного управления |
| **Безопасность** | Защищает пользователя от случайной потери данных |

---

## Рекомендации

### ✅ Делать

- **Использовать JSON.stringify** для простых структур данных
- **Создавать снимок после загрузки данных** в `ngOnInit()`
- **Проверять dirty при отмене** и закрытии диалога
- **Использовать computed** для `dirty` — не меняйте его вручную

### ❌ Не делать

- **Не изменять `dirty` напрямую** — это computed сигнал
- **Не сериализовать большие бинарные данные** (файлы, изображения) — исключите их из сравнения
- **Не использовать `dirty` для валидации фо��мы** — это отдельная ответственность
- **Не хранить снимки в localStorage** — они должны существовать только во время сессии

---

## Метрики

| Метрика | Значение |
|---------|----------|
| Строк кода на компонент | ~15–20 строк |
| Накладные расходы | Минимальные (один computed сигнал + два снимка) |
| Задержка проверки | Мгновенная (computed) |

---

## Связанные паттерны

| Паттерн | Связь |
|---------|-------|
| **Modal Dialogs** | Dirty State используется внутри модальных диалогов для проверки закрытия |
| **Async State** | Dirty State может комбинироваться с loading/error состояниями |
| **Signal-based State** | Основан на Angular Signals (signal + computed) |
| **Discard Confirmation** | Следующий шаг после обнаружения dirty состояния |

---

## Чеклист реализации

- [ ] Определена функция сериализации для текущего состояния
- [ ] Создан `initialSnapshot` signal для хранения исходного значения
- [ ] Создан `dirty` computed сигнал для проверки изменений
- [ ] Снимок обновляется в `ngOnInit()` при загрузке данных
- [ ] Проверка `dirty` реализована в методе `cancel()` или `close()`
- [ ] Диалог подтверждения открыта только при `dirty === true`
- [ ] Компонент использует standalone-архитектуру

---

## Пример полной реализации

```typescript
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

interface FormDraft {
  title: string;
  description: string;
}

function serializeDraft(draft: FormDraft): string {
  return JSON.stringify(draft);
}

@Component({
  selector: 'app-example-dialog',
  template: `
    <h2 mat-dialog-title>Пример</h2>
    <mat-dialog-content>
      <input
        [(ngModel)]="draft().title"
        placeholder="Заголовок"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Отмена</button>
      <button mat-button color="primary" (click)="save()">Сохранить</button>
    </mat-dialog-actions>
  `,
})
export class ExampleDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<ExampleDialogComponent>>(MatDialogRef);

  readonly draft = signal<FormDraft>({ title: '', description: '' });
  private readonly initialSnapshot = signal('');

  readonly dirty = computed(
    () => serializeDraft(this.draft()) !== this.initialSnapshot()
  );

  async ngOnInit(): Promise<void> {
    // Имитация загрузки данных
    const initialData: FormDraft = { title: 'Заголовок', description: 'Описание' };
    this.draft.set(initialData);
    this.initialSnapshot.set(serializeDraft(initialData));
  }

  async save(): Promise<void> {
    // Сохранение данных
    this.dialogRef.close({ saved: true });
  }

  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.dialogRef.close({ saved: false });
  }

  private async confirmClose(): Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }

    // Здесь можно добавить диалог подтверждения
    return confirm('Закрыть без сохранения?');
  }
}
```

---

## Ссылки

- [Angular Signals](https://angular.dev/guide/signals)
- [Computed Signals](https://angular.dev/guide/signals#computed-signals)
- [Angular Material Dialog](https://material.angular.io/components/dialog/overview)
- [MODAL-DIALOG.md](./MODAL-DIALOG.md) — Архитектура модальных диалогов

---

## История

Паттерн Dirty State был интегрирован в LinguaCode на ранних этапах разработки (G0–G3), когда создавалась базовая архитектура модальных редакторов. С тех пор паттерн не претерпел изменений, что подтверждает его устойчивость и эффективность.

---

**Версия документа**: 1.0  
**Последнее обновление**: 2026-07-09  
**Паттерн статус**: ✅ Стабильный
