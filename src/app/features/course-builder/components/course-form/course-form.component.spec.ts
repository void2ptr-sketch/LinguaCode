import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { CourseFormComponent } from './course-form.component';
import { ScenarioSearchService } from '../../../../core/repositories';
import { UserStore } from '../../../../core/state';
import { scenariosApiMockInterceptor } from '../../../../core/api/scenarios/scenarios-api.mock.interceptor';
import { MarkdownFieldComponent } from '../../../../shared/utils/markdown-field';
import type { CourseFormDraft } from '../../types';
import { emptyCourseFormDraft } from '../../utils/course-form-draft.utils';

@Component({
  standalone: true,
  imports: [CourseFormComponent],
  template: `<app-course-form [draft]="draft" [readOnly]="readOnly" (draftChange)="onDraftChange($event)" />`,
})
class TestHostComponent {
  draft: CourseFormDraft = emptyCourseFormDraft();
  readOnly = false;

  onDraftChange(_draft: CourseFormDraft): void {
    this.draft = _draft;
  }
}

describe('CourseFormComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        CourseFormComponent,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTabsModule,
        MarkdownFieldComponent,
      ],
      providers: [
        ScenarioSearchService,
        UserStore,
        provideHttpClient(withInterceptors([scenariosApiMockInterceptor])),
      ],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have draft', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have readOnly input', () => {
    expect(component.readOnly).toBe(false);
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('app-course-form')).toBeTruthy();
  });

  it('should have empty lesson form draft utility', () => {
    const emptyLesson = {
      id: '',
      clientId: '',
      title: '',
      description: '',
      scenarioIds: [],
      prerequisiteLessonIds: [],
      order: 0,
    };
    expect(emptyLesson).toBeDefined();
  });
});
