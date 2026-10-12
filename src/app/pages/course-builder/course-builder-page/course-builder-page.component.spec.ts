import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { CourseBuilderPageComponent } from './course-builder-page.component';
import { CourseBuilderStore } from '../../../features/course-builder/services/course-builder.store';
import { CourseBuilderDialogService } from '../../../features/course-builder/components/course-builder-dialog/course-builder-dialog.service';
import { UserStore } from '../../../core/state';
import { coursesApiMockInterceptor } from '../../../entities/course/api/mock/courses-api.mock.interceptor';

describe('CourseBuilderPageComponent', () => {
  let fixture: ComponentFixture<CourseBuilderPageComponent>;
  let component: CourseBuilderPageComponent;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {
      /* silence console.error in tests */
    });

    TestBed.configureTestingModule({
      imports: [
        CourseBuilderPageComponent,
        FormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        CourseBuilderStore,
        CourseBuilderDialogService,
        UserStore,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        provideHttpClient(withInterceptors([coursesApiMockInterceptor])),
      ],
    });

    fixture = TestBed.createComponent(CourseBuilderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have CourseBuilderStore injected', () => {
    expect(component.store).toBeDefined();
  });

  it('should have list management methods', () => {
    expect(component.onListScopeChange).toBeDefined();
    expect(component.onListPageChange).toBeDefined();
  });

  it('should have export methods', () => {
    expect(component.exportPdf).toBeDefined();
    expect(typeof component.exportPdf).toBe('function');
  });

  it('should be instantiated', () => {
    expect(component).toBeTruthy();
  });
});
