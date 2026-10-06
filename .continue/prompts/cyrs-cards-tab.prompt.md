---
name: Реализациия интерфейса с табуляцией в разделе "Каталог курсов"
description: Рефакторинг "Каталог курсов" 
invokable: true
---

# Используй правила из `.continue/rules/*.md`

# реализациия интерфейса с табуляцией в разделе "Каталог курсов"

# Создание структуры компонентов
```
src/app/features/course-catalog/
├── components/
│   ├── course-catalog/
│   │   ├── course-catalog.component.ts
│   │   └── course-catalog.component.html
│   ├── course-card-list/
│   │   ├── course-card-list.component.ts
│   │   └── course-card-list.component.html
│   ├── course-settings/
│   │   ├── course-settings.component.ts
│   │   └── course-settings.component.html
│   └── program-list/
│       ├── program-list.component.ts
│       └── program-list.component.html
```

# Основной компонент CourseCatalogComponent

```
import { Component, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-course-catalog',
  imports: [
    CommonModule,
    MatTabsModule,
    CourseCardListComponent,
    CourseSettingsComponent,
    ProgramListComponent,
  ],
  standalone: true,
})
export class CourseCatalogComponent {
  activeTab = signal<'courses' | 'settings' | 'programs'>('courses');
  activeLanguagePair = signal<string>('en-ru');

  tabs = [
    { id: 'courses', label: 'Курсы', component: () => import('./course-card-list/course-card-list.component') },
    { id: 'settings', label: 'Настройки', component: () => import('./course-settings/course-settings.component') },
    { id: 'programs', label: 'Программы', component: () => import('./program-list/program-list.component') },
  ];

  changeLanguagePair(pair: string) {
    this.activeLanguagePair.set(pair);
  }
}
```
# Табы в шаблоне
```
<mat-tab-group [selectedTab]="activeTab()" (selectedTabChange)="activeTab.set($event.id as 'courses' | 'settings' | 'programs')">
  <mat-tab *ngFor="let tab of tabs" [id]="tab.id">
    <ng-template mat-tab-label>
      {{ tab.label }}
    </ng-template>
    <ng-container *matTabContent>
      <ng-container *ngIf="tab.component(); let component">
        <component [activeLanguage]="activeLanguagePair()" (languageChange)="changeLanguagePair($event)"></component>
      </ng-container>
    </ng-container>
  </mat-tab>
</mat-tab-group>
```

# Обновление маршрутов
В каждом табе можно реагировать на изменение языковой пары:
```
@Component({
  selector: 'app-course-card-list',
  imports: [
    CommonModule,
    NgOptimizedImage,
  ],
  standalone: true,
})
export class CourseCardListComponent {
  @Input() activeLanguage!: string;
  @Output() languageChange = new EventEmitter<string>();

  // Логика для обработки языковой пары
}
```

## Дополнительные настройки
- Добавьте иконки к табам через mat-tab-icon для更好的 UX
- Настройте анимации для плавного переключения табов
- Добавьте обработчик ошибок для ленивой загрузки

## Этот подход:

- Использует Angular Material для готового решения
- Поддерживает ленивую загрузку
- Использует Signals для управления состоянием
- Соответствует Angular 22 стандартам


 # Ознакомся с правилами из`.continue/agents/angular-testing.agent.md`
 напиши тесты для:
 - `course-card-list.component`
 - `course-catalog-page.component`
 - `course-settings.component`
 - `program-list.component`


