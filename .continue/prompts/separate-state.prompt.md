---
name: Разделение состояния на компоненты
description: Выделение общего состояния в отдельные store-классы для избежания передачи данных через props и упрощения взаимодействия между компонентами
invokable: true
---

# Цель: Выделить общее состояние из компонентов в отдельные store-классы, чтобы избежать передачи данных через props и упростить взаимодействие между компонентами.

## Контекст проекта

- **Angular 22** — используются signal-based APIs (`signal()`, `computed()`, `toSignal()`)
- **Архитектура состояния**: каждый store — это `@Injectable()` класс с `signal<T>` свойствами, `computed()` для производных значений и императивными методами для мутаций
- **Singleton**: stores обычно `providedIn: 'root'`
- **Паттерн**: `signal` (состояние) + `computed` (производные значения) + методы (мутации)

## Пример существующего паттерна (для референса)

```typescript
// src/app/core/state/user.store.ts
@Injectable({ providedIn: 'root' })
export class UserStore {
  #languagePairs = signal<string[]>([]);
  #activeLanguagePair = signal<string>('en-ru');

  get languagePairs() { return this.#languagePairs.asReadonly(); }
  get activeLanguagePair() { return this.#activeLanguagePair.asReadonly(); }

  activeLanguagePairDisplay = computed(() => {
    const pairs = this.#languagePairs();
    const active = this.#activeLanguagePair();
    const pair = pairs.find(p => p === active);
    return pair ? formatLanguagePair(pair) : active;
  });

  setActiveLanguagePair(pair: string) {
    this.#activeLanguagePair.set(pair);
  }

  addLanguagePair(pair: string) {
    const current = this.#languagePairs();
    if (!current.includes(pair)) {
      this.#languagePairs.set([...current, pair]);
    }
  }
}
```

## Инструкция по выделению состояния

### Шаг 1. Определите общее состояние

Проанализируйте компоненты и найдите состояние, которое:
- Используется в нескольких компонентах
- Передаётся через `@Input()` / `@Output()` на нескольких уровнях
- Синхронизируется между компонентами (например, активная вкладка + список языковых пар)

Типичные кандидаты:
- Активная вкладка / раздел
- Выбранный элемент (course, scenario, card)
- Параметры фильтрации и поиска
- Языковая пара

### Шаг 2. Создайте store-класс

Создайте файл `src/app/features/<feature>/services/<name>.store.ts`:

```typescript
import { Injectable, signal, computed, Signal } from '@angular/core';

export interface CourseDisplaySettingsState {
  activeTab: string;
  languagePairs: string[];
  activeLanguagePair: string;
}

@Injectable({ providedIn: 'root' })
export class CourseDisplaySettingsStore {
  // --- Состояние ---
  #state = signal<CourseDisplaySettingsState>({
    activeTab: 'matrix',
    languagePairs: [],
    activeLanguagePair: 'en-ru',
  });

  // --- Селекторы (read-only) ---
  get activeTab(): Signal<string> { return computed(() => this.#state().activeTab); }
  get languagePairs(): Signal<string[]> { return computed(() => this.#state().languagePairs); }
  get activeLanguagePair(): Signal<string> { return computed(() => this.#state().activeLanguagePair); }

  // --- Производные значения ---
  activeLanguagePairDisplay = computed(() => {
    const pair = this.#state().activeLanguagePair;
    return formatLanguagePair(pair);
  });

  // --- Мутации ---
  setActiveTab(tab: string) {
    this.#state.update(s => ({ ...s, activeTab: tab }));
  }

  setActiveLanguagePair(pair: string) {
    this.#state.update(s => ({ ...s, activeLanguagePair: pair }));
  }

  setLanguagePairs(pairs: string[]) {
    this.#state.update(s => ({ ...s, languagePairs: pairs }));
  }
}
```

### Шаг 3. Обновите компоненты

**До** (данные поднимаются в родительский компонент и передаются через props):

```typescript
// course-settings.component.ts — НЕПРАВИЛЬНО
@Input() activeTab!: string;
@Input() languagePairs!: string[];
@Output() tabChange = new EventEmitter<string>();
@Output() languagePairChange = new EventEmitter<string>();
```

**После** (данные берутся из store):

```typescript
// course-settings.component.ts — ПРАВИЛЬНО
constructor(private store: CourseDisplaySettingsStore) {}

activeTab = this.store.activeTab;
activeLanguagePair = this.store.activeLanguagePair;
languagePairs = this.store.languagePairs;

changeTab(tab: string) {
  this.store.setActiveTab(tab);
}

changeLanguagePair(pair: string) {
  this.store.setActiveLanguagePair(pair);
}
```

**Шаблон**:

```html
<!-- course-settings.component.html -->
<mat-tab-group [selectedIndex]="activeTab() === 'matrix' ? 0 : 1"
               (selectedTabChange)="changeTab($event.index === 0 ? 'matrix' : 'list')">
  <mat-tab label="Матрица"></mat-tab>
  <mat-tab label="Список"></mat-tab>
</mat-tab-group>

<app-language-pair-selector
  [languagePairs]="languagePairs()"
  [activePair]="activeLanguagePair()"
  (pairChange)="changeLanguagePair($event)">
</app-language-pair-selector>
```

### Шаг 4. Удалите лишние @Input / @Output

После миграции компонентов к store:
1. Удалите `@Input()` и `@Output()` декораторы, которые больше не нужны
2. Упростите шаблон родительского компонента — больше не нужно передавать данные вниз
3. Убедитесь, что все зависимые компоненты инжектят store напрямую

### Шаг 5. Проверьте корректность

- [ ] Все компоненты, которым нужно состояние, инжектят store через DI
- [ ] Нет дублирования состояния (state не хранится и в компоненте, и в store)
- [ ] Нет передачи состояния через более 1 уровня компонентов
- [ ] Селекторы возвращают `Signal<T>`, а не прямые `signal()`
- [ ] Мутации используют `update()` для объектных состояний или `set()` для примитивов
- [ ] Нет утечек памяти (signals не требуют подписок, поэтому `ngOnDestroy` не нужен)

## Best Practices

1. **Не используйте standalone `signal()` экспорты** — всегда оборачивайте в injectable-класс
2. **Возвращайте read-only сигналы** через `computed()` — это предотвращает внешние мутации
3. **Используйте `update()` для объектных состояний** — это гарантирует неизменяемость и корректные change detection
4. **Разделяйте ответственность** — store хранит только данные, логика форматирования/вычислений идёт в `computed()`
5. **Не смешивайте HTTP и state** — данные загружает сервис-repository, store только хранит результат
6. **Для сложной логики используйте `effect()`** — только для сайд-эффектов (логирование, синхронизация с localStorage)

## Чего избегать

- ❌ `export const activeTab = signal('default')` — standalone signals, нет инкапсуляции
- ❌ `activeTab$ = activeTab()` в компоненте — это snapshot, а не реактивное значение
- ❌ Передача данных через `@Input` на >1 уровень — «prop drilling»
- ❌ Хранение данных и загрузка в одном месте — разделяйте store и repository
- ❌ Использование `BehaviorSubject` — в проекте принят signal-based подход

## Стандарты кодирования:
- `./continue/agents/angular-architecture.agent.md` — Angular Architecture
- `./continue/rules/*` - правила кодирования
