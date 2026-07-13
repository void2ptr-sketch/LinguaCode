# Модальные диалоговые окна (Modal Dialogs)

## Общие принципы

В прижении LinguaCode модальные диалоговые окна реализованы на базе **Angular Material MatDialog** и следуют единому архитектурному паттерну.

---

## 1. Архитектурные слои

Каждое диалоговое окно состоит из трёх слоёв:

```
┌─────────────────────────────────────────────────────┐
│ 1. Types (типы данных)                              │
│    - DialogData  — входные данные                   │
│    - DialogResult  — результат                      │
├─────────────────────────────────────────────────────┤
│ 2. Service (сервис открытия)                        │
│    - open*() методы с защитой от дублирования       │
│    - возвращают Promise<DialogResult | undefined>   │
├─────────────────────────────────────────────────────┤
│ 3. Component (компонент диалога)                    │
│    - Standalone компонент                           │
│    - Signals для состояния                          │
│    - computed для производных значений              │
└─────────────────────────────────────────────────────┘
```

---

## 2. Типы данных (Types)

### Правило: всегда определяйте типизированные типы для данных

```typescript
// ✅ Правильно
export type CardEditorDialogData =
  | { mode: 'create'; kind: CardKind }
  | { mode: 'edit'; cardId: string };

export type CardEditorDialogResult = {
  saved: boolean;
};

// ❌ Неправильно — использование any или void без структуры
```

### Структура типов

| Поле           | Назначение                | Пример                          |
| -------------- | ------------------------- | ------------------------------- | ------------------------------------------- |
| `DialogData`   | Входные данные (контекст) | `{ mode: 'create'               | 'edit', kind?: CardKind, cardId?: string }` |
| `DialogResult` | Результат закрытия        | `{ saved: boolean }` или `void` |

---

## 3. Сервис диалога (Dialog Service)

### Правило: каждый диалог имеет сервис для управления открытием

```typescript
@Injectable({ providedIn: 'root' })
export class CardEditorDialogService {
  private readonly dialog = inject(MatDialog);

  // Защита от дублирования: только один активный диалог
  private activeRef: MatDialogRef<CardEditorDialogComponent, CardEditorDialogResult> | null = null;

  openCreate(kind: CardKind): Promise<CardEditorDialogResult | undefined> {
    return this.open({ mode: 'create', kind });
  }

  openEdit(cardId: string): Promise<CardEditorDialogResult | undefined> {
    return this.open({ mode: 'edit', cardId });
  }

  private open(data: CardEditorDialogData): Promise<CardEditorDialogResult | undefined> {
    // Защита от дублирования
    if (this.activeRef) {
      return Promise.resolve(undefined);
    }

    this.activeRef = this.dialog.open(CardEditorDialogComponent, {
      data,
      panelClass: 'card-editor-dialog',
      width: '960px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: 'first-titled-element',
    });

    return firstValueFrom(this.activeRef.afterClosed()).finally(() => {
      this.activeRef = null;
    });
  }
}
```

### Ключевые параметры MatDialog

| Параметр       | Значение                 | Назначение                               |
| -------------- | ------------------------ | ---------------------------------------- |
| `panelClass`   | `'card-editor-dialog'`   | CSS-класс для стилизации                 |
| `width`        | `'960px'`                | Базовая ширина                           |
| `maxWidth`     | `'96vw'`                 | Максимальная ширина (viewport)           |
| `maxHeight`    | `'90vh'`                 | Максимальная высота (viewport)           |
| `disableClose` | `true`                   | Блокировка закрытия по Escape (для форм) |
| `autoFocus`    | `'first-titled-element'` | Автофокус на первый элемент              |

---

## 4. Компонент диалога (Dialog Component)

### Базовая структура

```typescript
@Component({
  selector: 'app-card-editor-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    // ... другие импорты
  ],
  templateUrl: './card-editor-dialog.component.html',
  styleUrl: './card-editor-dialog.component.scss',
})
export class CardEditorDialogComponent implements OnInit {
  // Впрыскивание зависимостей
  private readonly dialogRef = inject<MatDialogRef<Component, Result>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly store = inject(StoreService);

  // Signals для состояния
  readonly draft = signal<Draft>(emptyDraft());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed для производных значений
  readonly dirty = computed(() => /* ... */);
  readonly title = computed(() => /* ... */);

  // Инициализация
  async ngOnInit(): Promise<void> {
    if (this.data.mode === 'create') {
      this.store.startCreate();
      this.draft.set(emptyDraft());
      return;
    }

    await this.store.startEdit(this.data.cardId);
    const editing = this.store.editing();
    if (!editing) {
      this.dialogRef.close(undefined);
      return;
    }

    this.draft.set(draftFromEntity(editing));
  }

  // Сохранение
  async save(): Promise<void> {
    const payload = preparePayload(this.draft());
    const saved = await this.store.save(payload);

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  // Отмена с проверкой несохранённых изменений
  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.store.cancel();
    this.dialogRef.close({ saved: false });
  }

  // Подтверждение закрытия
  private async confirmClose(): Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }

    const ref = this.dialog.open(DiscardDialogComponent, {
      width: 'min(24rem, 96vw)',
      autoFocus: 'first-titled-element',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
```

### Паттерн "грязности" (Dirty State)

```typescript
// Функция сериализации для сравнения
function serializeDraft(draft: Draft): string {
  return JSON.stringify(draft);
}

// Computed сигнал для отслеживания изменений
private readonly initialSnapshot = signal('');
readonly dirty = computed(
  () => serializeDraft(this.draft()) !== this.initialSnapshot()
);

// В ngOnInit
this.initialSnapshot.set(serializeDraft(this.draft()));
```

