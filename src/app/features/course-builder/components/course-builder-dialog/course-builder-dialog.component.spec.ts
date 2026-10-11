import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { CourseBuilderDialogComponent } from './course-builder-dialog.component';
import { CourseBuilderStore } from '../../services/course-builder.store';
import { CoursePdfExportService } from '../../services/course-pdf-export.service';
import { scenariosApiMockInterceptor } from '../../../../core/api/scenarios/scenarios-api.mock.interceptor';

describe('CourseBuilderDialogComponent', () => {
  let fixture: ComponentFixture<CourseBuilderDialogComponent>;
  let component: CourseBuilderDialogComponent;

  const mockData = {
    mode: 'create' as const,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CourseBuilderDialogComponent,
        MatButtonModule,
        MatDialogModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        CourseBuilderStore,
        CoursePdfExportService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        provideHttpClient(withInterceptors([scenariosApiMockInterceptor])),
      ],
    });

    fixture = TestBed.createComponent(CourseBuilderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have CourseBuilderStore injected', () => {
    expect(component.store).toBeDefined();
  });

  it('should have draft signal', () => {
    expect(component.draft()).toBeDefined();
    expect(component.draft().title).toBe('');
  });

  it('should have dirty computed', () => {
    expect(component.dirty()).toBe(false);
  });

  it('should have title computed', () => {
    expect(component.title()).toBe('Новый курс');
  });

  it('should have saveCourse method', () => {
    expect(component.saveCourse).toBeDefined();
    expect(typeof component.saveCourse).toBe('function');
  });

  it('should have save and export methods', () => {
    expect(component.saveCourse).toBeDefined();
    expect(component.exportPdf).toBeDefined();
  });

  it('should be instantiated', () => {
    expect(component).toBeTruthy();
  });
});