---

## 5. HTML-шаблон

### Базовая структура

```html
@if (loading()) {
<div class="dialog__state">
  <mat-spinner></mat-spinner>
</div>
} @else if (error()) {
<div class="dialog__error">{{ error() }}</div>
} @else {
<div class="dialog__content">
  <!-- Форма диалога -->
  <app-entity-form [draft]="draft()" (draftChange)="updateDraft($event)" />
</div>
}

<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">Отмена</button>
  <button mat-flat-button color="primary" (click)="save()">Сохранить</button>
</mat-dialog-actions>
```

### Структура шаблона

1. **Состояние загрузки** — `mat-spinner` при `loading()`
2. **Состояние ошибки** — сообщение об ошибке
3. **Основной контент** — форма или информация
4. **Кнопки действий** — `mat-dialog-actions` с `align="end"`

---

## 6. SCSS-стилизация

### Компонентные стили

```scss
// Компонентные модификаторы
.dialog__content {
  display: block;
  min-width: min(100%, 20rem);
  padding-top: 0.25rem;
}

.dialog__state {
  display: grid;
  gap: 1rem;
  justify-items: center;
  padding: 2rem 0;
}

.dialog__error {
  color: var(--mat-sys-error);
  margin: 0 0 1rem;
}
```

### Глобальные стили (styles.scss)

```scss
// Responsive для каждого типа диалога
.card-editor-dialog {
  @media (max-width: 47.99rem) {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh;
    max-height: 100vh !important;
  }
}

.card-editor-dialog .mat-mdc-dialog-content {
  max-height: calc(90vh - 8rem);

  @media (max-width: 47.99rem) {
    max-height: calc(100vh - 8rem);
  }
}
```

### Правило: каждый диалог получает уникальный `panelClass`

| Диалог           | panelClass                | Базовая ширина |
| ---------------- | ------------------------- | -------------- |
| Card Editor      | `card-editor-dialog`      | `960px`        |
| Scenario Builder | `scenario-builder-dialog` | `1100px`       |
| Course Builder   | `course-builder-dialog`   | `1100px`       |
| Card Try         | `card-try-dialog`         | `720px`        |

---

## 7. Нестандартные диалоги (Simple Dialogs)

Для простых диалогов подтверждения (без форм) используется inline-шаблон:

```typescript
@Component({
  selector: 'app-discard-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Закрыть без сохранения?</h2>
    <mat-dialog-content>Несохранённые изменения будут потеряны.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Остаться</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Закрыть</button>
    </mat-dialog-actions>
  `,
})
export class DiscardDialogComponent {}
```

### Особенности

- **Standalone компонент** без внешних зависимостей
- **Inline-шаблон** — нет отдельного HTML-файла
- **`[mat-dialog-close]`** — закрытие с значением без вызова `dialogRef.close()`
- **`align="end"`** — кнопки справа

---

## 8. Вложенные диалоги (Nested Dialogs)

Для подтверждения закрытия с несохранёнными изменениями:

```typescript
private async confirmClose(): Promise<boolean> {
  if (!this.dirty()) {
    return true;
  }

  const ref = this.dialog.open(DiscardDialogComponent, {
    width: 'min(24rem, 96vw)',
    autoFocus: 'first-titled-element',
  });

  return (await firstValueFrom(ref.afterClosed())) === true;
}
```

### Правило: вложенные диалоги должны быть максимально простыми

- Только заголовок, текст, кнопки
- Без сложных форм или сервисов
- Возвращают `boolean` или `enum`

---

## 9. Паттерны использования

### Открытие диалога из компонента

```typescript
// ❌ Неправильно — прямой вызов MatDialog
const ref = this.dialog.open(CardEditorDialogComponent, { data });

// ✅ Правильно — через сервис
const result = await this.dialogService.openCreate(CardKind.select);
if (result?.saved) {
  // Обновление списка
}
```

### Обработка результата

```typescript
// Диалог с результатом
const result = await this.dialogService.openEdit(cardId);
if (result?.saved) {
  await this.store.loadList();
}

// Диалог без результата (void)
await this.dialogService.open(cardId);
// После закрытия ничего не нужно делать
```

---

## 10. Чеклист создания диалога

- [ ] Определены типы `DialogData` и `DialogResult`
- [ ] Создан сервис с методами `open*()` и защитой от дублирования
- [ ] Компонент использует `signals` для состояния
- [ ] Реализован паттерн "грязности" для форм
- [ ] Добавлена проверка несохранённых изменений при отмене
- [ ] Указан `panelClass` для стилизации
- [ ] Добавлены responsive-стили в `styles.scss`
- [ ] Используется `firstValueFrom` для ожидания результата
- [ ] Очистка `activeRef` в `finally()`

---

## Примеры в проекте

| Диалог           | Путь                          | Назначение                            |
| ---------------- | ----------------------------- | ------------------------------------- |
| Card Editor      | `card-editor-dialog/`         | Создание/редактирование карточки      |
| Scenario Builder | `scenario-builder-dialog/`    | Создание/редактирование сценария      |
| Course Builder   | `course-builder-dialog/`      | Создание/редактирование курса         |
| Card Try         | `card-try-dialog/`            | Тестовый прогон карточки              |
| Discard          | `card-editor-discard-dialog/` | Подтверждение закрытия без сохранения |
| Reset Overlay    | `reset-overlay-dialog/`       | Сброс пользовательских данных         |

---

## Ссылки

- [Angular Material Dialog API](https://material.angular.io/components/dialog/overview)
- [Angular Signals](https://angular.dev/guide/signals)
- [Standalone Components](https://angular.dev/guide/components/standalone-components)
